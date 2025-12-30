import { z } from "zod";

/**
 * Schema for validating URL query params from the calculator estimate handoff.
 * These params prefill the create page with context from the price estimate.
 */

// Valid trade IDs from the calculator
export const VALID_TRADES = [
  "bathroom",
  "kitchen",
  "roofing",
  "painting",
  "electrical",
  "plumbing",
  "hvac",
  "landscaping",
  "flooring",
  "siding",
  "drywall",
  "windows",
  "deck",
  "fence",
  "concrete",
  "tile",
  "cabinets",
] as const;

// Valid size options
export const VALID_SIZES = ["small", "medium", "large", "custom"] as const;

// Map calculator trade IDs to create page job type IDs
export const TRADE_TO_JOB_TYPE: Record<string, string> = {
  bathroom: "bathroom-remodel",
  kitchen: "kitchen-remodel",
  roofing: "roofing",
  painting: "painting",
  electrical: "electrical",
  plumbing: "plumbing",
  hvac: "hvac",
  landscaping: "landscaping",
  flooring: "flooring",
  siding: "siding",
  drywall: "drywall",
  windows: "windows",
  deck: "deck",
  fence: "fence",
  concrete: "concrete",
  tile: "tile",
  cabinets: "cabinets",
};

// Zod schema for estimate query params
export const estimateParamsSchema = z.object({
  trade: z.enum(VALID_TRADES).optional(),
  jobType: z.string().optional(), // Job type ID from calculator (e.g., "tub-to-shower")
  size: z.enum(VALID_SIZES).optional(),
  zip: z.string().regex(/^\d{5}$/, "ZIP must be 5 digits").optional(),
  sqft: z.coerce.number().positive().optional(), // Custom square footage
  addons: z.string().optional(), // Comma-separated addon IDs (for future use)
});

export type EstimateParams = z.infer<typeof estimateParamsSchema>;

/**
 * Parse and validate estimate params from URL search params.
 * Returns validated params or null if validation fails.
 * Accepts both URLSearchParams and ReadonlyURLSearchParams (from Next.js useSearchParams).
 */
export function parseEstimateParams(
  searchParams: URLSearchParams | { get: (key: string) => string | null }
): EstimateParams | null {
  try {
    const rawParams: Record<string, string> = {};
    
    // Extract relevant params
    const paramKeys = ["trade", "jobType", "size", "zip", "sqft", "addons"];
    for (const key of paramKeys) {
      const value = searchParams.get(key);
      if (value) {
        rawParams[key] = value;
      }
    }

    // If no relevant params, return null
    if (Object.keys(rawParams).length === 0) {
      return null;
    }

    // Validate with zod
    const result = estimateParamsSchema.safeParse(rawParams);
    if (!result.success) {
      console.warn("Invalid estimate params:", result.error.flatten());
      return null;
    }

    return result.data;
  } catch (error) {
    console.error("Error parsing estimate params:", error);
    return null;
  }
}

/**
 * Convert estimate params to create page job type ID.
 */
export function getJobTypeFromEstimate(params: EstimateParams): string | null {
  if (params.trade) {
    return TRADE_TO_JOB_TYPE[params.trade] || null;
  }
  return null;
}

/**
 * Build URL search params from estimate state.
 * Used by calculator to create handoff URL.
 */
export function buildEstimateParams(state: {
  trade?: string;
  jobType?: string;
  size?: string;
  zip?: string;
  sqft?: number;
  addons?: string[];
}): URLSearchParams {
  const params = new URLSearchParams();

  if (state.trade) params.set("trade", state.trade);
  if (state.jobType) params.set("jobType", state.jobType);
  if (state.size) params.set("size", state.size);
  if (state.zip) params.set("zip", state.zip);
  if (state.sqft) params.set("sqft", String(state.sqft));
  if (state.addons?.length) params.set("addons", state.addons.join(","));

  return params;
}
