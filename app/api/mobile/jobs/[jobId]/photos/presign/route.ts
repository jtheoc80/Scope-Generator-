import { NextRequest } from "next/server";
import { requireMobileAuth } from "@/src/lib/mobile/auth";
import { presignPhotoRequestSchema } from "@/src/lib/mobile/types";
import { storage } from "@/lib/services/storage";
import { presignPutObject, isS3Configured } from "@/src/lib/mobile/storage/s3";
import { getRequestId, jsonError, logEvent, withRequestId } from "@/src/lib/mobile/observability";

// POST /api/mobile/jobs/:jobId/photos/presign
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const requestId = getRequestId(request.headers);
  const t0 = Date.now();
  try {
    // Early check for S3 configuration
    const s3Status = isS3Configured();
    if (!s3Status.configured) {
      logEvent("mobile.photos.presign.config_error", {
        requestId,
        missing: s3Status.missing,
      });
      return jsonError(
        requestId,
        503,
        "FAILED_PRECONDITION",
        `S3 storage not configured. Missing: ${s3Status.missing.join(", ")}`
      );
    }

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

    const body = await request.json();
    const parsed = presignPhotoRequestSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(
        requestId,
        400,
        "INVALID_INPUT",
        parsed.error.issues[0]?.message ?? "Invalid presign payload"
      );
    }

    const safeName = (parsed.data.filename || "photo")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(0, 80);

    const ext = safeName.includes(".") ? safeName.split(".").pop() : undefined;
    const key = `mobile/${authResult.userId}/jobs/${job.id}/${crypto.randomUUID()}${ext ? `.${ext}` : ""}`;

    // Path B: AWS S3 presigned PUT URLs
    const presigned = await presignPutObject({ key, contentType: parsed.data.contentType });

    // Keep response compatible with the simplified spec:
    // returns: { uploadUrl, publicUrl }
    logEvent("mobile.photos.presign.ok", {
      requestId,
      jobId: job.id,
      ms: Date.now() - t0,
    });

    return withRequestId(requestId, {
      uploadUrl: presigned.uploadUrl,
      publicUrl: presigned.publicUrl,
      key: presigned.key, // extra field (useful for debugging)
    });
  } catch (error) {
    console.error("Error presigning mobile photo upload:", error);
    
    // Provide more specific error messages
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    // Check for common configuration issues
    const s3Status = isS3Configured();
    if (!s3Status.configured) {
      logEvent("mobile.photos.presign.config_error", {
        requestId,
        missing: s3Status.missing,
      });
      return jsonError(
        requestId,
        503,
        "FAILED_PRECONDITION",
        `S3 storage not configured. Missing: ${s3Status.missing.join(", ")}`
      );
    }
    
    // Log the actual error for debugging
    logEvent("mobile.photos.presign.error", {
      requestId,
      error: errorMessage,
    });
    
    return jsonError(requestId, 500, "INTERNAL", `Failed to presign upload: ${errorMessage}`);
  }
}
