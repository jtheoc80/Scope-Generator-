import OpenAI from "openai";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { photoFindingsSchema } from "./types";

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("vision.gpt.noApiKey", { 
      message: "OPENAI_API_KEY not configured - GPT vision will be skipped" 
    });
    return null;
  }
  return new OpenAI({ apiKey, timeout: 60000 }); // 60s timeout
}

function getS3Client() {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) return null;
  
  return new S3Client({
    region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1",
    credentials: { accessKeyId, secretAccessKey },
  });
}

// Extract bucket and key from S3 URL
function parseS3Url(url: string): { bucket: string; key: string } | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const pathname = urlObj.pathname;
    
    // Format: bucket.s3.amazonaws.com or bucket.s3.region.amazonaws.com
    const bucketDomainMatch = hostname.match(/^([^.]+)\.s3(?:\.[^.]+)?\.amazonaws\.com$/);
    if (bucketDomainMatch) {
      return {
        bucket: bucketDomainMatch[1],
        key: pathname.slice(1),
      };
    }
    
    // Format: s3.amazonaws.com/bucket/key
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

// Fetch image and convert to base64 data URL for OpenAI
async function fetchImageAsBase64(imageUrl: string): Promise<string> {
  console.log("vision.gpt.fetchImage", { url: imageUrl.substring(0, 80) + "..." });
  
  // Try to fetch from S3 using credentials first (handles private buckets)
  const s3Info = parseS3Url(imageUrl);
  const s3Client = getS3Client();
  
  if (s3Info && s3Client) {
    console.log("vision.gpt.fetchFromS3", { bucket: s3Info.bucket, key: s3Info.key.substring(0, 50) });
    try {
      const response = await s3Client.send(new GetObjectCommand({
        Bucket: s3Info.bucket,
        Key: s3Info.key,
      }));
      
      if (response.Body) {
        const bytes = await response.Body.transformToByteArray();
        const contentType = response.ContentType || "image/jpeg";
        const base64 = Buffer.from(bytes).toString("base64");
        
        console.log("vision.gpt.s3Fetched", { 
          bytes: bytes.length,
          contentType,
        });
        
        return `data:${contentType};base64,${base64}`;
      }
    } catch (s3Err) {
      console.warn("vision.gpt.s3FetchFailed", { 
        error: s3Err instanceof Error ? s3Err.message : String(s3Err),
        bucket: s3Info.bucket,
      });
      // Fall through to try public URL
    }
  }
  
  // Fallback: try fetching as public URL
  const response = await fetch(imageUrl, {
    headers: {
      "User-Agent": "ScopeGen-Vision/1.0",
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch image for GPT: status=${response.status}`);
  }
  
  const contentType = response.headers.get("content-type") || "image/jpeg";
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  
  console.log("vision.gpt.imageFetched", { 
    bytes: arrayBuffer.byteLength,
    contentType,
  });
  
  return `data:${contentType};base64,${base64}`;
}

export async function analyzeWithGptVision(params: {
  imageUrl: string;
  kind: string;
  rekognitionLabels: string[];
}) {
  const model = process.env.OPENAI_VISION_MODEL || "gpt-4o-mini";

  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      schemaVersion: { const: "v1" },
      confidence: { type: "number" },
      kindGuess: { type: "string" },
      labels: { type: "array", items: { type: "string" } },
      objects: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: { name: { type: "string" }, notes: { type: "string" } },
          required: ["name"],
        },
      },
      materials: { type: "array", items: { type: "string" } },
      damage: { type: "array", items: { type: "string" } },
      issues: { type: "array", items: { type: "string" } },
      measurements: { type: "array", items: { type: "string" } },
      needsMorePhotos: { type: "array", items: { type: "string" } },
    },
    required: ["schemaVersion", "confidence", "labels", "objects", "materials", "damage", "issues", "measurements", "needsMorePhotos"],
  } as const;

  const system = `You are a senior field estimator helping contractors create accurate job scopes and quotes.

Your job is to identify ALL actionable issues a contractor should address, including:
- Visible damage (cracks, stains, rot, water damage, etc.)
- Missing components (missing light shades, missing hardware, incomplete fixtures)
- Items in disrepair or poor condition (worn, dated, broken, non-functional)
- Fixtures or elements that need replacement or upgrade (outdated, mismatched, incomplete)
- Safety concerns (exposed wiring, unstable fixtures, hazards)

Rules:
- List damage in the "damage" array (physical damage like cracks, stains, rot)
- List other issues in the "issues" array (missing parts, dated items, things needing replacement)
- Add notes to objects when they have problems (e.g., "Chandelier" with notes: "missing glass shades, dated style")
- Be thorough: if something looks wrong, old, missing, or needs attention, include it
- If unsure about details, add a needsMorePhotos item
- Do not guess measurements. If unknown, leave measurements empty
- Output must match the JSON schema`;

  const client = getOpenAIClient();
  if (!client) {
    // Throw error instead of returning fake data - this ensures proper error handling upstream
    throw new Error("GPT_NO_API_KEY: OPENAI_API_KEY environment variable is not configured");
  }

  const startTime = Date.now();
  
  try {
    console.log("vision.gpt.request", {
      imageUrl: params.imageUrl.substring(0, 80) + "...",
      model,
      kind: params.kind,
      rekognitionLabelsCount: params.rekognitionLabels.length,
    });

    // Fetch and convert image to base64 - this ensures OpenAI can access it
    // even if the S3 bucket is not publicly accessible
    const imageDataUrl = await fetchImageAsBase64(params.imageUrl);
    
    const user = {
      role: "user" as const,
      content: [
        {
          type: "text" as const,
          text: `Photo kind hint: ${params.kind}\nRekognition labels (hints): ${params.rekognitionLabels.join(", ")}`,
        },
        {
          type: "image_url" as const,
          image_url: { url: imageDataUrl },
        },
      ],
    };

    const resp = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: system },
        user,
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "photo_findings_v1",
          schema,
          strict: true,
        },
      },
      temperature: 0.2,
      max_tokens: 2000,
    });

    const text = resp.choices[0]?.message?.content;
    if (!text) {
      console.error("vision.gpt.emptyResponse", { 
        finishReason: resp.choices[0]?.finish_reason,
        model,
      });
      throw new Error("GPT_EMPTY_RESPONSE: OpenAI returned no content");
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (parseErr) {
      console.error("vision.gpt.parseError", { 
        text: text.substring(0, 200),
        error: parseErr instanceof Error ? parseErr.message : String(parseErr),
      });
      throw new Error("GPT_PARSE_ERROR: Failed to parse OpenAI response as JSON");
    }

    console.log("vision.gpt.success", {
      model,
      durationMs: Date.now() - startTime,
      confidence: parsed.confidence,
      damageCount: parsed.damage?.length ?? 0,
      issuesCount: parsed.issues?.length ?? 0,
      objectsCount: parsed.objects?.length ?? 0,
    });

    // Validate shape lightly by embedding into expected container schema fields.
    // (We validate the full photoFindings object later.)
    return {
      provider: "openai" as const,
      model,
      ...parsed,
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    
    // Handle specific OpenAI errors
    if (error instanceof OpenAI.APIError) {
      console.error("vision.gpt.apiError", {
        status: error.status,
        code: error.code,
        message: error.message,
        durationMs,
      });
      
      if (error.status === 401) {
        throw new Error("GPT_AUTH_ERROR: Invalid OpenAI API key");
      }
      if (error.status === 429) {
        throw new Error("GPT_RATE_LIMITED: OpenAI rate limit exceeded, please retry");
      }
      if (error.status === 400 && error.message?.includes("image")) {
        throw new Error("GPT_IMAGE_ERROR: OpenAI could not process the image - ensure it's a valid JPEG/PNG");
      }
    }
    
    // Re-throw with context
    const msg = error instanceof Error ? error.message : String(error);
    console.error("vision.gpt.failed", { error: msg, durationMs });
    throw error;
  }
}

export function validateFindings(findings: unknown) {
  return photoFindingsSchema.parse(findings);
}
