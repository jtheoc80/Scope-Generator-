/**
 * Remedy Heuristics for Repair vs Replace Decisioning
 * 
 * This module implements rule-based heuristics for recommending repair vs replace
 * for detected issues. The heuristics run after photo analysis and before
 * scope generation.
 * 
 * ## Adding New Issue Types
 * 
 * To add remedy support for a new issue type (e.g., toilets, disposals, angle stops):
 * 
 * 1. Define a new heuristic function (e.g., `applyToiletRemedyHeuristics`)
 * 2. Add scope templates in REMEDY_SCOPE_TEMPLATES
 * 3. Register the heuristic in `applyRemedyHeuristics`
 * 4. Add matching logic in `detectIssueType` to identify the issue type from labels
 * 
 * ## Heuristic Rules
 * 
 * Rules are evaluated in order. Each rule can:
 * - Set the recommended remedy
 * - Add rationale points
 * - Adjust confidence
 * 
 * The first matching rule determines the recommendation.
 */

import type { DetectedIssueWithRemedy, Remedy, RemedyType } from "./types";

/**
 * Signals/tags that indicate replacement is recommended
 */
const REPLACEMENT_SIGNALS = [
  "corrosion",
  "corroded",
  "rust",
  "rusty",
  "mineral_buildup",
  "mineral buildup",
  "calcium buildup",
  "stained",
  "aged",
  "old",
  "outdated",
  "dated",
  "worn",
  "heavily worn",
  "pitting",
  "discolored",
  "deteriorated",
  "cracked",
  "broken handle",
  "stripped",
  "cross-threaded",
];

/**
 * Signals that indicate repair is likely sufficient
 */
const REPAIR_SIGNALS = [
  "dripping",
  "slow drip",
  "minor leak",
  "handle loose",
  "cartridge",
  "washer",
  "o-ring",
  "valve seat",
  "aerator",
];

/**
 * Detect issue type from label and description
 */
export function detectIssueType(label: string, description?: string): string | undefined {
  const text = `${label} ${description || ""}`.toLowerCase();
  
  // Faucet issues
  if (
    text.includes("faucet") ||
    text.includes("tap") ||
    (text.includes("leak") && (text.includes("sink") || text.includes("basin")))
  ) {
    if (text.includes("leak") || text.includes("drip")) {
      return "leaking_faucet";
    }
    return "faucet_issue";
  }
  
  // Future: Add more issue type detection
  // if (text.includes("toilet") && (text.includes("running") || text.includes("leak"))) {
  //   return "running_toilet";
  // }
  // if (text.includes("disposal") || text.includes("garbage disposal")) {
  //   return "broken_disposal";
  // }
  // if (text.includes("angle stop") || text.includes("shutoff") || text.includes("shut-off")) {
  //   return "leaking_angle_stop";
  // }
  
  return undefined;
}

/**
 * Extract condition tags from findings text
 */
export function extractConditionTags(label: string, description?: string, notes?: string): string[] {
  const text = `${label} ${description || ""} ${notes || ""}`.toLowerCase();
  const tags: string[] = [];
  
  // Check for replacement signals
  for (const signal of REPLACEMENT_SIGNALS) {
    if (text.includes(signal.toLowerCase())) {
      tags.push(signal.replace(/\s+/g, "_"));
    }
  }
  
  // Check for repair signals
  for (const signal of REPAIR_SIGNALS) {
    if (text.includes(signal.toLowerCase())) {
      tags.push(signal.replace(/\s+/g, "_"));
    }
  }
  
  // Age indicators
  if (text.includes("unknown age") || text.includes("age unknown")) {
    tags.push("unknown_age");
  }
  if (/\b(10|15|20|25|30)\+?\s*(year|yr)/i.test(text)) {
    tags.push("aged");
  }
  
  return [...new Set(tags)];
}

/**
 * Apply faucet-specific remedy heuristics
 */
