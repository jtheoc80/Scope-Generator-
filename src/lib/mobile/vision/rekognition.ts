import { RekognitionClient, DetectLabelsCommand } from "@aws-sdk/client-rekognition";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

function getAwsCredentials() {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  
  if (!accessKeyId || !secretAccessKey) {
    return null;
  }
  
  return { accessKeyId, secretAccessKey };
}

function getRekognitionClient() {
  const credentials = getAwsCredentials();
  
  if (!credentials) {
    console.warn("vision.rekognition.noCredentials", {
      message: "AWS credentials not configured - Rekognition will be skipped",
    });
    return null;
  }
  
  return new RekognitionClient({
    region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1",
    credentials,
  });
}

function getS3Client() {
  const credentials = getAwsCredentials();
  if (!credentials) return null;
  
  return new S3Client({
    region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1",
    credentials,
  });
}

// Extract bucket and key from S3 URL
function parseS3Url(url: string): { bucket: string; key: string } | null {
  // Try various S3 URL formats:
  // https://bucket.s3.amazonaws.com/key
  // https://bucket.s3.region.amazonaws.com/key  
  // https://s3.amazonaws.com/bucket/key
  // https://s3.region.amazonaws.com/bucket/key
  // Or custom domain from S3_PUBLIC_BASE_URL
  
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const pathname = urlObj.pathname;
    
    // Format: bucket.s3.amazonaws.com or bucket.s3.region.amazonaws.com
    const bucketDomainMatch = hostname.match(/^([^.]+)\.s3(?:\.[^.]+)?\.amazonaws\.com$/);
    if (bucketDomainMatch) {
      return {
        bucket: bucketDomainMatch[1],
        key: pathname.slice(1), // Remove leading /
      };
    }
    
    // Format: s3.amazonaws.com/bucket/key or s3.region.amazonaws.com/bucket/key
    const pathStyleMatch = hostname.match(/^s3(?:\.[^.]+)?\.amazonaws\.com$/);
    if (pathStyleMatch) {
      const parts = pathname.slice(1).split('/');
      if (parts.length >= 2) {
        return {
          bucket: parts[0],
          key: parts.slice(1).join('/'),
        };
      }
    }
    
    // Try using S3_PUBLIC_BASE_URL to parse
    const baseUrl = process.env.S3_PUBLIC_BASE_URL;
    const bucket = process.env.S3_BUCKET;
    if (baseUrl && bucket && url.startsWith(baseUrl)) {
      const key = url.slice(baseUrl.length).replace(/^\/+/, '');
      return { bucket, key };
    }
    
    return null;
  } catch {
    return null;
  }
}

async function fetchImageBytes(url: string): Promise<Uint8Array> {
  console.log("vision.rekognition.fetchImage", { url: url.substring(0, 80) + "..." });
  
  // Try to fetch from S3 using credentials first (handles private buckets)
  const s3Info = parseS3Url(url);
  const s3Client = getS3Client();
  
  if (s3Info && s3Client) {
    console.log("vision.rekognition.fetchFromS3", { bucket: s3Info.bucket, key: s3Info.key.substring(0, 50) });
    try {
      const response = await s3Client.send(new GetObjectCommand({
        Bucket: s3Info.bucket,
        Key: s3Info.key,
      }));
      
      if (response.Body) {
        const bytes = await response.Body.transformToByteArray();
        console.log("vision.rekognition.s3Fetched", { bytes: bytes.length });
        return bytes;
      }
    } catch (s3Err) {
      console.warn("vision.rekognition.s3FetchFailed", { 
        error: s3Err instanceof Error ? s3Err.message : String(s3Err),
        bucket: s3Info.bucket,
      });
      // Fall through to try public URL
    }
  }
  
  // Fallback: try fetching as public URL
  const res = await fetch(url, {
    headers: {
      "User-Agent": "ScopeGen-Vision/1.0",
    },
  });
  
  if (!res.ok) {
    const errorDetail = `Failed to fetch image: status=${res.status} statusText=${res.statusText}`;
    console.error("vision.rekognition.fetchFailed", { 
      url: url.substring(0, 80), 
      status: res.status,
      statusText: res.statusText,
    });
    throw new Error(errorDetail);
  }
  
  const buf = await res.arrayBuffer();
  console.log("vision.rekognition.imageFetched", { bytes: buf.byteLength });
  return new Uint8Array(buf);
}

export async function analyzeWithRekognition(params: {
  imageUrl: string;
  maxLabels?: number;
  minConfidence?: number;
}) {
  const client = getRekognitionClient();
  
  if (!client) {
    throw new Error("REKOGNITION_NO_CREDENTIALS: AWS credentials not configured");
  }
  
  const bytes = await fetchImageBytes(params.imageUrl);

  const cmd = new DetectLabelsCommand({
    Image: { Bytes: bytes },
    MaxLabels: params.maxLabels ?? 20,
    MinConfidence: params.minConfidence ?? 70,
  });

  const out = await client.send(cmd);
  const labels = (out.Labels || [])
    .filter((l) => l.Name && typeof l.Confidence === "number")
    .map((l) => ({ name: l.Name as string, confidence: l.Confidence as number }))
    .sort((a, b) => b.confidence - a.confidence);

  return {
    provider: "aws" as const,
    service: "rekognition" as const,
    model: "DetectLabels",
    labels,
  };
}
