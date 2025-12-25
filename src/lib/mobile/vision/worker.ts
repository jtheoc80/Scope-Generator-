import { db } from "@/server/db";
import { mobileJobPhotos } from "@shared/schema";
import { and, desc, eq, isNull, lte, or } from "drizzle-orm";
import { runVisionForPhoto } from "./runner";

const WORKER_ID = `vision-${process.pid}-${Math.random().toString(16).slice(2)}`;
let started = false;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
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

    const result = await runVisionForPhoto(locked);
    if (!result.success) {
      console.error("mobileVisionWorker.photo.failed", {
        photoId: result.photoId,
        jobId: locked.jobId,
        error: result.error,
      });
    }
    return;
  }
}
