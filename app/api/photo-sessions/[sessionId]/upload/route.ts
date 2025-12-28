import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { photoUploadSessions, mobileJobs, mobileJobPhotos } from "@shared/schema";
import { eq } from "drizzle-orm";
import { createHash } from "crypto";
import { createS3Client, isS3Configured } from "@/src/lib/mobile/storage/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";

// IMPORTANT: Use Node.js runtime for crypto and AWS SDK operations.
export const runtime = "nodejs";

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Hash a token using SHA-256
 */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Validate the session and token
 */
async function validateSession(sessionId: string, token: string) {
  // Look up session
  const [session] = await db
    .select()
    .from(photoUploadSessions)
    .where(eq(photoUploadSessions.id, sessionId));

  if (!session) {
    return { valid: false, error: "Session not found", status: 404 };
  }

  // Verify token hash
  const tokenHash = hashToken(token);
  if (tokenHash !== session.tokenHash) {
    return { valid: false, error: "Invalid token", status: 401 };
  }

  // Check expiration
  if (new Date() > session.expiresAt) {
    return { valid: false, error: "Session expired. Please generate a new QR code from your desktop.", status: 410 };
  }

  return { valid: true, session };
}

/**
 * POST /api/photo-sessions/[sessionId]/upload
 * Uploads photos from phone without requiring authentication.
 * Uses the session token for authorization instead.
 * 
 * Request:
 * - Content-Type: multipart/form-data
 * - token: string (form field, required)
 * - files: File[] (form field, required) - One or more image files
 * 
 * Returns:
 * - success: boolean
 * - uploadedPhotos: Array<{ id, publicUrl }>
 * - errors: Array<{ filename, error }> (if any uploads failed)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const t0 = Date.now();
  
  try {
    // Check S3 configuration
    const s3Status = isS3Configured();
    if (!s3Status.configured) {
      console.error("S3 not configured:", s3Status.missing);
      return NextResponse.json(
        { success: false, error: `Storage not configured. Missing: ${s3Status.missing.join(", ")}` },
        { status: 503 }
      );
    }

    const { sessionId } = await params;

    // Parse multipart form data
    const formData = await request.formData();
    const token = formData.get("token") as string | null;
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token is required" },
        { status: 400 }
      );
    }

    // Validate session
    const validation = await validateSession(sessionId, token);
    if (!validation.valid || !validation.session) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: validation.status }
      );
    }

    const { session } = validation;

    // Get the job to verify it still exists
    const [job] = await db
      .select()
      .from(mobileJobs)
      .where(eq(mobileJobs.id, session.jobId));

    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }

    // Get all files from form data
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key === "files" || key === "file") {
        if (value instanceof File) {
          files.push(value);
        }
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No files provided" },
        { status: 400 }
      );
    }

    // Process uploads
    const uploadedPhotos: Array<{ id: number; publicUrl: string }> = [];
    const errors: Array<{ filename: string; error: string }> = [];

    const bucket = process.env.S3_BUCKET!;
    const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL!;
    const client = createS3Client();

    for (const file of files) {
      try {
        // Validate file type
        const contentType = file.type.toLowerCase();
        if (!contentType.startsWith("image/")) {
          errors.push({ filename: file.name, error: "Not an image file" });
          continue;
        }

        // Check supported formats (AWS Rekognition only supports JPEG/PNG)
        const supportedTypes = ["image/jpeg", "image/png", "image/jpg"];
        if (!supportedTypes.includes(contentType)) {
          // Allow but warn for other formats - client should have converted
          console.warn(`Photo session ${sessionId}: Unsupported format ${contentType} for ${file.name}`);
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          errors.push({ filename: file.name, error: "File too large (max 10MB)" });
          continue;
        }

        // Generate unique key
        const ext = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() : "jpg";
        const key = `mobile/${session.userId}/jobs/${session.jobId}/phone-${crypto.randomUUID()}.${ext}`;

        // Read file buffer
        const buffer = Buffer.from(await file.arrayBuffer());

        // Upload to S3
        await client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: buffer,
            ContentType: contentType,
          })
        );

        // Generate public URL
        const publicUrl = `${publicBaseUrl.replace(/\/+$/, "")}/${key}`;

        // Register in database
        const [photo] = await db
          .insert(mobileJobPhotos)
          .values({
            jobId: session.jobId,
            publicUrl,
            kind: "site",
          })
          .returning();

        // Update job status
        await db
          .update(mobileJobs)
          .set({ status: "photos_uploaded", updatedAt: new Date() })
          .where(eq(mobileJobs.id, session.jobId));

        uploadedPhotos.push({
          id: photo.id,
          publicUrl,
        });

        console.log(`Photo session ${sessionId}: Uploaded ${file.name} -> ${publicUrl}`);
      } catch (uploadError) {
        console.error(`Photo session ${sessionId}: Failed to upload ${file.name}:`, uploadError);
        errors.push({
          filename: file.name,
          error: uploadError instanceof Error ? uploadError.message : "Upload failed",
        });
      }
    }

    const ms = Date.now() - t0;
    console.log(`Photo session ${sessionId}: Completed ${uploadedPhotos.length}/${files.length} uploads in ${ms}ms`);

    return NextResponse.json({
      success: uploadedPhotos.length > 0,
      uploadedPhotos,
      errors: errors.length > 0 ? errors : undefined,
      totalUploaded: uploadedPhotos.length,
      totalFailed: errors.length,
    });
  } catch (error) {
    console.error("Error in photo session upload:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
