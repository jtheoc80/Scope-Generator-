import OpenAI from "openai";
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

  const user = {
    role: "user" as const,
    content: [
      {
        type: "text" as const,
        text: `Photo kind hint: ${params.kind}\nRekognition labels (hints): ${params.rekognitionLabels.join(", ")}`,
      },
      {
        type: "image_url" as const,
        image_url: { url: params.imageUrl },
      },
    ],
  };

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
