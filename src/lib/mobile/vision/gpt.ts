import OpenAI from "openai";
import { photoFindingsSchema } from "./types";
import { parseS3Url, fetchS3ObjectBytes, type S3ObjectRef } from "../storage/s3";

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

/**
 * Detect image MIME type from bytes.
 * Returns the MIME type or null if unknown.
 */
function detectImageMimeType(bytes: Uint8Array): string | null {
  if (bytes.length < 8) return null;
  
  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return "image/jpeg";
  }
  
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4E &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  
  // GIF: 47 49 46 38
  if (
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38
  ) {
    return "image/gif";
  }
  
  // WebP: RIFF....WEBP
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  
  return null;
}

/**
 * Convert bytes to a base64 data URL.
 * Uses the detected MIME type or falls back to image/jpeg.
 */
function bytesToDataUrl(bytes: Uint8Array): string {
  const mimeType = detectImageMimeType(bytes) || "image/jpeg";
  const base64 = Buffer.from(bytes).toString("base64");
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Fetch image bytes from S3 or URL and convert to base64 data URL.
 * This avoids S3 redirect issues by fetching directly from S3 when possible.
 */
async function fetchImageAsDataUrl(imageUrl: string, s3Ref: S3ObjectRef | null): Promise<string> {
  let bytes: Uint8Array;
  
  if (s3Ref) {
    // Fetch directly from S3 (avoids redirect issues)
    console.log("gpt.fetchS3Direct", {
      bucket: s3Ref.bucket,
      key: s3Ref.key.substring(0, 60) + "...",
    });
    bytes = await fetchS3ObjectBytes(s3Ref);
  } else {
    // Fallback: fetch via HTTP
    console.log("gpt.fetchHttp", {
      url: imageUrl.substring(0, 80) + "...",
    });
    const res = await fetch(imageUrl, {
      redirect: "follow",
      headers: { "Accept": "image/*,*/*" },
    });
    if (!res.ok) {
      throw new Error(`GPT_FETCH_ERROR: Failed to fetch image (${res.status})`);
    }
    const buf = await res.arrayBuffer();
    bytes = new Uint8Array(buf);
  }
  
  if (bytes.length === 0) {
    throw new Error("GPT_EMPTY_IMAGE: Image is empty (0 bytes)");
  }
  
  return bytesToDataUrl(bytes);
}

export async function analyzeWithGptVision(params: {
  imageUrl: string;
  s3Ref?: S3ObjectRef | null;
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
      // Scope clarification fields
      needsClarification: { type: "boolean" },
      scopeAmbiguous: { type: "boolean" },
      clarificationReasons: { type: "array", items: { type: "string" } },
      suggestedScopeOptions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            id: { type: "string" },
            label: { type: "string" },
            description: { type: "string" },
          },
          required: ["id", "label"],
        },
      },
      detectedTrade: { type: "string" },
      isPaintingRelated: { type: "boolean" },
      estimatedSeverity: { type: "string" }, // "spot", "partial", "full"
    },
    required: [
      "schemaVersion", "confidence", "labels", "objects", "materials", 
      "damage", "issues", "measurements", "needsMorePhotos",
      "needsClarification", "scopeAmbiguous", "clarificationReasons",
      "suggestedScopeOptions", "detectedTrade", "isPaintingRelated", "estimatedSeverity"
    ],
  } as const;

  const system = `You are a senior field estimator helping contractors create accurate job scopes and quotes.

Your job is to identify ALL actionable issues a contractor should address, including:
- Visible damage (cracks, stains, rot, water damage, etc.)
- Missing components (missing light shades, missing hardware, incomplete fixtures)
- Items in disrepair or poor condition (worn, dated, broken, non-functional)
- Fixtures or elements that need replacement or upgrade (outdated, mismatched, incomplete)
- Safety concerns (exposed wiring, unstable fixtures, hazards)

CRITICAL SCOPE RULES:
- NEVER assume full-room painting unless there is clear evidence across multiple walls/angles
- NEVER assume entire house/building scope from a single area photo
- If you can only see one wall or one area, assume the scope is limited to that area
- For painting issues: default to "spot repair" scope unless photos clearly show full walls/rooms needing paint
- When scope is ambiguous, set needsClarification: true and suggest scope options

Trade Detection:
- Set detectedTrade to the primary trade category: "painting", "plumbing", "electrical", "hvac", "roofing", "flooring", "structural", "general"
- Set isPaintingRelated: true if ANY painting work is detected (peeling, fading, stains that need paint)

Scope Assessment:
- estimatedSeverity should be: "spot" (localized issue), "partial" (one wall/section), or "full" (entire room/system)
- If painting is detected, be VERY conservative - default to "spot" unless obvious otherwise
- Set scopeAmbiguous: true if you cannot determine exact scope from photos alone
- Add reasons to clarificationReasons explaining what information is missing

For scopeAmbiguous situations, provide suggestedScopeOptions with:
- Minimum option (spot/localized repair)
- Mid option (one wall/section)  
- Maximum option (entire room/area)

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
    // Parse S3 reference from URL if not provided
    const s3Ref = params.s3Ref !== undefined ? params.s3Ref : parseS3Url(params.imageUrl);
    
    // IMPORTANT: Fetch image and convert to base64 data URL to avoid S3 redirect issues.
    // When OpenAI tries to fetch S3 URLs directly, it can fail on 301 redirects
    // (e.g., wrong region in URL). By sending base64, we bypass this entirely.
    const imageDataUrl = await fetchImageAsDataUrl(params.imageUrl, s3Ref);
    
    console.log("vision.gpt.request", {
      imageUrl: params.imageUrl.substring(0, 80) + "...",
      usingBase64: true,
      model,
      kind: params.kind,
      rekognitionLabelsCount: params.rekognitionLabels.length,
    });

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
        // Distinguish between quota exceeded (billing issue) and rate limiting (temporary)
        if (error.code === "insufficient_quota") {
          throw new Error("GPT_QUOTA_EXCEEDED: OpenAI API quota exceeded - check billing at https://platform.openai.com/account/billing");
        }
        throw new Error("GPT_RATE_LIMITED: OpenAI rate limit exceeded, please retry later");
      }
      if (error.status === 400 && error.message?.includes("image")) {
        throw new Error("GPT_IMAGE_ERROR: OpenAI could not process the image - ensure it's a valid JPEG/PNG");
      }
      if (error.status === 500 || error.status === 502 || error.status === 503) {
        throw new Error(`GPT_SERVER_ERROR: OpenAI service temporarily unavailable (${error.status}), please retry`);
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
