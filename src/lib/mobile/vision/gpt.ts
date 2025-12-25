import OpenAI from "openai";
import { photoFindingsSchema } from "./types";

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
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
    // Hard fallback for environments without credentials.
    return {
      provider: "openai" as const,
      model: model,
      schemaVersion: "v1" as const,
      confidence: 0.4,
      kindGuess: params.kind,
      labels: params.rekognitionLabels.slice(0, 5),
      objects: [],
      materials: [],
      damage: [],
      issues: [],
      measurements: [],
      needsMorePhotos: ["Take a close-up of the main problem area."],
    };
  }

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
  });

  const text = resp.choices[0]?.message?.content;
  if (!text) throw new Error("GPT_EMPTY_RESPONSE");

  const parsed = JSON.parse(text);

  // Validate shape lightly by embedding into expected container schema fields.
  // (We validate the full photoFindings object later.)
  return {
    provider: "openai" as const,
    model,
    ...parsed,
  };
}

export function validateFindings(findings: unknown) {
  return photoFindingsSchema.parse(findings);
}
