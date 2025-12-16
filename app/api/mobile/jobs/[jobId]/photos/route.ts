import { NextRequest } from "next/server";
import { requireMobileAuth } from "@/src/lib/mobile/auth";
import { registerPhotoRequestSchema } from "@/src/lib/mobile/types";
import { storage } from "@/lib/services/storage";
import { getRequestId, jsonError, logEvent, withRequestId } from "@/src/lib/mobile/observability";

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
