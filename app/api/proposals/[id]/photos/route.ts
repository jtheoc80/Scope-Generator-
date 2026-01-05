import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import sharp from "sharp";
import path from "path";
import { promises as fs } from "fs";
import { storage } from "@/lib/services/storage";
import { createS3Client, isS3Configured } from "@/src/lib/mobile/storage/s3";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

function jsonError(status: number, message: string) {
  return NextResponse.json({ message }, { status });
}

function safeExtFromMime(mime: string): string {
  const m = mime.toLowerCase();
  if (m === "image/jpeg" || m === "image/jpg") return "jpg";
  if (m === "image/png") return "png";
  if (m === "image/webp") return "webp";
  if (m === "image/avif") return "avif";
  return "bin";
}

function toPublicUrlFromKey(key: string): string {
  // Prefer configured S3 public base URL when present (works for both S3 and CDN).
  const base = process.env.S3_PUBLIC_BASE_URL;
  if (base) return `${base.replace(/\/+$/, "")}/${key.replace(/^\/+/, "")}`;
  // Local dev fallback: write under /public and serve via Next.
  return `/${key.replace(/^\/+/, "")}`;
}

async function putObjectToLocalPublicDir(key: string, body: Buffer) {
  const rel = key.replace(/^\/+/, "");
  const abs = path.join(process.cwd(), "public", rel);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, body);
}

async function deleteObjectFromLocalPublicDir(key: string) {
  const rel = key.replace(/^\/+/, "");
  const abs = path.join(process.cwd(), "public", rel);
  try {
    await fs.unlink(abs);
  } catch {
    // best-effort
  }
}

async function putObject(key: string, contentType: string, body: Buffer) {
  const s3 = isS3Configured();
  if (s3.configured) {
    const bucket = process.env.S3_BUCKET!;
    const client = createS3Client();
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
    );
    return;
  }

  // Local fallback (dev/CI without S3).
  // In production, require object storage to avoid ephemeral filesystem writes.
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      `Storage not configured. Missing: ${s3.missing.join(", ")}`
    );
  }
  await putObjectToLocalPublicDir(key, body);
}

async function deleteObject(key: string) {
  const s3 = isS3Configured();
  if (s3.configured) {
    const bucket = process.env.S3_BUCKET!;
    const client = createS3Client();
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );
    return;
  }

  if (process.env.NODE_ENV === "production") return;
  await deleteObjectFromLocalPublicDir(key);
}

// GET /api/proposals/:id/photos
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return jsonError(401, "Unauthorized");

  const { id } = await params;
  const proposalId = parseInt(id, 10);
  if (Number.isNaN(proposalId)) return jsonError(400, "Invalid proposal ID");

  const proposal = await storage.getProposal(proposalId);
  if (!proposal) return jsonError(404, "Proposal not found");
  if (proposal.userId !== userId) return jsonError(403, "Access denied");

  const photos = await storage.getProposalPhotos(proposalId, userId);

  return NextResponse.json({
    photos: photos.map((p) => ({
      ...p,
      urls: {
        original: p.publicUrl,
        thumb: p.thumbUrl ?? p.publicUrl,
        medium: p.mediumUrl ?? p.publicUrl,
      },
    })),
  });
}

// POST /api/proposals/:id/photos (multipart upload)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return jsonError(401, "Unauthorized");

  const { id } = await params;
  const proposalId = parseInt(id, 10);
  if (Number.isNaN(proposalId)) return jsonError(400, "Invalid proposal ID");

  const proposal = await storage.getProposal(proposalId);
  if (!proposal) return jsonError(404, "Proposal not found");
  if (proposal.userId !== userId) return jsonError(403, "Access denied");

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return jsonError(400, "Missing file");

  if (!file.type?.startsWith("image/")) {
    return jsonError(400, "Only image uploads are supported");
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return jsonError(400, "File too large (max 10MB)");
  }

  const category = (form.get("category") as string | null) ?? "other";
  const caption = (form.get("caption") as string | null) ?? null;
  const displayOrderRaw = form.get("displayOrder");
  const displayOrder =
    typeof displayOrderRaw === "string" ? parseInt(displayOrderRaw, 10) : 0;

  const originalBuffer = Buffer.from(await file.arrayBuffer());

  // Read image metadata + normalize orientation, validating that this is a real image.
  let width: number | null = null;
  let height: number | null = null;
  let thumbBuffer: Buffer;
  let mediumBuffer: Buffer;

  try {
    // Use metadata extraction as the primary validation step.
    const baseImg = sharp(originalBuffer);
    const meta = await baseImg.metadata();

    // If format is missing, treat this as an invalid image upload.
    if (!meta.format) {
      return jsonError(400, "Invalid image file");
    }

    width = typeof meta.width === "number" ? meta.width : null;
    height = typeof meta.height === "number" ? meta.height : null;

    const img = baseImg.rotate();

    // Generate optimized derivatives (webp) for fast, consistent UI rendering.
    thumbBuffer = await img
      .clone()
      .resize({ width: 480, withoutEnlargement: true })
      .webp({ quality: 75 })
      .toBuffer();

    mediumBuffer = await img
      .clone()
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
  } catch (err) {
    console.error("Invalid or corrupted image upload", err);
    return jsonError(400, "Invalid image file");
  }
  const baseKey = `uploads/proposals/${userId}/${proposalId}/${crypto.randomUUID()}`;
  const originalKey = `${baseKey}.${safeExtFromMime(file.type || "image/jpeg")}`;
  const thumbKey = `${baseKey}.thumb.webp`;
  const mediumKey = `${baseKey}.medium.webp`;

  // Upload all objects before writing DB row (so refresh always works).
  try {
    await putObject(originalKey, file.type || "application/octet-stream", originalBuffer);
    await putObject(thumbKey, "image/webp", thumbBuffer);
    await putObject(mediumKey, "image/webp", mediumBuffer);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return jsonError(503, `Upload failed: ${msg}`);
  }

  const publicUrl = toPublicUrlFromKey(originalKey);
  const thumbUrl = toPublicUrlFromKey(thumbKey);
  const mediumUrl = toPublicUrlFromKey(mediumKey);

  const created = await storage.addProposalPhoto(proposalId, userId, {
    publicUrl,
    storageKey: originalKey,
    thumbKey,
    mediumKey,
    thumbUrl,
    mediumUrl,
    category: category as any,
    caption,
    filename: file.name || null,
    displayOrder: Number.isFinite(displayOrder) ? displayOrder : 0,
    fileSize: file.size,
    mimeType: file.type || null,
    width,
    height,
  });

  return NextResponse.json(
    {
      ...created,
      urls: {
        original: created.publicUrl,
        thumb: created.thumbUrl ?? created.publicUrl,
        medium: created.mediumUrl ?? created.publicUrl,
      },
    },
    { status: 201 }
  );
}

// DELETE helper for cleaning up files when DB delete is driven by another route.
export async function cleanupProposalPhotoObjects(keys: Array<string | null | undefined>) {
  const unique = Array.from(new Set(keys.filter((k): k is string => typeof k === "string" && k.length > 0)));
  await Promise.allSettled(unique.map((k) => deleteObject(k)));
}