function applyFaucetRemedyHeuristics(
  tags: string[],
  label: string,
  description?: string
): Remedy {
  const rationale: string[] = [];
  let recommended: RemedyType = "repair";
  let confidence = 0.7;
  
  const tagsLower = tags.map(t => t.toLowerCase());
  const hasCorrosion = tagsLower.some(t => 
    t.includes("corrosion") || t.includes("corroded") || t.includes("rust")
  );
  const hasMineralBuildup = tagsLower.some(t => 
    t.includes("mineral") || t.includes("calcium") || t.includes("buildup")
  );
  const hasStaining = tagsLower.some(t => 
    t.includes("stain") || t.includes("discolor")
  );
  const isAged = tagsLower.some(t => 
    t.includes("aged") || t.includes("old") || t.includes("dated") || t.includes("outdated") || t.includes("worn")
  );
  const hasUnknownAge = tagsLower.some(t => t.includes("unknown_age"));
  const hasCracking = tagsLower.some(t => 
    t.includes("crack") || t.includes("broken")
  );
  const hasPitting = tagsLower.some(t => t.includes("pitting"));
  
  // Check text for additional signals
  const text = `${label} ${description || ""}`.toLowerCase();
  const mentionsCartrIdge = text.includes("cartridge") || text.includes("washer") || text.includes("o-ring");
  
  // Rule 1: Corrosion/mineral buildup -> Replace
  if (hasCorrosion || hasMineralBuildup) {
    recommended = "replace";
    confidence = 0.85;
    if (hasCorrosion) {
      rationale.push("Visible corrosion indicates internal valve damage that cannot be reliably repaired.");
    }
    if (hasMineralBuildup) {
      rationale.push("Mineral buildup often extends into valve body, making cartridge replacement ineffective.");
    }
  }
  // Rule 2: Stained/aged fixture -> Replace (unless clearly just needs cartridge)
  else if ((hasStaining || isAged) && !mentionsCartrIdge) {
    recommended = "replace";
    confidence = 0.75;
    if (hasStaining) {
      rationale.push("Stained/discolored fixture suggests age and potential internal wear.");
    }
    if (isAged) {
      rationale.push("Older fixture likely has worn internal components beyond just the cartridge.");
    }
  }
  // Rule 3: Unknown age -> Recommend replace (conservative)
  else if (hasUnknownAge) {
    recommended = "replace";
    confidence = 0.65;
    rationale.push("Age unknown - replacement recommended to ensure reliability.");
  }
  // Rule 4: Cracking/pitting -> Replace
  else if (hasCracking || hasPitting) {
    recommended = "replace";
    confidence = 0.9;
    if (hasCracking) {
      rationale.push("Cracked faucet body cannot be repaired safely.");
    }
    if (hasPitting) {
      rationale.push("Pitting indicates advanced corrosion - replacement needed.");
    }
  }
  // Rule 5: Simple drip with no other signals -> Repair
  else {
    recommended = "repair";
    confidence = 0.8;
    rationale.push("Standard drip likely resolved by cartridge/washer replacement.");
    if (mentionsCartrIdge) {
      rationale.push("Cartridge-style faucet can typically be serviced without full replacement.");
      confidence = 0.85;
    }
  }
  
  return {
    repair: {
      available: true,
      notes: "Replace cartridge/washer, adjust, test, check shutoffs",
      scopeItems: [
        "Turn off water supply at angle stops or main shutoff.",
        "Disassemble faucet handle and access cartridge/stem.",
        "Replace cartridge, washer, and/or O-rings as needed.",
        "Reassemble faucet and restore water supply.",
        "Test for leaks and proper operation.",
        "Check angle stop valves for function.",
        "Clean up work area.",
      ],
    },
    replace: {
      available: true,
      notes: "Remove existing faucet, install new faucet (customer supplied or allowance)",
      scopeItems: [
        "Turn off water supply and disconnect supply lines.",
        "Remove existing faucet and clean mounting surface.",
        "Install new faucet (customer supplied or per allowance).",
        "Replace supply lines with new braided stainless connectors.",
        "Apply silicone sealant as needed at deck plate.",
        "Test for leaks at all connections.",
        "Dispose of old faucet and materials.",
        "Clean up work area.",
      ],
    },
    recommended,
    rationale,
    confidence,
  };
}

/**
 * Scope templates for "either" remedy (attempt repair, replace if needed)
 */
function getEitherRemedyScope(issueType: string): string[] {
  if (issueType === "leaking_faucet" || issueType === "faucet_issue") {
    return [
      "Diagnose faucet leak and attempt repair (cartridge/washer replacement).",
      "If faucet is not serviceable due to corrosion or parts unavailability, replace faucet with homeowner approval.",
      "Faucet replacement allowance: $_____ (if repair not viable).",
      "Replace supply lines if showing wear.",
      "Test for leaks and proper operation.",
      "Clean up work area.",
    ];
  }
  
  // Default generic "either" scope
  return [
    "Diagnose issue and attempt repair.",
    "If repair not viable, provide replacement quote for homeowner approval.",
    "Test and verify repair.",
    "Clean up work area.",
  ];
}

/**
 * Apply remedy heuristics to a detected issue
 */
export function applyRemedyHeuristics(issue: {
  id: string;
  label: string;
  description?: string;
  confidence: number;
  category: string;
  photoIds: number[];
  issueType?: string;
  tags?: string[];
}): DetectedIssueWithRemedy {
  // Detect issue type if not provided
  const issueType = issue.issueType ?? detectIssueType(issue.label, issue.description);
  
  // Extract tags if not provided
  const tags = issue.tags ?? extractConditionTags(issue.label, issue.description);
  
  // Apply type-specific heuristics
  let remedies: Remedy | undefined;
  
  if (issueType === "leaking_faucet" || issueType === "faucet_issue") {
    remedies = applyFaucetRemedyHeuristics(tags, issue.label, issue.description);
  }
  // Future: Add more issue type handlers
  // else if (issueType === "running_toilet") {
  //   remedies = applyToiletRemedyHeuristics(tags, issue.label, issue.description);
  // }
  
  return {
    ...issue,
    category: issue.category as DetectedIssueWithRemedy["category"],
    issueType,
    tags,
    remedies,
  };
}

/**
 * Get scope items for a remedy selection
 */
export function getRemedyScopeItems(
  issueType: string | undefined,
  selectedRemedy: RemedyType,
  remedies?: Remedy
): string[] {
  // If we have remedy-specific scope items, use those
  if (remedies) {
    if (selectedRemedy === "repair" && remedies.repair?.scopeItems) {
      return remedies.repair.scopeItems;
    }
    if (selectedRemedy === "replace" && remedies.replace?.scopeItems) {
      return remedies.replace.scopeItems;
    }
  }
  
  // For "either", use the conditional scope
  if (selectedRemedy === "either" && issueType) {
    return getEitherRemedyScope(issueType);
  }
  
  // Default fallback
  return [];
}

/**
 * Post-process detected issues to add remedy information
 */
export function enrichIssuesWithRemedies(
  issues: Array<{
    id: string;
    label: string;
    description?: string;
    confidence: number;
    category: string;
    photoIds: number[];
  }>
): DetectedIssueWithRemedy[] {
  return issues.map(issue => applyRemedyHeuristics(issue));
}
