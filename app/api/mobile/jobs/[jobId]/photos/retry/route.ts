import { NextRequest } from "next/server";
import { requireMobileAuth } from "@/src/lib/mobile/auth";
import { storage } from "@/lib/services/storage";
import { db } from "@/server/db";
import { mobileJobPhotos } from "@shared/schema";
import { eq, and, or } from "drizzle-orm";
import { getRequestId, jsonError, logEvent, withRequestId } from "@/src/lib/mobile/observability";
import { runVisionForPhoto } from "@/src/lib/mobile/vision/runner";

// POST /api/mobile/jobs/:jobId/photos/retry - Retry failed photo analysis
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

    const job = await storage.getMobileJob(id, authResult.userId);
    if (!job) {
      return jsonError(requestId, 404, "NOT_FOUND", "Job not found");
    }

    // Reset failed and pending photos for retry
    const photosToRetry = await db
      .select()
      .from(mobileJobPhotos)
      .where(
        and(
          eq(mobileJobPhotos.jobId, id),
          or(
            eq(mobileJobPhotos.findingsStatus, "failed"),
            eq(mobileJobPhotos.findingsStatus, "pending"),
            eq(mobileJobPhotos.findingsStatus, "processing")
          )
        )
      );

    if (photosToRetry.length === 0) {
      return withRequestId(requestId, {
        message: "No photos need retry - all photos already analyzed successfully",
        retried: 0,
      });
    }

    // Reset status and attempt inline analysis
    const results: Array<{ photoId: number; success: boolean; error?: string }> = [];

    for (const photo of photosToRetry) {
      // Reset the photo status
      await db
        .update(mobileJobPhotos)
        .set({
          findingsStatus: "processing",
          findingsError: null,
          findingsAttempts: (photo.findingsAttempts ?? 0) + 1,
          findingsLockedBy: `retry-${requestId}`,
          findingsLockedAt: new Date(),
        })
        .where(eq(mobileJobPhotos.id, photo.id));

      // Re-fetch with updated status
      const [updatedPhoto] = await db
        .select()
        .from(mobileJobPhotos)
        .where(eq(mobileJobPhotos.id, photo.id))
        .limit(1);

      if (updatedPhoto) {
        try {
          const result = await runVisionForPhoto(updatedPhoto);
          results.push({
            photoId: photo.id,
            success: result.success,
            error: result.error,
          });
        } catch (e) {
          results.push({
            photoId: photo.id,
            success: false,
            error: e instanceof Error ? e.message : String(e),
          });
        }
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    logEvent("mobile.photos.retry.complete", {
      requestId,
      jobId: id,
      total: results.length,
      success: successCount,
      failed: failCount,
      ms: Date.now() - t0,
    });

    return withRequestId(requestId, {
      message: `Retried ${results.length} photos: ${successCount} succeeded, ${failCount} failed`,
      retried: results.length,
      success: successCount,
      failed: failCount,
      results,
    });
  } catch (error) {
    console.error("Error retrying photo analysis:", error);
    return jsonError(requestId, 500, "INTERNAL", "Failed to retry photo analysis");
  }
}
