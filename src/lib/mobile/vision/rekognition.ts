import { RekognitionClient, DetectLabelsCommand } from "@aws-sdk/client-rekognition";
import sharp from "sharp";
import { parseS3Url, fetchS3ObjectBytes, type S3ObjectRef } from "../storage/s3";

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is required`);
  return v;
}

function getRekognitionClient() {
  return new RekognitionClient({
    region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1",
    credentials: process.env.AWS_ACCESS_KEY_ID
      ? {
          accessKeyId: requireEnv("AWS_ACCESS_KEY_ID"),
          secretAccessKey: requireEnv("AWS_SECRET_ACCESS_KEY"),
        }
      : undefined,
  });
}

/**
 * Validate that image bytes represent a JPEG or PNG image.
 * AWS Rekognition only supports these formats - HEIC/WEBP will fail silently.
 * @see https://docs.aws.amazon.com/rekognition/latest/dg/images-information.html
 */
function validateImageFormat(bytes: Uint8Array): { valid: boolean; format?: string; error?: string } {
  if (bytes.length < 8) {
    return { valid: false, error: "Image too small to be valid" };
  }

  // JPEG magic bytes: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return { valid: true, format: "jpeg" };
  }

  // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4E &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0D &&
    bytes[5] === 0x0A &&
    bytes[6] === 0x1A &&
    bytes[7] === 0x0A
  ) {
    return { valid: true, format: "png" };
  }

  // HEIC/HEIF detection (common iPhone format) - starts with ftyp
  if (
    bytes.length >= 12 &&
    bytes[4] === 0x66 && // 'f'
    bytes[5] === 0x74 && // 't'
    bytes[6] === 0x79 && // 'y'
    bytes[7] === 0x70    // 'p'
  ) {
    return { valid: false, format: "heic", error: "HEIC format not supported by Rekognition - convert to JPEG first" };
  }

  // WebP detection - RIFF....WEBP
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && // 'R'
    bytes[1] === 0x49 && // 'I'
    bytes[2] === 0x46 && // 'F'
    bytes[3] === 0x46 && // 'F'
    bytes[8] === 0x57 && // 'W'
    bytes[9] === 0x45 && // 'E'
    bytes[10] === 0x42 && // 'B'
    bytes[11] === 0x50   // 'P'
  ) {
    return { valid: false, format: "webp", error: "WebP format not supported by Rekognition - convert to JPEG first" };
  }

  return { valid: false, error: "Unknown image format - Rekognition requires JPEG or PNG" };
}

/**
 * Fetch image bytes directly from S3 using the SDK (no redirect issues).
 * Falls back to HTTP fetch if URL is not a recognized S3 URL.
 */
async function fetchImageBytesFromS3OrUrl(url: string, s3Ref: S3ObjectRef | null): Promise<Uint8Array> {
  // If we have an S3 reference, fetch directly from S3 (avoids 301 redirect issues)
  if (s3Ref) {
    console.log("rekognition.fetchS3Direct", {
      bucket: s3Ref.bucket,
      key: s3Ref.key.substring(0, 60) + "...",
    });
    return fetchS3ObjectBytes(s3Ref);
  }
  
  // Fallback: fetch via HTTP for non-S3 URLs
  return fetchImageBytesViaHttp(url);
}

/**
 * Fetch image bytes via HTTP (fallback for non-S3 URLs).
 */
async function fetchImageBytesViaHttp(url: string, maxRedirects = 3): Promise<Uint8Array> {
  let currentUrl = url;
  let redirectCount = 0;
  
  while (redirectCount <= maxRedirects) {
    // Use redirect: "manual" so we can handle and log redirects ourselves
    // Some runtimes don't follow redirects properly with "follow"
    const res = await fetch(currentUrl, { 
      redirect: "manual",
      headers: {
        // Some CDNs/S3 configurations need explicit accept header
        "Accept": "image/*,*/*",
      },
    });
    
    // Handle redirects manually for better debugging and control
    if (res.status === 301 || res.status === 302 || res.status === 307 || res.status === 308) {
      const location = res.headers.get("location");
      if (!location) {
        throw new Error(`FETCH_REDIRECT_ERROR: Image URL returned redirect (${res.status}) with no location header - URL may be expired or misconfigured`);
      }
      
      // Resolve relative redirects
      const nextUrl = location.startsWith("http") ? location : new URL(location, currentUrl).href;
      
      console.log("fetch.redirect", {
        from: currentUrl.substring(0, 80) + "...",
        to: nextUrl.substring(0, 80) + "...",
        status: res.status,
        redirectCount: redirectCount + 1,
      });
      
      currentUrl = nextUrl;
      redirectCount++;
      
      if (redirectCount > maxRedirects) {
        throw new Error(`FETCH_TOO_MANY_REDIRECTS: Image URL exceeded ${maxRedirects} redirects - URL may be misconfigured`);
      }
      continue;
    }
    
    if (!res.ok) {
      // Provide more helpful error messages for common HTTP errors
      if (res.status === 403) {
        throw new Error(`FETCH_FORBIDDEN: Access denied to image (403) - check S3 bucket permissions or URL signature expiration`);
      }
      if (res.status === 404) {
        throw new Error(`FETCH_NOT_FOUND: Image not found (404) - file may have been deleted`);
      }
      if (res.status >= 500) {
        throw new Error(`FETCH_SERVER_ERROR: Image host returned server error (${res.status}) - try again later`);
      }
      throw new Error(`FETCH_ERROR: Failed to fetch image (${res.status})`);
    }
    
    const buf = await res.arrayBuffer();
    if (buf.byteLength === 0) {
      throw new Error("FETCH_EMPTY: Image response was empty (0 bytes)");
    }
    
    return new Uint8Array(buf);
  }
  
  // This shouldn't be reached due to the throw inside the loop
  throw new Error(`FETCH_REDIRECT_ERROR: Exceeded max redirects`);
}

export async function analyzeWithRekognition(params: {
  imageUrl: string;
  s3Ref?: S3ObjectRef | null;
  maxLabels?: number;
  minConfidence?: number;
}) {
  const client = getRekognitionClient();
  
  // Try to parse S3 reference from URL if not provided
  const s3Ref = params.s3Ref !== undefined ? params.s3Ref : parseS3Url(params.imageUrl);
  
  // PREFERRED: Use S3Object to let Rekognition read directly from S3
  // BUT only if we are sure it's a supported format (JPEG/PNG).
  // If we suspect HEIC, we must fetch and convert it first.
  if (s3Ref) {
    // We check the file extension as a heuristic. If it's likely HEIC, skip S3 direct mode.
    const isLikelySupported = /\.(jpg|jpeg|png)$/i.test(s3Ref.key);
    
    if (isLikelySupported) {
      console.log("rekognition.request.s3Object", {
        bucket: s3Ref.bucket,
        key: s3Ref.key.substring(0, 60) + "...",
      });
      
      try {
        const cmd = new DetectLabelsCommand({
          Image: { 
            S3Object: { 
              Bucket: s3Ref.bucket, 
              Name: s3Ref.key 
            } 
          },
          MaxLabels: params.maxLabels ?? 20,
          MinConfidence: params.minConfidence ?? 70,
        });

        const out = await client.send(cmd);
        const labels = (out.Labels || [])
          .filter((l) => l.Name && typeof l.Confidence === "number")
          .map((l) => ({ name: l.Name as string, confidence: l.Confidence as number }))
          .sort((a, b) => b.confidence - a.confidence);

        console.log("rekognition.success.s3Object", {
          bucket: s3Ref.bucket,
          labelCount: labels.length,
          topLabels: labels.slice(0, 5).map(l => l.name),
        });

        return {
          provider: "aws" as const,
          service: "rekognition" as const,
          model: "DetectLabels",
          labels,
        };
      } catch (err: any) {
        // If S3 direct fails (e.g. InvalidImageFormatException), fall back to byte conversion below
        console.warn("rekognition.s3Object.failed", { error: err.message });
      }
    }
  }
  
  // FALLBACK: Fetch bytes and send to Rekognition (for non-S3 URLs or fallback)
  let bytes = await fetchImageBytesFromS3OrUrl(params.imageUrl, null);

  // Validate image format before sending to Rekognition.
  const formatCheck = validateImageFormat(bytes);
  
  // AUTOMATIC CONVERSION FIX: If HEIC/WebP, convert to JPEG
  if (!formatCheck.valid && (formatCheck.format === 'heic' || formatCheck.format === 'webp')) {
    console.log(`rekognition.converting`, { 
      from: formatCheck.format, 
      to: 'jpeg',
      originalSize: bytes.length 
    });
    
    try {
      bytes = await sharp(bytes)
        .toFormat('jpeg')
        .toBuffer();
        
      // Re-validate to ensure conversion worked
      const newCheck = validateImageFormat(bytes);
      if (!newCheck.valid) {
        throw new Error(`Conversion failed: ${newCheck.error}`);
      }
    } catch (convertErr: any) {
      throw new Error(`IMAGE_CONVERSION_ERROR: Failed to convert ${formatCheck.format} to JPEG: ${convertErr.message}`);
    }
  } else if (!formatCheck.valid) {
    console.error("rekognition.invalidFormat", {
      url: params.imageUrl.substring(0, 80) + "...",
      detectedFormat: formatCheck.format,
      error: formatCheck.error,
    });
    throw new Error(`REKOGNITION_FORMAT_ERROR: ${formatCheck.error}`);
  }

  console.log("rekognition.request.bytes", {
    url: params.imageUrl.substring(0, 80) + "...",
    format: "jpeg (converted or original)",
    byteLength: bytes.length,
  });

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

  console.log("rekognition.success.bytes", {
    labelCount: labels.length,
    topLabels: labels.slice(0, 5).map(l => l.name),
  });

  return {
    provider: "aws" as const,
    service: "rekognition" as const,
    model: "DetectLabels",
    labels,
  };
}
