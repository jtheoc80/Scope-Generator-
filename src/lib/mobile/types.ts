import { z } from "zod";

export const createMobileJobRequestSchema = z.object({
  clientName: z.string().min(1),
  address: z.string().min(1),
  tradeId: z.string().min(1),
  tradeName: z.string().min(1).optional(),
  jobTypeId: z.string().min(1),
  jobTypeName: z.string().min(1),
  jobSize: z.number().int().min(1).max(3).optional(),
  jobNotes: z.string().optional(),
});

export type CreateMobileJobRequest = z.infer<typeof createMobileJobRequestSchema>;

export const createMobileJobResponseSchema = z.object({
  jobId: z.number().int(),
});

export type CreateMobileJobResponse = z.infer<typeof createMobileJobResponseSchema>;

export const presignPhotoRequestSchema = z.object({
  contentType: z.string().min(1),
  fileName: z.string().min(1).optional(),
  kind: z.string().min(1).optional(),
});

export type PresignPhotoRequest = z.infer<typeof presignPhotoRequestSchema>;

export const presignPhotoResponseSchema = z.object({
  key: z.string().min(1),
  uploadUrl: z.string().url(),
  publicUrl: z.string().url(),
});

export type PresignPhotoResponse = z.infer<typeof presignPhotoResponseSchema>;

export const registerPhotoRequestSchema = z.object({
  publicUrl: z.string().url(),
  kind: z.string().min(1).optional(),
});

export type RegisterPhotoRequest = z.infer<typeof registerPhotoRequestSchema>;

export const registerPhotoResponseSchema = z.object({
  photoId: z.number().int(),
});

export type RegisterPhotoResponse = z.infer<typeof registerPhotoResponseSchema>;

export type MobileDraftPayload = {
  lineItems: Array<{
    id: string;
    tradeId: string;
    tradeName: string;
    jobTypeId: string;
    jobTypeName: string;
    jobSize: number;
    scope: string[];
    options: Record<string, boolean | string>;
    priceLow: number;
    priceHigh: number;
    estimatedDaysLow?: number;
    estimatedDaysHigh?: number;
    warranty?: string;
    exclusions?: string[];
  }>;
  confidence: number; // 0-100
  questions: string[];
};

export const createDraftResponseSchema = z.object({
  draftId: z.number().int(),
  status: z.enum(["pending", "processing", "ready", "failed"]),
  payload: z.unknown().optional(),
});

export type CreateDraftResponse = z.infer<typeof createDraftResponseSchema>;

export const submitJobResponseSchema = z.object({
  proposalId: z.number().int(),
  webReviewUrl: z.string().url(),
});

export type SubmitJobResponse = z.infer<typeof submitJobResponseSchema>;
