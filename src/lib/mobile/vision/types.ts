import { z } from "zod";

export const rekognitionLabelSchema = z.object({
  name: z.string(),
  confidence: z.number().min(0).max(100),
});

export const rekognitionResultSchema = z.object({
  provider: z.literal("aws"),
  service: z.literal("rekognition"),
  model: z.string().optional(),
  labels: z.array(rekognitionLabelSchema),
});

// Scope option suggested by vision analysis
// Note: nullable() used to match OpenAI JSON schema which sends null for optional fields
export const suggestedScopeOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().nullable(), // OpenAI sends null, not undefined
});

export const gptVisionResultSchema = z.object({
  provider: z.literal("openai"),
  model: z.string(),
  schemaVersion: z.literal("v1"),
  confidence: z.number().min(0).max(1),
  kindGuess: z.string().nullable(), // OpenAI sends null, not undefined
  labels: z.array(z.string()).default([]),
  objects: z.array(z.object({
    name: z.string(),
    notes: z.string().nullable(), // OpenAI sends null, not undefined
  })).default([]),
  materials: z.array(z.string()).default([]),
  damage: z.array(z.string()).default([]),
  issues: z.array(z.string()).default([]),
  measurements: z.array(z.string()).default([]),
  needsMorePhotos: z.array(z.string()).default([]),
  // Scope clarification fields
  needsClarification: z.boolean().default(false),
  scopeAmbiguous: z.boolean().default(false),
  clarificationReasons: z.array(z.string()).default([]),
  suggestedScopeOptions: z.array(suggestedScopeOptionSchema).default([]),
  detectedTrade: z.string().nullable(), // OpenAI sends null, not undefined
  isPaintingRelated: z.boolean().default(false),
  estimatedSeverity: z.enum(["spot", "partial", "full"]).nullable(), // OpenAI sends null, not undefined
});

export const photoFindingsSchema = z.object({
  version: z.literal("v1"),
  imageUrl: z.string().url(),
  kind: z.string(),
  detector: z.object({
    status: z.enum(["pending", "ready", "failed"]),
    result: rekognitionResultSchema.optional(),
    error: z.string().optional(),
  }),
  llm: z.object({
    status: z.enum(["pending", "ready", "failed"]),
    result: gptVisionResultSchema.optional(),
    error: z.string().optional(),
  }),
  combined: z.object({
    confidence: z.number().min(0).max(1),
    summaryLabels: z.array(z.string()).default([]),
    needsMorePhotos: z.array(z.string()).default([]),
    // Scope clarification aggregates
    needsClarification: z.boolean().default(false),
    scopeAmbiguous: z.boolean().default(false),
    clarificationReasons: z.array(z.string()).default([]),
    detectedTrade: z.string().optional(),
    isPaintingRelated: z.boolean().default(false),
    estimatedSeverity: z.enum(["spot", "partial", "full"]).optional(),
  }),
});

export type PhotoFindings = z.infer<typeof photoFindingsSchema>;
export type SuggestedScopeOption = z.infer<typeof suggestedScopeOptionSchema>;
