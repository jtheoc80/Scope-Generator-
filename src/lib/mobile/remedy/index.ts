/**
 * Remedy Module - Repair vs Replace Decisioning
 * 
 * This module provides:
 * - Type definitions for remedy options and selections
 * - Heuristic rules for recommending repair vs replace
 * - Scope generation templates per remedy type
 * 
 * ## Usage
 * 
 * 1. After photo analysis, enrich detected issues with remedy info:
 *    ```ts
 *    import { enrichIssuesWithRemedies } from "@/src/lib/mobile/remedy";
 *    const enrichedIssues = enrichIssuesWithRemedies(detectedIssues);
 *    ```
 * 
 * 2. In UI, display remedy options and allow user selection
 * 
 * 3. During scope generation, use selected remedy:
 *    ```ts
 *    import { getRemedyScopeItems, getEffectiveRemedy } from "@/src/lib/mobile/remedy";
 *    const remedy = getEffectiveRemedy(issue);
 *    const scopeItems = getRemedyScopeItems(issue.issueType, remedy, issue.remedies);
 *    ```
 * 
 * ## Adding New Issue Types
 * 
 * See heuristics.ts for instructions on adding support for new issue types
 * like toilets, disposals, angle stops, etc.
 */

export {
  // Types
  type RemedyType,
  type RemedyOption,
  type Remedy,
  type DetectedIssueWithRemedy,
  type RemedyScopeContext,
  type KnownIssueType,
  
  // Schemas
  remedyOptionSchema,
  remedySchema,
  detectedIssueWithRemedySchema,
  
  // Constants
  ISSUE_TYPES_WITH_REMEDY,
  
  // Helpers
  getEffectiveRemedy,
  hasRemedyOptions,
  getRemedyLabel,
} from "./types";

export {
  // Heuristics
  detectIssueType,
  extractConditionTags,
  applyRemedyHeuristics,
  getRemedyScopeItems,
  enrichIssuesWithRemedies,
} from "./heuristics";
