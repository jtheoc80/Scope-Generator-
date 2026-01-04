import { db } from "@/server/db";
import { sql } from "drizzle-orm";
import { OpenAIImageEmbeddingProvider } from "./embeddings/provider";
import { averageVectors, parsePgVector, pgVectorLiteral } from "./db";
import { parseS3Url } from "@/src/lib/mobile/storage/s3";

const WORKER_ID = `similarity-${process.pid}-${Math.random().toString(16).slice(2)}`;
let started = false;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function backoffSeconds(attempts: number) {
  // 0->0s, 1->2s, 2->5s, 3->15s, 4->30s, then 60s
  const table = [0, 2, 5, 15, 30];
  return table[Math.min(attempts, table.length - 1)] ?? 60;
}

export async function enqueueEmbeddingJob(jobId: number) {
  await db.execute(
    sql`
      INSERT INTO job_embedding_jobs (job_id, status, attempts, next_attempt_at)
      SELECT ${jobId}, 'pending', 0, NOW()
      WHERE NOT EXISTS (
        SELECT 1
        FROM job_embedding_jobs
        WHERE job_id = ${jobId}
          AND status IN ('pending', 'processing')
      )
    `
  );
}

export function startSimilarJobEmbeddingWorker() {
  if (started) return;
  started = true;

  // Best-effort in-process worker (mirrors mobile draft worker pattern).
  void (async () => {
    while (true) {
      try {
        await processOne();
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("similarJobEmbeddingWorker.error", { workerId: WORKER_ID, message: msg });
      }
      await sleep(500);
    }
  })();
}

export function ensureSimilarJobEmbeddingWorker() {
  if (!started) startSimilarJobEmbeddingWorker();
}

async function processOne() {
  const now = new Date();
  const lockExpiry = new Date(now.getTime() - 2 * 60 * 1000);

  const candidates = await db.execute<{
    id: number;
    job_id: number;
    attempts: number;
  }>(
    sql`
      SELECT id, job_id, attempts
      FROM job_embedding_jobs
      WHERE status = 'pending'
        AND (next_attempt_at IS NULL OR next_attempt_at <= NOW())
      ORDER BY created_at DESC
      LIMIT 5
    `
  );

  for (const draft of candidates.rows) {
    const locked = await db.execute<{ id: number; job_id: number; attempts: number }>(
      sql`
        UPDATE job_embedding_jobs
        SET
          locked_by = ${WORKER_ID},
          locked_at = NOW(),
          status = 'processing',
          started_at = COALESCE(started_at, NOW()),
          attempts = attempts + 1,
          updated_at = NOW()
        WHERE id = ${draft.id}
          AND (locked_at IS NULL OR locked_at <= ${lockExpiry})
        RETURNING id, job_id, attempts
      `
    );

    if (locked.rows.length === 0) continue;
    await runJob(locked.rows[0].job_id, locked.rows[0].id, locked.rows[0].attempts);
    return;
  }
}

async function runJob(jobId: number, jobEmbeddingJobId: number, attempts: number) {
  const provider = new OpenAIImageEmbeddingProvider();
  const model = process.env.OPENAI_IMAGE_EMBEDDING_MODEL || "text-embedding-3-small";

  try {
    // 1) Load photos for job
    const photos = await db.execute<{ id: number; s3_key: string }>(
      sql`SELECT id, s3_key FROM photos WHERE job_id = ${jobId} ORDER BY created_at ASC`
    );

    if (photos.rows.length === 0) {
      throw new Error("NO_PHOTOS: No photos found for job");
    }

    // 2) Ensure photo embeddings exist
    for (const p of photos.rows) {
      const exists = await db.execute<{ ok: boolean }>(
        sql`
          SELECT TRUE as ok
          FROM photo_embeddings
          WHERE photo_id = ${p.id} AND model = ${model}
          LIMIT 1
        `
      );

      if (exists.rows.length > 0) continue;

      const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL;
      if (!publicBaseUrl) throw new Error("S3_PUBLIC_BASE_URL is required");
      const publicUrl = `${publicBaseUrl.replace(/\/+$/, "")}/${p.s3_key.replace(/^\/+/, "")}`;

      const emb = await provider.embedImage({ imageUrl: publicUrl, s3Ref: parseS3Url(publicUrl) });
      if (emb.model !== model) {
        // Keep DB model column consistent with lookup key.
        throw new Error(`MODEL_MISMATCH: provider returned ${emb.model}, expected ${model}`);
      }

      const literal = pgVectorLiteral(emb.embedding);

      await db.execute(
        sql`
          INSERT INTO photo_embeddings (photo_id, job_id, embedding, model)
          VALUES (${p.id}, ${jobId}, ${literal}::vector, ${model})
          ON CONFLICT (photo_id, model)
          DO NOTHING
        `
      );
    }

    // 3) Recompute job embedding as average of all photo embeddings
    const rows = await db.execute<{ embedding: string }>(
      sql`SELECT embedding::text as embedding FROM photo_embeddings WHERE job_id = ${jobId} AND model = ${model}`
    );

    const vectors = rows.rows.map((r) => parsePgVector(r.embedding)).filter((v) => v.length > 0);
    if (vectors.length === 0) throw new Error("NO_EMBEDDINGS: No photo embeddings to aggregate");

    const avg = averageVectors(vectors);
    const avgLiteral = pgVectorLiteral(avg);

    // Backward-compat: some DBs may have an older `job_embeddings` schema without a `model` column.
    // Prefer writing `model` when available, but fall back to a minimal upsert when it's not.
    try {
      await db.execute(
        sql`
          INSERT INTO job_embeddings (job_id, embedding, model, updated_at)
          VALUES (${jobId}, ${avgLiteral}::vector, ${model}, NOW())
          ON CONFLICT (job_id)
          DO UPDATE SET embedding = EXCLUDED.embedding, model = EXCLUDED.model, updated_at = NOW()
        `
      );
    } catch (e) {
      const err = e as { code?: string; message?: string };
      // Postgres: 42703 = undefined_column
      if (err?.code !== "42703") throw e;
      await db.execute(
        sql`
          INSERT INTO job_embeddings (job_id, embedding, updated_at)
          VALUES (${jobId}, ${avgLiteral}::vector, NOW())
          ON CONFLICT (job_id)
          DO UPDATE SET embedding = EXCLUDED.embedding, updated_at = NOW()
        `
      );
    }

    // 4) Mark done
    await db.execute(
      sql`
        UPDATE job_embedding_jobs
        SET
          status = 'done',
          error = NULL,
          finished_at = NOW(),
          updated_at = NOW(),
          locked_by = NULL,
          locked_at = NULL
        WHERE id = ${jobEmbeddingJobId}
      `
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const next = new Date(Date.now() + backoffSeconds(attempts) * 1000);
    const isFinalFailure = attempts >= 5;

    await db.execute(
      sql`
        UPDATE job_embedding_jobs
        SET
          status = ${isFinalFailure ? "failed" : "pending"},
          error = ${msg},
          next_attempt_at = ${isFinalFailure ? null : next},
          finished_at = ${isFinalFailure ? new Date() : null},
          updated_at = NOW(),
          locked_by = NULL,
          locked_at = NULL
        WHERE id = ${jobEmbeddingJobId}
      `
    );

    if (isFinalFailure) {
      console.error("similarJobEmbeddingWorker.failed", { jobId, jobEmbeddingJobId, attempts, error: msg });
    }
  }
}

