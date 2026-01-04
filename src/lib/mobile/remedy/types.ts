/**
 * Remedy Types for Repair vs Replace Decisioning
 * 
 * This module defines the data structures for per-issue remedy recommendations
 * and selections. The system supports:
 * - AI/heuristic-based remedy recommendations
 * - User override of recommendations
 * - Scope generation based on selected remedy
 * 
 * To add support for new issue types (toilets, disposals, angle stops, etc.):
 * 1. Add the issue type to REMEDY_HEURISTICS in ./heuristics.ts
 * 2. Define REPAIR_SCOPE and REPLACE_SCOPE templates for that type
 * 3. Add condition matchers for when to recommend each remedy
 */

import { z } from "zod";

/**
 * Remedy type - the action to take for an issue
 */
export type RemedyType = "repair" | "replace" | "either";

/**
 * Remedy option with availability and context
 */
export const remedyOptionSchema = z.object({
  available: z.boolean(),
  notes: z.string().optional(),
  estimatedCost: z.object({
    low: z.number(),
    high: z.number(),
  }).optional(),
  scopeItems: z.array(z.string()).optional(),
});

export type RemedyOption = z.infer<typeof remedyOptionSchema>;

/**
 * Full remedy structure for a detected issue
 */
export const remedySchema = z.object({
  // Available options
  repair: remedyOptionSchema.optional(),
  replace: remedyOptionSchema.optional(),
  
  // AI/heuristic recommendation
  recommended: z.enum(["repair", "replace", "either"]),
  
  // Rationale for the recommendation (displayed to user)
  rationale: z.array(z.string()),
  
  // User's selection (defaults to recommended)
  selectedRemedy: z.enum(["repair", "replace", "either"]).optional(),
  
  // Confidence in the recommendation (0-1)
  confidence: z.number().min(0).max(1).optional(),
});

export type Remedy = z.infer<typeof remedySchema>;

/**
 * Extended DetectedIssue with remedy information
 */
export const detectedIssueWithRemedySchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
  confidence: z.number().min(0).max(1),
  category: z.enum(["damage", "repair", "maintenance", "upgrade", "inspection", "other"]),
  photoIds: z.array(z.number()),
  
  // Issue type identifier for remedy heuristics (e.g., "leaking_faucet", "running_toilet")
  issueType: z.string().optional(),
  
  // Tags/signals detected from photos (e.g., "corrosion", "mineral_buildup", "aged")
  tags: z.array(z.string()).optional(),
  
  // Remedy information
  remedies: remedySchema.optional(),
});

export type DetectedIssueWithRemedy = z.infer<typeof detectedIssueWithRemedySchema>;

/**
 * Scope generation context for a remedy
 */
export interface RemedyScopeContext {
  issueType: string;
  selectedRemedy: RemedyType;
  tags: string[];
  notes?: string;
}

/**
 * Helper to get effective remedy (user selection or recommended)
 */
export function getEffectiveRemedy(issue: DetectedIssueWithRemedy): RemedyType {
  if (!issue.remedies) return "repair";
  return issue.remedies.selectedRemedy ?? issue.remedies.recommended;
}

/**
 * Helper to check if issue supports remedy selection
 */
export function hasRemedyOptions(issue: DetectedIssueWithRemedy): boolean {
  if (!issue.remedies) return false;
  const { repair, replace } = issue.remedies;
  return (repair?.available ?? false) || (replace?.available ?? false);
}

/**
 * Helper to get display text for remedy type
 */
export function getRemedyLabel(remedy: RemedyType): string {
  switch (remedy) {
    case "repair":
      return "Repair";
    case "replace":
      return "Replace";
    case "either":
      return "Either";
    default:
      return "Unknown";
  }
}

/**
 * Known issue types with remedy support
 * Add new types here as they are implemented
 */
export const ISSUE_TYPES_WITH_REMEDY = [
  "leaking_faucet",
  // Future: "running_toilet", "clogged_drain", "broken_disposal", "leaking_angle_stop"
] as const;

export type KnownIssueType = typeof ISSUE_TYPES_WITH_REMEDY[number];
