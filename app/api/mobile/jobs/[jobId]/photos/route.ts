import { NextRequest } from "next/server";
import { requireMobileAuth } from "@/src/lib/mobile/auth";
import { registerPhotoRequestSchema } from "@/src/lib/mobile/types";
import { storage } from "@/lib/services/storage";
import { getRequestId, jsonError, logEvent, withRequestId } from "@/src/lib/mobile/observability";
import { runVisionForPhoto } from "@/src/lib/mobile/vision/runner";
import { db } from "@/server/db";
import { mobileJobPhotos } from "@shared/schema";
import { eq } from "drizzle-orm";

// POST /api/mobile/jobs/:jobId/photos (register uploaded photo public URL)
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

    const body = await request.json();
    const parsed = registerPhotoRequestSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(
        requestId,
        400,
        "INVALID_INPUT",
        parsed.error.issues[0]?.message ?? "Invalid photo payload"
      );
    }

    const photo = await storage.addMobileJobPhoto(id, authResult.userId, {
      publicUrl: parsed.data.url,
      kind: parsed.data.kind,
    });

    // IMMEDIATELY analyze this photo SYNCHRONOUSLY before returning
    // This is critical for serverless - background tasks don't work reliably
    let analysisResult: { success: boolean; error?: string } = { success: false };
    
    try {
      // Mark as processing
      await db
        .update(mobileJobPhotos)
        .set({
          findingsStatus: "processing",
          findingsAttempts: 1,
        })
        .where(eq(mobileJobPhotos.id, photo.id));

      // Fetch the full photo record
      const [fullPhoto] = await db
        .select()
        .from(mobileJobPhotos)
        .where(eq(mobileJobPhotos.id, photo.id))
        .limit(1);

      if (fullPhoto) {
        analysisResult = await runVisionForPhoto(fullPhoto);
        
        logEvent("mobile.photos.analysis.complete", {
          requestId,
          photoId: photo.id,
          jobId: id,
          success: analysisResult.success,
          error: analysisResult.error,
          analysisMs: Date.now() - t0,
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("Photo analysis failed:", {
        photoId: photo.id,
        error: errorMsg,
      });
      analysisResult = { success: false, error: errorMsg };
      
      // Update photo with error status
      await db
        .update(mobileJobPhotos)
        .set({
          findingsStatus: "failed",
          findingsError: errorMsg,
        })
        .where(eq(mobileJobPhotos.id, photo.id));
    }

    logEvent("mobile.photos.register.ok", {
      requestId,
      jobId: id,
      photoId: photo.id,
      analyzed: analysisResult.success,
      totalMs: Date.now() - t0,
    });

    // Return analysis status along with photoId
    return withRequestId(requestId, { 
      photoId: photo.id,
      analyzed: analysisResult.success,
      analysisError: analysisResult.error,
    }, 201);
  } catch (error) {
    console.error("Error registering mobile job photo:", error);
    return jsonError(requestId, 500, "INTERNAL", "Failed to register photo");
  }
}
