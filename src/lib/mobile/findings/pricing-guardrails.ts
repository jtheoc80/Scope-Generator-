/**
 * Pricing Guardrails Module
 * 
 * Implements safeguards to prevent over-scoping and pricing surprises.
 * Key principle: Default to minimum reasonable scope unless user confirms larger scope.
 */

import { type Finding, type ScopeSelection, type ScopeTier } from "./types";

// Painting-specific pricing per square foot
export const PAINTING_PRICE_PER_SQFT = {
  spot_repair: { low: 3, high: 5 }, // $3-5/sq ft for touch-up
  one_wall: { low: 4, high: 6 }, // $4-6/sq ft for single wall
  entire_room: { low: 3, high: 5 }, // $3-5/sq ft volume discount
  entire_house: { low: 2.5, high: 4 }, // $2.5-4/sq ft major volume discount
};

// Default square footage estimates when user doesn't provide
export const DEFAULT_SQFT_ESTIMATES = {
  spot_repair: 20, // 4x5 ft area
  one_wall: 100, // 10x10 ft wall
  small_room: 120, // 10x12 ft room
  medium_room: 180, // 12x15 ft room  
  large_room: 300, // 15x20 ft room
  entire_house: 2000, // Average home interior
};

export interface PricingGuardrailResult {
  approved: boolean;
  requiresConfirmation: boolean;
  reason?: string;
  suggestedPrice?: { low: number; high: number };
  warnings: string[];
  defaultScope?: string;
}

/**
 * Apply pricing guardrails based on scope selection.
 * 
 * Rules:
 * 1. If painting scope not specified, default to "spot repair"
 * 2. If area > threshold and not confirmed, require confirmation
 * 3. Always show range, never single price for ambiguous scope
 */
export function applyPricingGuardrails(
  findings: Finding[],
  scopeSelection?: ScopeSelection,
  isPaintingJob: boolean = false
): PricingGuardrailResult {
  const warnings: string[] = [];
  
  // Check if this is a painting job
  const hasPaintingFindings = findings.some(
    f => f.category === "painting" || 
    f.issue.toLowerCase().includes("paint") ||
    f.issue.toLowerCase().includes("peel")
  );
  
  if (!isPaintingJob && !hasPaintingFindings) {
    // Not a painting job - apply generic guardrails
    return applyGenericGuardrails(findings, scopeSelection);
  }
  
  // Painting job guardrails
  const paintScope = scopeSelection?.answers?.paint_scope as string | undefined;
  const squareFeet = scopeSelection?.measurements?.squareFeet;
  
  // Rule 1: Default to spot repair if no scope specified
  if (!paintScope) {
    warnings.push("Painting scope not confirmed - defaulting to minimum (spot repair)");
    
    const defaultSqFt = DEFAULT_SQFT_ESTIMATES.spot_repair;
    const prices = PAINTING_PRICE_PER_SQFT.spot_repair;
    
    return {
      approved: true,
      requiresConfirmation: true,
      reason: "Painting scope ambiguous - please confirm scope before final pricing",
      suggestedPrice: {
        low: Math.round(defaultSqFt * prices.low),
        high: Math.round(defaultSqFt * prices.high),
      },
      warnings,
      defaultScope: "spot_repair",
    };
  }
  
  // Rule 2: Calculate price based on confirmed scope
  const scopePrices = PAINTING_PRICE_PER_SQFT[paintScope as keyof typeof PAINTING_PRICE_PER_SQFT] 
    || PAINTING_PRICE_PER_SQFT.spot_repair;
  
  let estimatedSqFt = squareFeet;
  
  if (!estimatedSqFt) {
    // Use default estimates based on scope
    switch (paintScope) {
      case "spot_repair":
        estimatedSqFt = DEFAULT_SQFT_ESTIMATES.spot_repair;
        break;
      case "one_wall":
        estimatedSqFt = DEFAULT_SQFT_ESTIMATES.one_wall;
        break;
      case "entire_room":
        estimatedSqFt = DEFAULT_SQFT_ESTIMATES.medium_room;
        warnings.push("Room size not specified - using average estimate");
        break;
      case "entire_house":
        estimatedSqFt = DEFAULT_SQFT_ESTIMATES.entire_house;
        warnings.push("House size not specified - using average estimate");
        break;
      default:
        estimatedSqFt = DEFAULT_SQFT_ESTIMATES.spot_repair;
    }
  }
  
  // Rule 3: Require confirmation for large scopes
  const requiresConfirmation = 
    (paintScope === "entire_room" && !squareFeet) ||
    (paintScope === "entire_house") ||
    (estimatedSqFt > 200 && !squareFeet);
  
  if (requiresConfirmation && !squareFeet) {
    warnings.push(`Large scope (${paintScope.replace("_", " ")}) - please confirm room dimensions`);
  }
  
  // Calculate price range
  const suggestedPrice = {
    low: Math.round(estimatedSqFt * scopePrices.low),
    high: Math.round(estimatedSqFt * scopePrices.high),
  };
  
  // Add labor minimums
  const LABOR_MINIMUM = 150; // Minimum $150 for any painting job
  if (suggestedPrice.low < LABOR_MINIMUM) {
    suggestedPrice.low = LABOR_MINIMUM;
  }
  if (suggestedPrice.high < LABOR_MINIMUM) {
    suggestedPrice.high = LABOR_MINIMUM + 50;
  }
  
  return {
    approved: true,
    requiresConfirmation,
    suggestedPrice,
    warnings,
    defaultScope: paintScope,
  };
}

