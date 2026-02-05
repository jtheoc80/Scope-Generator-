
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/services/db";
import { mobileJobs, mobileJobPhotos } from "@shared/schema";
import { eq } from "drizzle-orm";
import { createS3Client, isS3Configured } from "@/src/lib/mobile/storage/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { upsertPhotoRow } from "@/src/lib/similar-jobs/db";
import { enqueueEmbeddingJob, ensureSimilarJobEmbeddingWorker } from "@/src/lib/similar-jobs/worker";
import { requireMobileAuth } from "@/src/lib/mobile/auth"; // Auth check
import { getRequestId, jsonError, logEvent, withRequestId } from "@/src/lib/mobile/observability";
import sharp from "sharp";

// IMPORTANT: Use Node.js runtime for crypto and AWS SDK operations.
export const runtime = "nodejs";

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;
// Max files per request
const MAX_FILES = 20;

// Supported formats
const SUPPORTED_TYPES = new Set(["image/jpeg", "image/png", "image/jpg"]);
const CONVERTIBLE_TYPES = new Set(["image/heic", "image/heif", "image/webp"]);

/**
 * Detect image format from magic bytes and convert if needed.
 */
async function ensureJpegOrPng(
    inputBuffer: Buffer | Uint8Array,
    originalType: string
): Promise<{ buffer: Buffer; contentType: string; converted: boolean }> {
    const buffer = Buffer.isBuffer(inputBuffer) ? inputBuffer : Buffer.from(inputBuffer);

    const isHeic = buffer.length >= 12 && buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70;
    const isWebp = buffer.length >= 12 && buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;

    const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;

    if (isJpeg || isPng) {
        return { buffer, contentType: isJpeg ? "image/jpeg" : "image/png", converted: false };
    }

    if (isHeic || isWebp || CONVERTIBLE_TYPES.has(originalType.toLowerCase())) {
        const converted = await sharp(buffer).jpeg({ quality: 85 }).toBuffer();
        return { buffer: converted, contentType: "image/jpeg", converted: true };
    }

    return { buffer, contentType: originalType, converted: false };
}

// POST /api/mobile/jobs/[jobId]/photos/upload
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ jobId: string }> }
) {
    const requestId = getRequestId(request.headers);
    const t0 = Date.now();

    try {
        // 1. Check S3 configuration
        const s3Status = isS3Configured();
        if (!s3Status.configured) {
            logEvent("mobile.photos.upload.config_error", { requestId, missing: s3Status.missing });
            return jsonError(requestId, 503, "FAILED_PRECONDITION", `Storage not configured. Missing: ${s3Status.missing.join(", ")}`);
        }

        // 2. Validate jobId
        const { jobId } = await params;
        const id = parseInt(jobId);
        if (Number.isNaN(id)) return jsonError(requestId, 400, "INVALID_INPUT", "Invalid jobId");

        // 3. Auth
        const authResult = await requireMobileAuth(request, requestId);
        if (!authResult.ok) return authResult.response;

        const [job] = await db.select().from(mobileJobs).where(eq(mobileJobs.id, id));
        if (!job || job.userId !== authResult.userId) {
            return jsonError(requestId, 404, "NOT_FOUND", "Job not found");
        }

        // 4. Parse multipart form data
        const formData = await request.formData();
        const files: File[] = [];
        for (const [key, value] of formData.entries()) {
            if (key === "files" || key === "file") {
                if (value instanceof File) files.push(value);
            }
        }

        if (files.length === 0) return jsonError(requestId, 400, "INVALID_INPUT", "No files provided");
        if (files.length > MAX_FILES) return jsonError(requestId, 413, "PAYLOAD_TOO_LARGE", `Too many files (max ${MAX_FILES})`);

        // 5. Process uploads
        const uploadedPhotos: Array<{ id: number; publicUrl: string }> = [];
        const errors: Array<{ filename: string; error: string }> = [];

        const bucket = process.env.S3_BUCKET!;
        const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL!;
        const client = createS3Client();

        for (const file of files) {
            try {
                const originalContentType = file.type.toLowerCase();
                if (!originalContentType.startsWith("image/")) {
                    errors.push({ filename: file.name, error: "Not an image file" });
                    continue;
                }
                if (file.size > MAX_FILE_SIZE) {
                    errors.push({ filename: file.name, error: "File too large (max 10MB)" });
                    continue;
                }

                const rawBuffer = Buffer.from(await file.arrayBuffer());
                let contentType = originalContentType;
                let processedBuffer: Buffer = rawBuffer;

                if (!SUPPORTED_TYPES.has(originalContentType) || CONVERTIBLE_TYPES.has(originalContentType)) {
                    try {
                        const result = await ensureJpegOrPng(rawBuffer, originalContentType);
                        processedBuffer = result.buffer;
                        contentType = result.contentType;
                    } catch (conversionError) {
                        console.error(`Job ${id}: Failed to convert ${file.name}:`, conversionError);
                        errors.push({ filename: file.name, error: "Could not process image format" });
                        continue;
                    }
                }

                if (!SUPPORTED_TYPES.has(contentType)) {
                    errors.push({ filename: file.name, error: "Unsupported image format" });
                    continue;
                }

                const ext = contentType === "image/png" ? "png" : "jpg";
                const key = `mobile/${authResult.userId}/jobs/${id}/site-${crypto.randomUUID()}.${ext}`;

                await client.send(
                    new PutObjectCommand({
                        Bucket: bucket,
                        Key: key,
                        Body: processedBuffer,
                        ContentType: contentType,
                        // Disable checksums explicitly if needed, but client config handles it mostly
                    })
                );

                const publicUrl = `${publicBaseUrl.replace(/\/+$/, "")}/${key}`;

                const [photo] = await db
                    .insert(mobileJobPhotos)
                    .values({ jobId: id, publicUrl, kind: "site" })
                    .returning();

                // Similar Jobs
                try {
                    await upsertPhotoRow({ jobId: id, publicUrl });
                    await enqueueEmbeddingJob(id);
                    ensureSimilarJobEmbeddingWorker();
                } catch (e) {
                    const msg = e instanceof Error ? e.message : String(e);
                    console.warn("similarity.enqueue.failed", { jobId: id, error: msg });
                }

                // Update job status
                await db.update(mobileJobs).set({ status: "photos_uploaded", updatedAt: new Date() }).where(eq(mobileJobs.id, id));

                // Sign the URL for immediate display
                const signedUrl = await import("@/src/lib/mobile/storage/s3").then(m => m.presignGetObject(publicUrl));
                uploadedPhotos.push({ id: photo.id, publicUrl: signedUrl });
            } catch (uploadError) {
                console.error(`Job ${id}: Failed to upload ${file.name}:`, uploadError);
                errors.push({ filename: file.name, error: "Upload failed" });
            }
        }

        logEvent("mobile.photos.upload_proxy.done", {
            requestId,
            jobId: id,
            count: uploadedPhotos.length,
            failures: errors.length,
            ms: Date.now() - t0,
        });

        return withRequestId(requestId, {
            success: uploadedPhotos.length > 0,
            uploadedPhotos,
            errors: errors.length > 0 ? errors : undefined,
        });

    } catch (error) {
        console.error("Error in proxy upload:", error);
        return jsonError(requestId, 500, "INTERNAL", "Upload failed");
    }
}
