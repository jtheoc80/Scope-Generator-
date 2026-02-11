import { NextRequest } from "next/server";
import { requireMobileAuth } from "@/src/lib/mobile/auth";
import { storage } from "@/lib/services/storage";
import { getRequestId, jsonError, logEvent, withRequestId } from "@/src/lib/mobile/observability";

export const runtime = "nodejs";

// DELETE /api/mobile/jobs/:jobId/photos/:photoId
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ jobId: string; photoId: string }> }
) {
    const requestId = getRequestId(request.headers);
    const t0 = Date.now();

    try {
        const { jobId, photoId } = await params;
        const jId = parseInt(jobId);
        const pId = parseInt(photoId);

        if (Number.isNaN(jId) || Number.isNaN(pId)) {
            return jsonError(requestId, 400, "INVALID_INPUT", "Invalid ID format");
        }

        // Check auth
        const authResult = await requireMobileAuth(request, requestId);
        if (!authResult.ok) return authResult.response;

        // Delete photo
        const success = await storage.deleteMobileJobPhoto(pId, jId, authResult.userId);

        if (!success) {
            return jsonError(requestId, 404, "NOT_FOUND", "Photo not found or access denied");
        }

        logEvent("mobile.photos.delete.ok", {
            requestId,
            jobId: jId,
            photoId: pId,
            ms: Date.now() - t0,
        });

        return withRequestId(requestId, { success: true }, 200);
    } catch (error) {
        console.error("Error deleting mobile photo:", error);
        return jsonError(requestId, 500, "INTERNAL", "Failed to delete photo");
    }
}
