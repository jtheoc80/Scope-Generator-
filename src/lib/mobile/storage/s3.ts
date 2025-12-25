import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function joinUrl(base: string, path: string) {
  const b = base.replace(/\/+$/, "");
  const p = path.replace(/^\/+/, "");
  return `${b}/${p}`;
}

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is required`);
  return v;
}

/**
 * Check if S3 storage is properly configured.
 * Returns an object with `configured` boolean and optional `missing` array of env vars.
 */
export function isS3Configured(): { configured: boolean; missing: string[] } {
  const required = ["S3_BUCKET", "S3_PUBLIC_BASE_URL"];
  const missing = required.filter((name) => !process.env[name]);
  
  // Also check for credentials (either AWS_* or S3_* or IAM role)
  const hasCredentials = 
    (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) ||
    (process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY) ||
    // IAM roles are available when running on AWS infrastructure
    process.env.AWS_EXECUTION_ENV;
  
  if (!hasCredentials && !process.env.AWS_EXECUTION_ENV) {
    // Only warn about credentials if not in AWS environment
    const credMissing = !process.env.AWS_ACCESS_KEY_ID && !process.env.S3_ACCESS_KEY_ID 
      ? ["AWS_ACCESS_KEY_ID or S3_ACCESS_KEY_ID"] 
      : [];
    if (!process.env.AWS_SECRET_ACCESS_KEY && !process.env.S3_SECRET_ACCESS_KEY) {
      credMissing.push("AWS_SECRET_ACCESS_KEY or S3_SECRET_ACCESS_KEY");
    }
    missing.push(...credMissing);
  }
  
  return { configured: missing.length === 0, missing };
}

function getAwsCredentials() {
  // Prefer standard AWS_* credentials, fallback to legacy S3_* keys.
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) return null;
  return { accessKeyId, secretAccessKey };
}

export type PresignPutResult = {
  key: string;
  uploadUrl: string;
  publicUrl: string;
};

/**
 * Extracts the AWS region code from a string that may contain the full display name.
 * e.g., "US East (Ohio) us-east-2" -> "us-east-2"
 *       "us-east-2" -> "us-east-2"
 */
function normalizeAwsRegion(regionInput: string): string {
  // AWS region codes follow the pattern: xx-xxxx-N (e.g., us-east-2, eu-west-1, ap-southeast-1)
  const regionCodeMatch = regionInput.match(/[a-z]{2}-[a-z]+-\d/);
  if (regionCodeMatch) {
    return regionCodeMatch[0];
  }
  // Return as-is if no pattern found (will let AWS SDK handle validation)
  return regionInput;
}

export function createS3Client() {
  const rawRegion = process.env.AWS_REGION || process.env.S3_REGION || "us-east-1";
  const region = normalizeAwsRegion(rawRegion);

  return new S3Client({
    region,
    endpoint: process.env.S3_ENDPOINT,
    credentials: getAwsCredentials() ?? undefined,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  });
}

export async function presignPutObject(params: {
  key: string;
  contentType: string;
  expiresInSeconds?: number;
}): Promise<PresignPutResult> {
  const bucket = requireEnv("S3_BUCKET");
  const publicBaseUrl = requireEnv("S3_PUBLIC_BASE_URL");

  const client = createS3Client();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: params.key,
    ContentType: params.contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn: params.expiresInSeconds ?? 900,
  });

  return {
    key: params.key,
    uploadUrl,
    publicUrl: joinUrl(publicBaseUrl, params.key),
  };
}
