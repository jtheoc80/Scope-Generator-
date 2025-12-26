import { NextRequest } from "next/server";
import { requireMobileAuth } from "@/src/lib/mobile/auth";
import { db } from "@/server/db";
import { mobileJobs, mobileJobPhotos, mobileJobDrafts } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { getRequestId, jsonError, withRequestId } from "@/src/lib/mobile/observability";

// GET /api/mobile/jobs/:jobId/debug - Debug endpoint to check job state
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

    // Get job
    const [job] = await db
      .select()
      .from(mobileJobs)
      .where(eq(mobileJobs.id, id))
      .limit(1);

    if (!job) {
      return jsonError(requestId, 404, "NOT_FOUND", "Job not found");
    }

    // Get photos with findings status
    const photos = await db
      .select()
      .from(mobileJobPhotos)
      .where(eq(mobileJobPhotos.jobId, id));

    // Get drafts
    const drafts = await db
      .select()
      .from(mobileJobDrafts)
      .where(eq(mobileJobDrafts.jobId, id))
      .orderBy(desc(mobileJobDrafts.createdAt))
      .limit(5);

    // Check environment
    const envCheck = {
      hasOpenAiKey: !!process.env.OPENAI_API_KEY,
      hasAwsAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasAwsSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      awsRegion: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1",
      openAiModel: process.env.OPENAI_VISION_MODEL || "gpt-4o-mini",
    };

    // Summarize photo analysis status
    const photoSummary = {
      total: photos.length,
      pending: photos.filter(p => p.findingsStatus === "pending").length,
      processing: photos.filter(p => p.findingsStatus === "processing").length,
      ready: photos.filter(p => p.findingsStatus === "ready").length,
      failed: photos.filter(p => p.findingsStatus === "failed").length,
    };

    // Get detailed photo info
    const photoDetails = photos.map(p => ({
      id: p.id,
      kind: p.kind,
      findingsStatus: p.findingsStatus,
      findingsError: p.findingsError,
      findingsAttempts: p.findingsAttempts,
      hasFindings: !!p.findings,
      findingsPreview: p.findings ? {
        hasLlm: !!(p.findings as any)?.llm?.result,
        hasDetector: !!(p.findings as any)?.detector?.result,
        llmStatus: (p.findings as any)?.llm?.status,
        detectorStatus: (p.findings as any)?.detector?.status,
        damage: (p.findings as any)?.llm?.result?.damage?.slice(0, 3),
        issues: (p.findings as any)?.llm?.result?.issues?.slice(0, 3),
        labels: (p.findings as any)?.combined?.summaryLabels?.slice(0, 5),
      } : null,
      publicUrl: p.publicUrl?.substring(0, 60) + "...",
      createdAt: p.createdAt,
      analyzedAt: p.analyzedAt,
    }));

    // Get draft info
    const draftDetails = drafts.map(d => ({
      id: d.id,
      status: d.status,
      error: d.error,
      attempts: d.attempts,
      hasPayload: !!d.payload,
      confidence: d.confidence,
      createdAt: d.createdAt,
      startedAt: d.startedAt,
      finishedAt: d.finishedAt,
    }));

    return withRequestId(requestId, {
      job: {
        id: job.id,
        status: job.status,
        tradeId: job.tradeId,
        jobTypeId: job.jobTypeId,
        clientName: job.clientName,
        createdAt: job.createdAt,
      },
      photoSummary,
      photoDetails,
      draftDetails,
      envCheck,
      debug: {
        message: photoSummary.ready === 0 
          ? "No photos have been successfully analyzed yet" 
          : photoSummary.ready < photos.length 
            ? `${photoSummary.ready}/${photos.length} photos analyzed`
            : "All photos analyzed",
        suggestions: [
          ...(envCheck.hasOpenAiKey ? [] : ["❌ OPENAI_API_KEY is missing"]),
          ...(envCheck.hasAwsAccessKey ? [] : ["❌ AWS_ACCESS_KEY_ID is missing"]),
          ...(envCheck.hasAwsSecretKey ? [] : ["❌ AWS_SECRET_ACCESS_KEY is missing"]),
          ...(photoSummary.failed > 0 ? [`⚠️ ${photoSummary.failed} photos failed analysis`] : []),
          ...(draftDetails.some(d => d.error) ? ["⚠️ Draft generation had errors"] : []),
        ],
      },
    });
  } catch (error) {
    console.error("Debug endpoint error:", error);
    return jsonError(requestId, 500, "INTERNAL", "Debug check failed");
  }
}
