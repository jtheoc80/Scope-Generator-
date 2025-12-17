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

export function createS3Client() {
  const region = process.env.AWS_REGION || process.env.S3_REGION || "us-east-1";

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
