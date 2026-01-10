/**
 * Photo storage utilities for managing proposal photo objects in S3 or local storage.
 */
import path from "path";
import { promises as fs } from "fs";
import { createS3Client, isS3Configured } from "@/src/lib/mobile/storage/s3";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

async function deleteObjectFromLocalPublicDir(key: string) {
  // Defense-in-depth: prevent path traversal (only allow deletes under /public).
  const rel = path.posix.normalize(key.replace(/^\/+/, ""));
  if (rel.startsWith("..") || rel.includes("/../")) return;
  const publicDir = path.join(process.cwd(), "public");
  const abs = path.join(publicDir, rel);
  if (!abs.startsWith(publicDir + path.sep)) return;
  try {
    await fs.unlink(abs);
  } catch {
    // best-effort
  }
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

/**
 * Cleanup helper for deleting photo files when DB delete is driven by another route.
 */
export async function cleanupProposalPhotoObjects(keys: Array<string | null | undefined>) {
  const unique = Array.from(new Set(keys.filter((k): k is string => typeof k === "string" && k.length > 0)));
  await Promise.allSettled(unique.map((k) => deleteObject(k)));
}
