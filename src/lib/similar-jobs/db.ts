import { db } from "@/lib/services/db";
import { sql } from "drizzle-orm";
import { parseS3Url } from "@/src/lib/mobile/storage/s3";

export function pgVectorLiteral(vec: number[]) {
  // pgvector accepts: '[1,2,3]'::vector
  // Keep it compact but deterministic.
  return `[${vec.map((v) => (Number.isFinite(v) ? v : 0)).join(",")}]`;
}

export function parsePgVector(text: string): number[] {
  // Common formats: "[1,2,3]" or "(1,2,3)" depending on driver settings.
  const trimmed = text.trim().replace(/^[\[\(]/, "").replace(/[\]\)]$/, "");
  if (!trimmed) return [];
  return trimmed.split(",").map((s) => Number(s.trim()));
}

export function averageVectors(vectors: number[][]): number[] {
  if (vectors.length === 0) return [];
  const dim = vectors[0].length;
  const sum = new Array<number>(dim).fill(0);
  for (const v of vectors) {
    for (let i = 0; i < dim; i++) sum[i] += v[i] ?? 0;
  }
  for (let i = 0; i < dim; i++) sum[i] /= vectors.length;
  return sum;
}

export function s3KeyFromPublicUrl(publicUrl: string): string | null {
  const ref = parseS3Url(publicUrl);
  return ref?.key ?? null;
}

export async function upsertPhotoRow(params: { jobId: number; publicUrl: string }) {
  const key = s3KeyFromPublicUrl(params.publicUrl);
  if (!key) throw new Error("S3_KEY_PARSE_ERROR: Could not parse s3_key from publicUrl");

  // Always return an id (insert-or-update trick).
  const result = await db.execute<{
    id: string | number;
  }>(
    sql`
      INSERT INTO photos (job_id, s3_key)
      VALUES (${params.jobId}, ${key})
      ON CONFLICT (job_id, s3_key)
      DO UPDATE SET s3_key = EXCLUDED.s3_key
      RETURNING id
    `
  );

  const idRaw = result.rows[0]?.id;
  const photoId = typeof idRaw === "string" ? Number(idRaw) : Number(idRaw);
  if (!Number.isFinite(photoId)) throw new Error("DB_ERROR: Failed to upsert photos row");

  return { photoId, s3Key: key };
}

export async function enqueueJobEmbedding(params: { jobId: number }) {
  // Enqueue only if no pending/processing row exists (keeps queue small).
  await db.execute(
    sql`
      INSERT INTO job_embedding_jobs (job_id, status, attempts, next_attempt_at)
      SELECT ${params.jobId}, 'pending', 0, NOW()
      WHERE NOT EXISTS (
        SELECT 1
        FROM job_embedding_jobs
        WHERE job_id = ${params.jobId}
          AND status IN ('pending', 'processing')
      )
    `
  );
}

