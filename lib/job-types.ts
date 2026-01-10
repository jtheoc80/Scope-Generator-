/**
 * Canonical job type definitions - shared source of truth
 * 
 * This module defines all valid job types for the ScopeScan system.
 * Both client UI and server validation should reference this list
 * to prevent drift between what the UI shows and what the backend accepts.
 */

export type JobTypeCategory = "interior" | "exterior" | "systems" | "general";

export interface JobTypeDefinition {
  id: string;
  label: string;
  icon: string;
  category: JobTypeCategory;
}

/**
 * Complete list of active job types.
 * Order matters for UI display - primary types first.
 * 
 * IMPORTANT: When adding/removing job types here, also update:
 * - lib/services/template-seeder.ts (backend templates)
 */
export const JOB_TYPE_DEFINITIONS: readonly JobTypeDefinition[] = [
  // Interior
  { id: "bathroom-remodel", label: "Bathroom", icon: "🛁", category: "interior" },
  { id: "kitchen-remodel", label: "Kitchen", icon: "🍳", category: "interior" },
  { id: "flooring", label: "Flooring", icon: "🪵", category: "interior" },
  { id: "painting", label: "Painting", icon: "🎨", category: "interior" },
  
  // Exterior
  { id: "roofing", label: "Roofing", icon: "🏠", category: "exterior" },
  { id: "windows", label: "Windows", icon: "🪟", category: "exterior" },
  { id: "siding", label: "Siding", icon: "🧱", category: "exterior" },
  { id: "doors", label: "Doors", icon: "🚪", category: "exterior" },
  { id: "fence", label: "Fence", icon: "🚧", category: "exterior" },
  { id: "driveway", label: "Driveway", icon: "🚗", category: "exterior" },
  
  // Systems
  { id: "hvac", label: "HVAC", icon: "❄️", category: "systems" },
  { id: "plumbing", label: "Plumbing", icon: "🔧", category: "systems" },
  { id: "electrical", label: "Electrical", icon: "⚡", category: "systems" },
  
  // Bathroom sub-types
  { id: "shower-replacement", label: "Shower Replacement", icon: "🚿", category: "interior" },
  { id: "tub-to-shower", label: "Tub to Shower", icon: "🚿", category: "interior" },
  { id: "shower-remodel", label: "Shower Remodel", icon: "🚿", category: "interior" },
  { id: "walk-in-tub", label: "Walk-In Tub", icon: "🛁", category: "interior" },
  
  // Kitchen sub-types
  { id: "cabinet-refacing", label: "Cabinet Refacing", icon: "🍳", category: "interior" },
  { id: "countertop-replacement", label: "Countertop Replacement", icon: "🍳", category: "interior" },
  
  // General
  { id: "demo", label: "General Estimate", icon: "📋", category: "general" },
] as const;

/**
 * Set of all valid job type IDs for O(1) lookup.
 */
export const VALID_JOB_TYPE_IDS = new Set(
  JOB_TYPE_DEFINITIONS.map(t => t.id)
);

/**
 * Check if a job type ID is valid (exists in the system).
 * Use this to guard against invalid persisted or URL-provided job types.
 */
export function isValidJobTypeId(jobTypeId: string): boolean {
  return VALID_JOB_TYPE_IDS.has(jobTypeId);
}

/**
 * Get job type definition by ID.
 * Returns undefined if the job type doesn't exist.
 */
export function getJobTypeById(id: string): JobTypeDefinition | undefined {
  return JOB_TYPE_DEFINITIONS.find(t => t.id === id);
}

/**
 * Get display label for a job type ID.
 * Returns the ID itself if not found (graceful degradation).
 */
export function getJobTypeLabel(id: string): string {
  return getJobTypeById(id)?.label ?? id;
}

/**
 * Get icon emoji for a job type ID.
 */
export function getJobTypeIcon(id: string): string {
  return getJobTypeById(id)?.icon ?? "📋";
}

/**
 * Trades that require the map measurement step (fence lines, driveway area).
 */
export const MEASUREMENT_TRADE_IDS = ["fence", "driveway"] as const;
export type MeasurementTradeId = typeof MEASUREMENT_TRADE_IDS[number];

export function isMeasurementTrade(jobTypeId: string): jobTypeId is MeasurementTradeId {
  return MEASUREMENT_TRADE_IDS.includes(jobTypeId as MeasurementTradeId);
}

/**
 * Primary job types shown on initial load (most common).
 * These appear as tiles on the create page.
 */
export const PRIMARY_JOB_TYPE_IDS = [
  "bathroom-remodel",
  "kitchen-remodel", 
  "roofing",
  "hvac",
  "plumbing",
  "fence",
  "driveway",
] as const;

/**
 * Get primary job type definitions for UI display.
 */
export function getPrimaryJobTypes(): JobTypeDefinition[] {
  return PRIMARY_JOB_TYPE_IDS
    .map(id => getJobTypeById(id))
    .filter((t): t is JobTypeDefinition => t !== undefined);
}

/**
 * Get all job type definitions for UI display.
 */
export function getAllJobTypes(): readonly JobTypeDefinition[] {
  return JOB_TYPE_DEFINITIONS;
}

/**
 * Normalize a job type ID to its canonical form.
 * Handles case variations. Returns undefined if not a valid job type.
 */
export function normalizeJobTypeId(input: string): string | undefined {
  const lower = input.toLowerCase().trim();
  // Direct match
  if (VALID_JOB_TYPE_IDS.has(lower)) {
    return lower;
  }
  // Try to find by label (case-insensitive)
  const byLabel = JOB_TYPE_DEFINITIONS.find(
    t => t.label.toLowerCase() === lower
  );
  return byLabel?.id;
}

/**
 * Validate and return a job type ID, or return the default if invalid.
 * Use this to safely process job types from URL params or localStorage.
 */
export function validateJobTypeIdOrDefault(
  input: string | null | undefined,
  defaultId: string = "bathroom-remodel"
): string {
  if (!input) return defaultId;
  return isValidJobTypeId(input) ? input : defaultId;
}
