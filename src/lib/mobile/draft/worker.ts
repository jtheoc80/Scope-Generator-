import { db } from "@/server/db";
import { mobileJobDrafts, mobileJobs, mobileJobPhotos, proposalTemplates, users } from "@shared/schema";
import { and, eq, isNull, lte, or, desc } from "drizzle-orm";
import { generateMobileDraft } from "./pipeline";
import { ensureVisionWorker } from "@/src/lib/mobile/vision/worker";
import { logDraftError, logError } from "../error-logger";

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

import type { RemedyType, Remedy } from "@/src/lib/mobile/remedy";

export type SelectedIssue = {
  id: string;
  label: string;
  category: string;
  // Remedy fields (repair vs replace)
  issueType?: string;
  tags?: string[];
  remedies?: Remedy;
  selectedRemedy?: RemedyType;
};

// Scope selection from FindingsSummary screen
export type ScopeSelection = {
  selectedTierId?: string;
  answers: Record<string, string | number | boolean | string[]>;
  measurements?: {
    squareFeet?: number;
    linearFeet?: number;
    roomCount?: number;
    wallCount?: number;
    ceilingHeight?: number;
  };
  problemStatement?: string;
};

export async function enqueueDraft(params: {
  jobId: number;
  userId: string;
  draftIdempotencyKey?: string | null;
  selectedIssues?: SelectedIssue[];
  problemStatement?: string;
  scopeSelection?: ScopeSelection;
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

  // Build questions array with scope context
  const questions: string[] = params.selectedIssues?.map(i => i.label) ?? [];
  
  // Add remedy selections for each issue
  if (params.selectedIssues) {
    for (const issue of params.selectedIssues) {
      if (issue.selectedRemedy) {
        questions.push(`REMEDY:${issue.id}=${issue.selectedRemedy}`);
      }
      // Also add issue type for scope generation
      if (issue.issueType) {
        questions.push(`ISSUE_TYPE:${issue.id}=${issue.issueType}`);
      }
    }
  }
  
  // Add scope selection context to questions for the draft generator
  if (params.scopeSelection) {
    if (params.scopeSelection.selectedTierId) {
      questions.push(`SCOPE_TIER:${params.scopeSelection.selectedTierId}`);
    }
    // Add scope answers (e.g., paint_scope: spot_repair)
    for (const [key, value] of Object.entries(params.scopeSelection.answers)) {
      questions.push(`SCOPE_ANSWER:${key}=${String(value)}`);
    }
    // Add measurements
    if (params.scopeSelection.measurements?.squareFeet) {
      questions.push(`MEASUREMENT:squareFeet=${params.scopeSelection.measurements.squareFeet}`);
    }
    if (params.scopeSelection.measurements?.ceilingHeight) {
      questions.push(`MEASUREMENT:ceilingHeight=${params.scopeSelection.measurements.ceilingHeight}`);
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
      questions,
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
        const errorMsg = e instanceof Error ? e.message : String(e);
        console.error("mobileDraftWorker.error", {
          workerId: WORKER_ID,
          message: errorMsg,
        });
        
        // Log worker-level errors to persistent file
        logError({
          category: "UNKNOWN",
          error: e instanceof Error ? e : errorMsg,
          details: {
            workerId: WORKER_ID,
            context: "draft_worker_loop",
          },
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

    // Build enhanced job notes with selected issues and scope context
    // The questions field temporarily stores selected issue labels and scope data from enqueueDraft
    const questionsData = draft.questions ?? [];
    
    // Parse scope context from questions
    const issueLabels: string[] = [];
    const scopeContext: Record<string, string> = {};
    const measurements: Record<string, number> = {};
    let selectedTier: string | undefined;
    
    for (const item of questionsData) {
      if (item.startsWith("SCOPE_TIER:")) {
        selectedTier = item.replace("SCOPE_TIER:", "");
      } else if (item.startsWith("SCOPE_ANSWER:")) {
        const [key, value] = item.replace("SCOPE_ANSWER:", "").split("=");
        if (key && value) scopeContext[key] = value;
      } else if (item.startsWith("MEASUREMENT:")) {
        const [key, value] = item.replace("MEASUREMENT:", "").split("=");
        if (key && value) measurements[key] = parseFloat(value);
      } else {
        issueLabels.push(item);
      }
    }
    
    // Build enhanced job notes
    let enhancedJobNotes = job.jobNotes ?? "";
    
    // Add selected issues with remedy information
    if (issueLabels.length > 0) {
      // Parse any remedy data that was stored in the questions
      const remedyData: Record<string, string> = {};
      for (const item of questionsData) {
        if (item.startsWith("REMEDY:")) {
          const [issueId, remedy] = item.replace("REMEDY:", "").split("=");
          if (issueId && remedy) remedyData[issueId] = remedy;
        }
      }
      
      // Build issue descriptions with remedy info
      const issueDescriptions = issueLabels.map((label, idx) => {
        // Try to find remedy for this issue by index (issues are stored in order)
        const remedyKeys = Object.keys(remedyData);
        const remedy = remedyKeys[idx] ? remedyData[remedyKeys[idx]] : null;
        if (remedy) {
          return `${label} (ACTION: ${remedy.toUpperCase()})`;
        }
        return label;
      });
      
      enhancedJobNotes += `\n\nSelected issues to address: ${issueDescriptions.join("; ")}`;
      
      // Add explicit remedy instructions if any are specified
      const hasReplacementItems = Object.values(remedyData).some(r => r === "replace");
      const hasRepairItems = Object.values(remedyData).some(r => r === "repair");
      
      if (hasReplacementItems || hasRepairItems) {
        enhancedJobNotes += `\n\nIMPORTANT: Scope ONLY includes`;
        const parts: string[] = [];
        if (hasRepairItems) parts.push("REPAIR work for items marked as repair");
        if (hasReplacementItems) parts.push("REPLACEMENT work for items marked as replace");
        enhancedJobNotes += ` ${parts.join(" and ")}. Generate appropriate scope items for each action type.`;
      }
    }
    
    // Add scope context (critical for accurate pricing)
    if (selectedTier) {
      enhancedJobNotes += `\n\nCONFIRMED SCOPE TIER: ${selectedTier}`;
    }
    
    // Add painting scope if selected
    if (scopeContext.paint_scope) {
      const scopeLabels: Record<string, string> = {
        spot_repair: "SPOT REPAIR ONLY (10-30 sq ft area)",
        one_wall: "ONE WALL ONLY",
        entire_room: "ENTIRE ROOM (all walls)",
        entire_house: "ENTIRE HOUSE/BUILDING",
      };
      const label = scopeLabels[scopeContext.paint_scope] || scopeContext.paint_scope;
      enhancedJobNotes += `\n\nCONFIRMED PAINTING SCOPE: ${label}`;
      enhancedJobNotes += `\nIMPORTANT: Price ONLY for the confirmed scope above. Do NOT assume larger scope.`;
    }
    
    // Add measurements if provided
    if (measurements.squareFeet) {
      enhancedJobNotes += `\n\nCONFIRMED MEASUREMENTS: ${measurements.squareFeet} sq ft`;
    }
    if (measurements.ceilingHeight) {
      enhancedJobNotes += `\nCeiling height: ${measurements.ceilingHeight} ft`;
    }
    
    // Add other scope answers
    const otherAnswers = Object.entries(scopeContext).filter(([k]) => k !== "paint_scope");
    if (otherAnswers.length > 0) {
      enhancedJobNotes += `\n\nAdditional scope details:`;
      for (const [key, value] of otherAnswers) {
        enhancedJobNotes += `\n- ${key.replace(/_/g, " ")}: ${value}`;
      }
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
    const isFinalFailure = attempts >= 5;

    await db
      .update(mobileJobDrafts)
      .set({
        status: isFinalFailure ? "failed" : "pending",
        error: msg,
        nextAttemptAt: isFinalFailure ? null : next,
        finishedAt: isFinalFailure ? now : null,
        updatedAt: now,
        lockedBy: null,
        lockedAt: null,
      })
      .where(eq(mobileJobDrafts.id, draft.id));

    await db
      .update(mobileJobs)
      .set({ status: isFinalFailure ? "drafting" : "drafting", updatedAt: now })
      .where(eq(mobileJobs.id, draft.jobId));

    console.error("mobileDraftWorker.runDraft.failed", {
      jobId: draft.jobId,
      draftId: draft.id,
      attempts,
      error: msg,
    });

    // Log to persistent error file
    logDraftError({
      jobId: draft.jobId,
      draftId: draft.id,
      error: e instanceof Error ? e : msg,
      attempts,
      details: {
        isFinalFailure,
        errorType: msg.includes("NOT_FOUND") ? "missing_data" : "generation_error",
      },
    });
  }
}

// Auto-start on first import
export function ensureDraftWorker() {
  if (!started) startDraftWorker();
}
