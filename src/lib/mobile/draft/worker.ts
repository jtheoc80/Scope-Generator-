import { db } from "@/server/db";
import { mobileJobDrafts, mobileJobs, mobileJobPhotos, proposalTemplates, users } from "@shared/schema";
import { and, eq, isNull, lte, or, desc } from "drizzle-orm";
import { generateMobileDraft } from "./pipeline";
import { ensureVisionWorker } from "@/src/lib/mobile/vision/worker";

const WORKER_ID = `api-${process.pid}-${Math.random().toString(16).slice(2)}`;
let started = false;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function backoffSeconds(attempts: number) {
  // 0->0s, 1->2s, 2->5s, 3->15s, 4->30s, then 60s
  const table = [0, 2, 5, 15, 30];
  return table[Math.min(attempts, table.length - 1)] ?? 60;
}

export type SelectedIssue = {
  id: string;
  label: string;
  category: string;
};

export async function enqueueDraft(params: {
  jobId: number;
  userId: string;
  draftIdempotencyKey?: string | null;
  selectedIssues?: SelectedIssue[];
  problemStatement?: string;
}) {
  // If an idempotency key is provided, reuse any existing non-failed draft for this job+key.
  if (params.draftIdempotencyKey) {
    const existing = await db
      .select()
      .from(mobileJobDrafts)
      .where(
        and(
          eq(mobileJobDrafts.jobId, params.jobId),
          eq(mobileJobDrafts.draftIdempotencyKey, params.draftIdempotencyKey)
        )
      )
      .orderBy(desc(mobileJobDrafts.createdAt))
      .limit(1);

    const d = existing[0];
    if (d && d.status !== "failed") {
      return d;
    }
  }

  const [created] = await db
    .insert(mobileJobDrafts)
    .values({
      jobId: params.jobId,
      status: "pending",
      draftIdempotencyKey: params.draftIdempotencyKey ?? null,
      attempts: 0,
      nextAttemptAt: new Date(),
      lockedBy: null,
      lockedAt: null,
      startedAt: null,
      finishedAt: null,
      error: null,
      payload: null,
      // Store context in the questions field temporarily (will be overwritten when draft completes)
      questions: params.selectedIssues?.map(i => i.label) ?? [],
    } as typeof mobileJobDrafts.$inferInsert)
    .returning();

  return created;
}

export function startDraftWorker() {
  if (started) return;
  started = true;

  // Best-effort worker: runs inside the Next.js Node process.
  // In serverless environments, this should be replaced with a real queue/worker.
  void (async () => {
    while (true) {
      try {
        await processOne();
      } catch (e) {
        console.error("mobileDraftWorker.error", {
          workerId: WORKER_ID,
          message: e instanceof Error ? e.message : String(e),
        });
      }

      await sleep(500);
    }
  })();
}

async function processOne() {
  const now = new Date();
  const lockExpiry = new Date(now.getTime() - 2 * 60 * 1000);

  const candidates = await db
    .select()
    .from(mobileJobDrafts)
    .where(
      and(
        eq(mobileJobDrafts.status, "pending"),
        or(isNull(mobileJobDrafts.nextAttemptAt), lte(mobileJobDrafts.nextAttemptAt, now))
      )
    )
    .orderBy(desc(mobileJobDrafts.createdAt))
    .limit(5);

  for (const draft of candidates) {
    // Try to lock it (optimistic): only lock if not locked or lock is stale.
    const [locked] = await db
      .update(mobileJobDrafts)
      .set({
        lockedBy: WORKER_ID,
        lockedAt: now,
        status: "processing",
        startedAt: now,
        attempts: (draft.attempts ?? 0) + 1,
        updatedAt: now,
      })
      .where(
        and(
          eq(mobileJobDrafts.id, draft.id),
          or(isNull(mobileJobDrafts.lockedAt), lte(mobileJobDrafts.lockedAt, lockExpiry))
        )
      )
      .returning();

    if (!locked) continue;

    await runDraft(locked);
    return;
  }
}

