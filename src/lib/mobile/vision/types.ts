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

export const gptVisionResultSchema = z.object({
  provider: z.literal("openai"),
  model: z.string(),
  schemaVersion: z.literal("v1"),
  confidence: z.number().min(0).max(1),
  kindGuess: z.string().optional(),
  labels: z.array(z.string()).default([]),
  objects: z.array(z.object({
    name: z.string(),
    notes: z.string().optional(),
  })).default([]),
  materials: z.array(z.string()).default([]),
  damage: z.array(z.string()).default([]),
  measurements: z.array(z.string()).default([]),
  needsMorePhotos: z.array(z.string()).default([]),
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
  }),
});

export type PhotoFindings = z.infer<typeof photoFindingsSchema>;
