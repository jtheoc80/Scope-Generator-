import { NextRequest, NextResponse } from "next/server";
import { requireMobileAuth } from "@/src/lib/mobile/auth";
import { storage } from "@/lib/services/storage";
import { db } from "@/server/db";
import { mobileJobDrafts, mobileJobPhotos, mobileJobs, proposalTemplates, users } from "@shared/schema";
import { and, eq, desc } from "drizzle-orm";
import { getRequestId, jsonError, logEvent, withRequestId } from "@/src/lib/mobile/observability";
import { generateMobileDraft } from "@/src/lib/mobile/draft/pipeline";
import { runVisionForPhoto } from "@/src/lib/mobile/vision/runner";

// Selected issue from client
type SelectedIssue = {
  id: string;
  label: string;
  category: string;
};

// POST /api/mobile/jobs/:jobId/draft (trigger generation - SYNCHRONOUS for serverless)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const requestId = getRequestId(request.headers);
  const t0 = Date.now();
  try {
    const authResult = await requireMobileAuth(request);
    if (!authResult.ok) return authResult.response;

    const { jobId } = await params;
    const id = parseInt(jobId);
    if (Number.isNaN(id)) {
      return jsonError(requestId, 400, "INVALID_INPUT", "Invalid jobId");
    }

    const [job] = await db
      .select()
      .from(mobileJobs)
      .where(and(eq(mobileJobs.id, id), eq(mobileJobs.userId, authResult.userId)))
      .limit(1);

    if (!job) {
      return jsonError(requestId, 404, "NOT_FOUND", "Job not found");
    }

    // Parse body for selected issues context
    let selectedIssues: SelectedIssue[] | undefined;
    let problemStatement: string | undefined;
    try {
      const body = await request.json();
      if (body.selectedIssues && Array.isArray(body.selectedIssues)) {
        selectedIssues = body.selectedIssues;
      }
      if (body.problemStatement && typeof body.problemStatement === "string") {
        problemStatement = body.problemStatement;
      }
    } catch {
      // Body parsing failed, continue without context
    }

    // Get user
    const [user] = await db.select().from(users).where(eq(users.id, job.userId)).limit(1);
    if (!user) {
      return jsonError(requestId, 404, "NOT_FOUND", "User not found");
    }

    // Get photos
    let photos = await db
      .select()
      .from(mobileJobPhotos)
      .where(eq(mobileJobPhotos.jobId, id));

    if (photos.length === 0) {
      return jsonError(requestId, 400, "FAILED_PRECONDITION", "No photos uploaded. Please add at least one photo.");
    }

    logEvent("mobile.draft.start", {
      requestId,
      jobId: id,
      photoCount: photos.length,
      photosReady: photos.filter(p => p.findingsStatus === "ready").length,
    });

    // SYNCHRONOUSLY analyze any photos that aren't ready yet
    const pendingPhotos = photos.filter(p => 
      p.findingsStatus !== "ready" && p.findingsStatus !== "failed"
    );

    if (pendingPhotos.length > 0) {
      logEvent("mobile.draft.analyzingPhotos", {
        requestId,
        jobId: id,
        pendingCount: pendingPhotos.length,
      });

      for (const photo of pendingPhotos) {
        try {
          await db
            .update(mobileJobPhotos)
            .set({ findingsStatus: "processing", findingsAttempts: (photo.findingsAttempts ?? 0) + 1 })
            .where(eq(mobileJobPhotos.id, photo.id));

          const [updatedPhoto] = await db
            .select()
            .from(mobileJobPhotos)
            .where(eq(mobileJobPhotos.id, photo.id))
            .limit(1);

          if (updatedPhoto) {
            const result = await runVisionForPhoto(updatedPhoto);
            logEvent("mobile.draft.photoAnalyzed", {
              requestId,
              photoId: photo.id,
              success: result.success,
              error: result.error,
            });
          }
        } catch (err) {
          console.error("Photo analysis failed during draft:", {
            photoId: photo.id,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      // Re-fetch photos with updated findings
      photos = await db
        .select()
        .from(mobileJobPhotos)
        .where(eq(mobileJobPhotos.jobId, id));
    }

    const readyPhotos = photos.filter(p => p.findingsStatus === "ready");
    if (readyPhotos.length === 0) {
      return jsonError(requestId, 500, "INTERNAL", "Photo analysis failed. Please check your images and try again.");
    }

    // Get template
    const [template] = await db
      .select()
      .from(proposalTemplates)
      .where(and(eq(proposalTemplates.tradeId, job.tradeId), eq(proposalTemplates.jobTypeId, job.jobTypeId)))
      .limit(1);

    if (!template) {
      return jsonError(requestId, 404, "NOT_FOUND", `No template found for trade=${job.tradeId} jobType=${job.jobTypeId}`);
    }

    // Build enhanced job notes
    let enhancedJobNotes = job.jobNotes ?? "";
    if (selectedIssues && selectedIssues.length > 0) {
      const issueContext = `\n\nSelected issues to address: ${selectedIssues.map(i => i.label).join("; ")}`;
      enhancedJobNotes = enhancedJobNotes + issueContext;
    }

    // SYNCHRONOUSLY generate draft
    logEvent("mobile.draft.generating", { requestId, jobId: id });

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

    // Save draft to database
    const idem = request.headers.get("idempotency-key") || undefined;
    const now = new Date();

    const [savedDraft] = await db
      .insert(mobileJobDrafts)
      .values({
        jobId: job.id,
        status: "ready",
        draftIdempotencyKey: idem ?? null,
        payload: draftPayload,
        confidence: draftPayload.confidence,
        questions: draftPayload.questions,
        pricebookVersion: draftPayload.pricing?.pricebookVersion ?? null,
        pricingSnapshot: draftPayload.pricing ?? null,
        attempts: 1,
        startedAt: now,
        finishedAt: now,
      } as typeof mobileJobDrafts.$inferInsert)
      .returning();

    // Update job status
    await db
      .update(mobileJobs)
      .set({ status: "drafted", updatedAt: now })
      .where(eq(mobileJobs.id, job.id));

    logEvent("mobile.draft.complete", {
      requestId,
      jobId: id,
      draftId: savedDraft?.id,
      confidence: draftPayload.confidence,
      totalMs: Date.now() - t0,
    });

    // Return READY immediately with the payload
    return withRequestId(requestId, { 
      status: "READY", 
      payload: draftPayload 
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Error generating mobile draft:", error);
    logEvent("mobile.draft.error", {
      requestId,
      error: errorMsg,
    });
    return jsonError(requestId, 500, "INTERNAL", `Draft generation failed: ${errorMsg}`);
  }
}

// GET /api/mobile/jobs/:jobId/draft (check status / get existing draft)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const requestId = getRequestId(request.headers);
  try {
    const authResult = await requireMobileAuth(request);
    if (!authResult.ok) return authResult.response;

    const { jobId } = await params;
    const id = parseInt(jobId);
    if (Number.isNaN(id)) {
      return jsonError(requestId, 400, "INVALID_INPUT", "Invalid jobId");
    }

    const job = await storage.getMobileJob(id, authResult.userId);
    if (!job) {
      return jsonError(requestId, 404, "NOT_FOUND", "Job not found");
    }

    const [draft] = await db
      .select()
      .from(mobileJobDrafts)
      .where(and(eq(mobileJobDrafts.jobId, job.id)))
      .orderBy(desc(mobileJobDrafts.createdAt))
      .limit(1);

    if (!draft) {
      // No draft exists yet - client should call POST to create one
      return withRequestId(requestId, { status: "NOT_STARTED" });
    }

    if (draft.status === "ready" && draft.payload) {
      return withRequestId(requestId, { status: "READY", payload: draft.payload });
    }

    if (draft.status === "failed") {
      return jsonError(requestId, 500, "INTERNAL", "Draft failed", {
        status: "FAILED",
        detail: draft.error ?? "Draft failed",
      });
    }

    // Draft is still processing (shouldn't happen with sync generation, but handle gracefully)
    return withRequestId(requestId, { status: "DRAFTING" });
  } catch (error) {
    console.error("Error fetching mobile draft:", error);
    return jsonError(requestId, 500, "INTERNAL", "Failed to fetch draft");
  }
}
