import { NextRequest } from "next/server";
import { requireMobileAuth } from "@/src/lib/mobile/auth";
import { registerPhotoRequestSchema } from "@/src/lib/mobile/types";
import { storage } from "@/lib/services/storage";
import { getRequestId, jsonError, logEvent, withRequestId } from "@/src/lib/mobile/observability";
import { ensureVisionWorker } from "@/src/lib/mobile/vision/worker";
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
