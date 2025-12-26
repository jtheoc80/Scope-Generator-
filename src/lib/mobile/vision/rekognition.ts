import { RekognitionClient, DetectLabelsCommand } from "@aws-sdk/client-rekognition";

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

async function fetchImageBytes(url: string, maxRedirects = 3): Promise<Uint8Array> {
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
  maxLabels?: number;
  minConfidence?: number;
}) {
  const client = getRekognitionClient();
  const bytes = await fetchImageBytes(params.imageUrl);

  // CRITICAL: Validate image format before sending to Rekognition.
  // Rekognition only supports JPEG/PNG. HEIC (common from iPhones) will fail silently.
  // @see https://docs.aws.amazon.com/rekognition/latest/dg/images-information.html
  const formatCheck = validateImageFormat(bytes);
  if (!formatCheck.valid) {
    console.error("rekognition.invalidFormat", {
      url: params.imageUrl.substring(0, 80) + "...",
      detectedFormat: formatCheck.format,
      error: formatCheck.error,
    });
    throw new Error(`REKOGNITION_FORMAT_ERROR: ${formatCheck.error}`);
  }

  console.log("rekognition.request", {
    url: params.imageUrl.substring(0, 80) + "...",
    format: formatCheck.format,
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

  console.log("rekognition.success", {
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
