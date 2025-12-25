import { db } from "@/server/db";
import { mobileJobPhotos } from "@shared/schema";
import { and, desc, eq, isNull, lte, or } from "drizzle-orm";
import { analyzeWithRekognition } from "./rekognition";
import { analyzeWithGptVision, validateFindings } from "./gpt";

const WORKER_ID = `vision-${process.pid}-${Math.random().toString(16).slice(2)}`;
let started = false;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function backoffSeconds(attempts: number) {
  const table = [0, 1, 3, 8, 20, 45];
  return table[Math.min(attempts, table.length - 1)] ?? 60;
}

export function ensureVisionWorker() {
  if (started) return;
  started = true;

  void (async () => {
    while (true) {
      try {
        await processOne();
      } catch (e) {
        console.error("mobileVisionWorker.error", {
          workerId: WORKER_ID,
          message: e instanceof Error ? e.message : String(e),
        });
      }
      await sleep(300);
    }
  })();
}

async function processOne() {
  const now = new Date();
  const lockExpiry = new Date(now.getTime() - 2 * 60 * 1000);

  const candidates = await db
    .select()
    .from(mobileJobPhotos)
    .where(
      and(
        eq(mobileJobPhotos.findingsStatus, "pending"),
        or(isNull(mobileJobPhotos.findingsNextAttemptAt), lte(mobileJobPhotos.findingsNextAttemptAt, now))
      )
    )
    .orderBy(desc(mobileJobPhotos.createdAt))
    .limit(5);

  for (const photo of candidates) {
    const [locked] = await db
      .update(mobileJobPhotos)
      .set({
        findingsStatus: "processing",
        findingsLockedBy: WORKER_ID,
        findingsLockedAt: now,
        findingsAttempts: (photo.findingsAttempts ?? 0) + 1,
      })
      .where(
        and(
          eq(mobileJobPhotos.id, photo.id),
          or(isNull(mobileJobPhotos.findingsLockedAt), lte(mobileJobPhotos.findingsLockedAt, lockExpiry))
        )
      )
      .returning();

    if (!locked) continue;

    await runPhoto(locked);
    return;
  }
}

async function runPhoto(photo: typeof mobileJobPhotos.$inferSelect) {
  const now = new Date();
  const attempts = photo.findingsAttempts ?? 1;

  try {
    let rek: Awaited<ReturnType<typeof analyzeWithRekognition>> | null = null;
    let rekError: string | undefined;
    try {
      rek = await analyzeWithRekognition({ imageUrl: photo.publicUrl });
    } catch (e) {
      rekError = e instanceof Error ? e.message : String(e);
    }

    const labelNames = rek?.labels?.map((l) => l.name) ?? [];

    let gpt: Awaited<ReturnType<typeof analyzeWithGptVision>> | null = null;
    let gptError: string | undefined;
    try {
      gpt = await analyzeWithGptVision({
        imageUrl: photo.publicUrl,
        kind: photo.kind,
        rekognitionLabels: labelNames,
      });
    } catch (e) {
      gptError = e instanceof Error ? e.message : String(e);
    }

    if (!rek && !gpt) {
      throw new Error(`VISION_FAILED: rekognition=${rekError || "unknown"} gpt=${gptError || "unknown"}`);
    }

    const findings = validateFindings({
      version: "v1",
      imageUrl: photo.publicUrl,
      kind: photo.kind,
      detector: rek
        ? { status: "ready", result: rek }
        : { status: "failed", error: rekError || "REKOGNITION_FAILED" },
      llm: gpt
        ? { status: "ready", result: { ...gpt, provider: "openai" } }
        : { status: "failed", error: gptError || "GPT_VISION_FAILED" },
      combined: {
        confidence: Math.max(0, Math.min(1, ((gpt?.confidence ?? 0.5) * 0.9) + 0.1)),
        summaryLabels: Array.from(new Set([...(gpt?.labels || []), ...labelNames.slice(0, 5)])).slice(0, 10),
        needsMorePhotos: gpt?.needsMorePhotos || [],
      },
    });

    await db
      .update(mobileJobPhotos)
      .set({
        findings,
        findingsStatus: "ready",
        findingsError: null,
        analyzedAt: now,
        findingsLockedBy: null,
        findingsLockedAt: null,
      })
      .where(eq(mobileJobPhotos.id, photo.id));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const next = new Date(Date.now() + backoffSeconds(attempts) * 1000);

    await db
      .update(mobileJobPhotos)
      .set({
        findingsStatus: attempts >= 5 ? "failed" : "pending",
        findingsError: msg,
        findingsNextAttemptAt: attempts >= 5 ? null : next,
        findingsLockedBy: null,
        findingsLockedAt: null,
      })
      .where(eq(mobileJobPhotos.id, photo.id));

    console.error("mobileVisionWorker.photo.failed", {
      photoId: photo.id,
      jobId: photo.jobId,
      attempts,
      error: msg,
    });
  }
}