async function runDraft(draft: typeof mobileJobDrafts.$inferSelect) {
  const now = new Date();

  try {
    const [job] = await db
      .select()
      .from(mobileJobs)
      .where(eq(mobileJobs.id, draft.jobId))
      .limit(1);

    if (!job) throw new Error("JOB_NOT_FOUND");

    const [user] = await db.select().from(users).where(eq(users.id, job.userId)).limit(1);
    if (!user) throw new Error("USER_NOT_FOUND");

    const photos = await db
      .select()
      .from(mobileJobPhotos)
      .where(eq(mobileJobPhotos.jobId, job.id));

    // Best-effort: keep vision moving in the background, but never block draft generation on it.
    // This keeps scope generation "instant" even if image analysis is slow/unavailable (e.g. job #16).
    ensureVisionWorker();

    const [template] = await db
      .select()
      .from(proposalTemplates)
      .where(and(eq(proposalTemplates.tradeId, job.tradeId), eq(proposalTemplates.jobTypeId, job.jobTypeId)))
      .limit(1);

    if (!template) throw new Error("TEMPLATE_NOT_FOUND");

    // Build enhanced job notes with selected issues context
    // The questions field temporarily stores selected issue labels from enqueueDraft
    const selectedIssueLabels = draft.questions ?? [];
    let enhancedJobNotes = job.jobNotes ?? "";
    if (selectedIssueLabels.length > 0) {
      const issueContext = `\n\nSelected issues to address: ${selectedIssueLabels.join("; ")}`;
      enhancedJobNotes = enhancedJobNotes + issueContext;
    }

    const readyCount = photos.filter((p) => p.findingsStatus === "ready").length;
    const failedCount = photos.filter((p) => p.findingsStatus === "failed").length;
    const pendingCount = photos.filter((p) => p.findingsStatus !== "ready" && p.findingsStatus !== "failed").length;

    console.log("mobileDraftWorker.visionWait.skipped", {
      jobId: job.id,
      totalPhotos: photos.length,
      readyPhotos: readyCount,
      failedPhotos: failedCount,
      pendingPhotos: pendingCount,
    });

    const draftPayload = await generateMobileDraft({
      job: {
        id: job.id,
        clientName: job.clientName,
        address: job.address,
        tradeId: job.tradeId,
        tradeName: job.tradeName,
        jobTypeId: job.jobTypeId,
        jobTypeName: job.jobTypeName,
        jobSize: job.jobSize,
        jobNotes: enhancedJobNotes.trim() || null,
      },
      template,
      user,
      photos: photos.map((p) => ({ publicUrl: p.publicUrl, kind: p.kind, findings: p.findings })),
    });

    await db
      .update(mobileJobDrafts)
      .set({
        status: "ready",
        payload: draftPayload,
        confidence: (draftPayload as any)?.confidence ?? null,
        questions: (draftPayload as any)?.questions ?? [],
        pricebookVersion: (draftPayload as any)?.pricing?.pricebookVersion ?? null,
        pricingSnapshot: (draftPayload as any)?.pricing ?? null,
        error: null,
        finishedAt: now,
        updatedAt: now,
      })
      .where(eq(mobileJobDrafts.id, draft.id));

    await db
      .update(mobileJobs)
      .set({ status: "drafted", updatedAt: now })
      .where(eq(mobileJobs.id, job.id));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const attempts = draft.attempts ?? 1;
    const next = new Date(Date.now() + backoffSeconds(attempts) * 1000);

    await db
      .update(mobileJobDrafts)
      .set({
        status: attempts >= 5 ? "failed" : "pending",
        error: msg,
        nextAttemptAt: attempts >= 5 ? null : next,
        finishedAt: attempts >= 5 ? now : null,
        updatedAt: now,
        lockedBy: null,
        lockedAt: null,
      })
      .where(eq(mobileJobDrafts.id, draft.id));

    await db
      .update(mobileJobs)
      .set({ status: attempts >= 5 ? "drafting" : "drafting", updatedAt: now })
      .where(eq(mobileJobs.id, draft.jobId));

    console.error("mobileDraftWorker.runDraft.failed", {
      jobId: draft.jobId,
      draftId: draft.id,
      attempts,
      error: msg,
    });
  }
}

// Auto-start on first import
export function ensureDraftWorker() {
  if (!started) startDraftWorker();
}
