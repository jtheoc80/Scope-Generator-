import { NextRequest } from "next/server";
import { requireMobileAuth } from "@/src/lib/mobile/auth";
import { registerPhotoRequestSchema } from "@/src/lib/mobile/types";
import { storage } from "@/lib/services/storage";
import { getRequestId, jsonError, logEvent, withRequestId } from "@/src/lib/mobile/observability";
import { ensureVisionWorker } from "@/src/lib/mobile/vision/worker";
import { runVisionForPhoto } from "@/src/lib/mobile/vision/runner";
import { db } from "@/lib/services/db";
import { mobileJobPhotos } from "@shared/schema";
import { eq } from "drizzle-orm";
import { upsertPhotoRow } from "@/src/lib/similar-jobs/db";
import { enqueueEmbeddingJob, ensureSimilarJobEmbeddingWorker } from "@/src/lib/similar-jobs/worker";

// IMPORTANT: Use Node.js runtime for AWS SDK compatibility and Buffer support.
export const runtime = "nodejs";

// GET /api/mobile/jobs/:jobId/photos (list registered photos for a job)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const requestId = getRequestId(request.headers);
  const t0 = Date.now();
  try {
    // 1. Validate jobId param format FIRST (before auth)
    const { jobId } = await params;
    const id = parseInt(jobId);
    if (Number.isNaN(id)) {
      return jsonError(requestId, 400, "INVALID_INPUT", "Invalid jobId");
    }

    // 2. Check auth AFTER validating jobId format
    const authResult = await requireMobileAuth(request, requestId);
    if (!authResult.ok) return authResult.response;

    const photos = await storage.listMobileJobPhotos(id, authResult.userId);

    // Presign URLs for private bucket access
    const photosWithSignedUrls = await Promise.all(
      photos.map(async (p) => ({
        ...p,
        publicUrl: await import("@/src/lib/mobile/storage/s3").then(m => m.presignGetObject(p.publicUrl))
      }))
    );

    logEvent("mobile.photos.list.ok", {
      requestId,
      jobId: id,
      count: photos.length,
      ms: Date.now() - t0,
    });
    return withRequestId(requestId, { photos: photosWithSignedUrls }, 200);
  } catch (error) {
    console.error("Error listing mobile job photos:", error);
    return jsonError(requestId, 500, "INTERNAL", "Failed to list photos");
  }
}

// POST /api/mobile/jobs/:jobId/photos (register uploaded photo public URL)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const requestId = getRequestId(request.headers);
  const t0 = Date.now();
  try {
    // 1. Validate jobId param format FIRST (before auth)
    const { jobId } = await params;
    const id = parseInt(jobId);
    if (Number.isNaN(id)) {
      return jsonError(requestId, 400, "INVALID_INPUT", "Invalid jobId");
    }

    // 2. Check auth AFTER validating jobId format
    const authResult = await requireMobileAuth(request, requestId);
    if (!authResult.ok) return authResult.response;

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

    // Similar Job Retrieval (Phase 1): store S3 key + enqueue embedding compute (async)
    // Keep this non-blocking: DB enqueue is quick; embedding runs in background.
    try {
      await upsertPhotoRow({ jobId: id, publicUrl: parsed.data.url });
      await enqueueEmbeddingJob(id);
      ensureSimilarJobEmbeddingWorker();
    } catch (e) {
      // Never fail photo registration due to similarity pipeline.
      const msg = e instanceof Error ? e.message : String(e);
      console.warn("similarity.enqueue.failed", { jobId: id, error: msg });
    }

    // Start background worker for other photos
    ensureVisionWorker();

    // IMMEDIATELY start analyzing this photo (don't wait for worker)
    // This provides instant feedback on the uploaded photo
    void (async () => {
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
          const result = await runVisionForPhoto(fullPhoto);
          logEvent("mobile.photos.immediateAnalysis", {
            requestId,
            photoId: photo.id,
            success: result.success,
            error: result.error,
            ms: Date.now() - t0,
          });
        }
      } catch (err) {
        console.error("Immediate photo analysis failed:", err);
        // Don't fail the request - the background worker will retry
      }
    })();

    logEvent("mobile.photos.register.ok", {
      requestId,
      jobId: id,
      photoId: photo.id,
      ms: Date.now() - t0,
    });

    return withRequestId(requestId, { photoId: photo.id }, 201);
  } catch (error) {
    console.error("Error registering mobile job photo:", error);
    return jsonError(requestId, 500, "INTERNAL", "Failed to register photo");
  }
}
