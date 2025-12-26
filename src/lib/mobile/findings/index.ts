/**
 * Findings Module - Scope Clarification & Pricing Guardrails
 * 
 * This module implements the gated proposal flow:
 * Photo Analysis → Findings Summary → Clarifying Questions → Scope Selection → Pricing → Proposal
 * 
 * Key features:
 * - Structured findings from photo analysis
 * - Scope clarification questions (especially for painting jobs)
 * - Pricing guardrails to prevent over-scoping
 * - Default to minimum reasonable scope
 */

export {
  // Types
  type Finding,
  type Unknown,
  type ScopeOption,
  type ClarifyingQuestion,
  type ScopeTier,
  type FindingsSummary,
  type ScopeSelection,
  
  // Schemas (for validation)
  findingSchema,
  unknownSchema,
  scopeOptionSchema,
  clarifyingQuestionSchema,
  scopeTierSchema,
  findingsSummarySchema,
  scopeSelectionSchema,
  
  // Constants
  PAINTING_SCOPE_OPTIONS,
  PAINTING_CLARIFYING_QUESTIONS,
  PAINTING_SCOPE_TIERS,
  
  // Utilities
  detectPaintingJob,
  requiresScopeConfirmation,
  generateScopeTiers,
} from "./types";

export {
  // Pricing guardrails
  applyPricingGuardrails,
  validateScopeVsFindings,
  getPriceMultiplier,
  formatPriceRange,
  isLargeScope,
  
  // Constants
  PAINTING_PRICE_PER_SQFT,
  DEFAULT_SQFT_ESTIMATES,
  
  // Types
  type PricingGuardrailResult,
} from "./pricing-guardrails";