/**
 * Generic guardrails for non-painting jobs
 */
function applyGenericGuardrails(
  findings: Finding[],
  scopeSelection?: ScopeSelection
): PricingGuardrailResult {
  const warnings: string[] = [];
  
  // Check for scope tier selection
  const selectedTier = scopeSelection?.selectedTierId;
  
  if (!selectedTier) {
    // Default to minimum/recommended tier
    warnings.push("No scope tier selected - using recommended scope");
  }
  
  // Count findings by severity
  const highSeverityCount = findings.filter(f => f.severity === "high").length;
  const totalFindings = findings.length;
  
  // Warn if many findings but minimum tier selected
  if (selectedTier?.includes("minimum") && totalFindings > 3) {
    warnings.push(`${totalFindings} issues identified but minimum scope selected - some issues may not be addressed`);
  }
  
  // Warn if high-severity issues and minimum scope
  if (selectedTier?.includes("minimum") && highSeverityCount > 0) {
    warnings.push(`${highSeverityCount} high-severity issue(s) may require attention beyond minimum scope`);
  }
  
  return {
    approved: true,
    requiresConfirmation: !selectedTier || totalFindings > 5,
    reason: !selectedTier ? "Please confirm scope before final pricing" : undefined,
    warnings,
    defaultScope: selectedTier || "recommended",
  };
}

/**
 * Validate that scope selection matches findings.
 * Warns if selected scope seems too large or too small.
 */
export function validateScopeVsFindings(
  findings: Finding[],
  scopeSelection: ScopeSelection,
  tier: ScopeTier
): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  
  // Check if scope seems too large for findings
  const paintingFindings = findings.filter(f => 
    f.category === "painting" || f.issue.toLowerCase().includes("paint")
  );
  
  const paintScope = scopeSelection.answers?.paint_scope as string;
  
  if (paintScope === "entire_house" && paintingFindings.length === 1) {
    warnings.push("Warning: Only one painting issue detected but entire house scope selected");
  }
  
  if (paintScope === "entire_room" && paintingFindings.length === 1) {
    warnings.push("Note: Only one area photographed - confirm entire room needs painting");
  }
  
  // Check if scope seems too small for findings
  if (paintScope === "spot_repair" && paintingFindings.length > 3) {
    warnings.push("Multiple painting issues detected - spot repair may not address all issues");
  }
  
  // Validate tier pricing makes sense for the number of findings
  if (tier.priceRange && findings.length > 0) {
    const avgPricePerFinding = (tier.priceRange.high - tier.priceRange.low) / findings.length;
    if (avgPricePerFinding < 20 && findings.some(f => f.severity === "high")) {
      warnings.push("Selected tier price seems low for high-severity findings");
    }
  }
  
  return {
    valid: warnings.length === 0,
    warnings,
  };
}

/**
 * Get price adjustment multiplier based on scope answers.
 */
export function getPriceMultiplier(scopeSelection: ScopeSelection): number {
  let multiplier = 1.0;
  
  const answers = scopeSelection.answers;
  
  // Color change adds primer coat
  if (answers.color_change === true) {
    multiplier *= 1.2;
  }
  
  // Tall ceilings increase price
  const ceilingHeight = answers.ceiling_height as string;
  if (ceilingHeight === "tall") {
    multiplier *= 1.3;
  } else if (ceilingHeight === "vaulted") {
    multiplier *= 1.6;
  }
  
  // Include ceiling adds to scope
  if (answers.include_ceiling === true) {
    multiplier *= 1.25;
  }
  
  return multiplier;
}

/**
 * Format price for display with appropriate precision.
 */
export function formatPriceRange(price: { low: number; high: number }): string {
  if (price.low === price.high) {
    return `$${price.low.toLocaleString()}`;
  }
  return `$${price.low.toLocaleString()} - $${price.high.toLocaleString()}`;
}

/**
 * Determine if scope is considered "large" and may need verification.
 */
export function isLargeScope(
  paintScope?: string,
  squareFeet?: number
): boolean {
  if (paintScope === "entire_house") return true;
  if (paintScope === "entire_room" && (!squareFeet || squareFeet > 300)) return true;
  if (squareFeet && squareFeet > 500) return true;
  return false;
}
