import { NextRequest, NextResponse } from "next/server";
import { requireMobileAuth } from "@/src/lib/mobile/auth";
import { presignPhotoRequestSchema } from "@/src/lib/mobile/types";
import { storage } from "@/lib/services/storage";
import { presignPutObject } from "@/src/lib/mobile/storage/s3";

// POST /api/mobile/jobs/:jobId/photos/presign
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const authResult = await requireMobileAuth(request);
    if (!authResult.ok) return authResult.response;

    const { jobId } = await params;
    const id = parseInt(jobId);
    if (Number.isNaN(id)) {
      return NextResponse.json({ message: "Invalid jobId" }, { status: 400 });
    }

    const job = await storage.getMobileJob(id, authResult.userId);
    if (!job) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = presignPhotoRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Invalid presign payload" },
        { status: 400 }
      );
    }

    const safeName = (parsed.data.filename || "photo")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(0, 80);

    const ext = safeName.includes(".") ? safeName.split(".").pop() : undefined;
    const key = `mobile/${authResult.userId}/jobs/${job.id}/${crypto.randomUUID()}${ext ? `.${ext}` : ""}`;

    const presigned = await presignPutObject({
      key,
      contentType: parsed.data.contentType,
    });

    // Keep response compatible with the simplified spec:
    // returns: { uploadUrl, publicUrl }
    return NextResponse.json({
      uploadUrl: presigned.uploadUrl,
      publicUrl: presigned.publicUrl,
      key: presigned.key, // extra field (useful for debugging)
    });
  } catch (error) {
    console.error("Error presigning mobile photo upload:", error);
    return NextResponse.json(
      { message: "Failed to presign upload" },
      { status: 500 }
    );
  }
}
