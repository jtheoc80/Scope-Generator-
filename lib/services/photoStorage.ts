/**
 * Photo storage utilities for managing proposal photo objects in S3 or local storage.
 */
import path from "path";
import { promises as fs } from "fs";
import { createS3Client, isS3Configured } from "@/src/lib/mobile/storage/s3";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

async function deleteObjectFromLocalPublicDir(key: string) {
  const rel = key.replace(/^\/+/, "");
  const abs = path.join(process.cwd(), "public", rel);
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
