import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { photoUploadSessions, mobileJobs, mobileJobPhotos } from "@shared/schema";
import { eq } from "drizzle-orm";
import { createHash } from "crypto";
import { createS3Client, isS3Configured } from "@/src/lib/mobile/storage/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { upsertPhotoRow } from "@/src/lib/similar-jobs/db";
import { enqueueEmbeddingJob, ensureSimilarJobEmbeddingWorker } from "@/src/lib/similar-jobs/worker";
import sharp from "sharp";

// IMPORTANT: Use Node.js runtime for crypto and AWS SDK operations.
export const runtime = "nodejs";

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;
// Max files per request (avoid oversized multipart payloads/timeouts)
const MAX_FILES = 20;
// Rekognition supports JPEG/PNG; we accept these directly
const SUPPORTED_TYPES = new Set(["image/jpeg", "image/png", "image/jpg"]);
// These formats will be auto-converted to JPEG before storage
const CONVERTIBLE_TYPES = new Set(["image/heic", "image/heif", "image/webp"]);

/**
 * Detect image format from magic bytes and convert if needed.
 * Returns the buffer (converted or original) and the content type.
 */
async function ensureJpegOrPng(
  inputBuffer: Buffer | Uint8Array,
  originalType: string
): Promise<{ buffer: Buffer; contentType: string; converted: boolean }> {
  // Ensure we have a proper Buffer for sharp
  const buffer = Buffer.isBuffer(inputBuffer) ? inputBuffer : Buffer.from(inputBuffer);
  // Check magic bytes to detect actual format (content-type can be wrong)
  const isHeic = buffer.length >= 12 &&
    buffer[4] === 0x66 && // 'f'
    buffer[5] === 0x74 && // 't'
    buffer[6] === 0x79 && // 'y'
    buffer[7] === 0x70;   // 'p'
  
  const isWebp = buffer.length >= 12 &&
    buffer[0] === 0x52 && // 'R'
    buffer[1] === 0x49 && // 'I'
    buffer[2] === 0x46 && // 'F'
    buffer[3] === 0x46 && // 'F'
    buffer[8] === 0x57 && // 'W'
    buffer[9] === 0x45 && // 'E'
    buffer[10] === 0x42 && // 'B'
    buffer[11] === 0x50;   // 'P'
  
  const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
  
  // If already JPEG or PNG, return as-is
  if (isJpeg || isPng) {
    return { buffer, contentType: isJpeg ? "image/jpeg" : "image/png", converted: false };
  }
  
  // If HEIC or WebP (by bytes or content-type), convert to JPEG
  if (isHeic || isWebp || CONVERTIBLE_TYPES.has(originalType.toLowerCase())) {
    const converted = await sharp(buffer).jpeg({ quality: 85 }).toBuffer();
    return { buffer: converted, contentType: "image/jpeg", converted: true };
  }
  
  // Unknown format - return as-is and let downstream handle it
  return { buffer, contentType: originalType, converted: false };
}

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
    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { success: false, error: `Too many files (max ${MAX_FILES})` },
        { status: 413 }
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
        const originalContentType = file.type.toLowerCase();
        if (!originalContentType.startsWith("image/")) {
          errors.push({ filename: file.name, error: "Not an image file" });
          continue;
        }

        // Validate file size before reading buffer
        if (file.size > MAX_FILE_SIZE) {
          errors.push({ filename: file.name, error: "File too large (max 10MB)" });
          continue;
        }

        // Read file buffer
        const rawBuffer = Buffer.from(await file.arrayBuffer());
        let contentType = originalContentType;
        let processedBuffer: Buffer = rawBuffer;
        
        // Auto-convert HEIC/WebP to JPEG for Rekognition compatibility.
        // This runs server-side so mobile users don't need to convert manually.
        if (!SUPPORTED_TYPES.has(originalContentType) || CONVERTIBLE_TYPES.has(originalContentType)) {
          try {
            const result = await ensureJpegOrPng(rawBuffer, originalContentType);
            processedBuffer = result.buffer;
            contentType = result.contentType;
            
            if (result.converted) {
              console.log(`Photo session ${sessionId}: Converted ${file.name} from ${originalContentType} to ${contentType}`);
            }
          } catch (conversionError) {
            console.error(`Photo session ${sessionId}: Failed to convert ${file.name}:`, conversionError);
            errors.push({
              filename: file.name,
              error: `Could not process image format (${originalContentType}). Please try JPEG or PNG.`,
            });
            continue;
          }
        }

        // Final check: ensure we have a supported format after conversion
        if (!SUPPORTED_TYPES.has(contentType)) {
          errors.push({
            filename: file.name,
            error: `Unsupported image format (${originalContentType}). Please upload JPEG or PNG.`,
          });
          continue;
        }

        // Generate unique key - always use .jpg extension for converted files
        const ext = contentType === "image/png" ? "png" : "jpg";
        const key = `mobile/${session.userId}/jobs/${session.jobId}/phone-${crypto.randomUUID()}.${ext}`;

        // Upload to S3
        await client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: processedBuffer,
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

        // Similar Job Retrieval (Phase 1): store S3 key + enqueue embedding compute (async)
        try {
          await upsertPhotoRow({ jobId: session.jobId, publicUrl });
          await enqueueEmbeddingJob(session.jobId);
          ensureSimilarJobEmbeddingWorker();
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.warn("similarity.enqueue.failed", { jobId: session.jobId, error: msg });
        }

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
