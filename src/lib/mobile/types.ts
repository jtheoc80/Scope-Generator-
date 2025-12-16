import { z } from "zod";

// Accept the simplified mobile contract:
// body: { jobType, customer?, address? }
// - jobType can be a template numeric ID OR a jobTypeId string.
export const createMobileJobRequestSchema = z.object({
  jobType: z.union([z.number().int(), z.string().min(1)]),
  customer: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
});

export type CreateMobileJobRequest = z.infer<typeof createMobileJobRequestSchema>;

export const createMobileJobResponseSchema = z.object({
  jobId: z.number().int(),
});

export type CreateMobileJobResponse = z.infer<typeof createMobileJobResponseSchema>;

export const presignPhotoRequestSchema = z.object({
  contentType: z.string().min(1),
  filename: z.string().min(1).optional(),
});

export type PresignPhotoRequest = z.infer<typeof presignPhotoRequestSchema>;

export const presignPhotoResponseSchema = z.object({
  key: z.string().min(1),
  uploadUrl: z.string().url(),
  publicUrl: z.string().url(),
});

export type PresignPhotoResponse = z.infer<typeof presignPhotoResponseSchema>;

export const registerPhotoRequestSchema = z.object({
  url: z.string().url(),
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

export const draftStatusSchema = z.enum(["DRAFTING", "READY", "FAILED"]);
export type DraftStatus = z.infer<typeof draftStatusSchema>;

export const triggerDraftResponseSchema = z.object({
  status: draftStatusSchema,
});

export type TriggerDraftResponse = z.infer<typeof triggerDraftResponseSchema>;

export const getDraftResponseSchema = z.object({
  status: draftStatusSchema,
  payload: z.unknown().optional(),
});

export type GetDraftResponse = z.infer<typeof getDraftResponseSchema>;

export const submitJobResponseSchema = z.object({
  proposalId: z.number().int(),
  webReviewUrl: z.string().url(),
});

export type SubmitJobResponse = z.infer<typeof submitJobResponseSchema>;
