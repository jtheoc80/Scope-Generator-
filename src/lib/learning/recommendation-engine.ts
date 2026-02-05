/**
 * Recommendation Engine
 * 
 * Provides intelligent recommendations based on learned patterns.
 * Combines user preferences, geographic patterns, and trade-specific data
 * to deliver personalized suggestions.
 */

import {
  learningService,
  type LearningContext,
  type PhotoCategorySuggestion,
} from './learning-service';
import type { ProposalPhotoCategory } from '../../../shared/schema';

// ==========================================
// Types
// ==========================================

export interface SmartPhotoSuggestion extends PhotoCategorySuggestion {
  suggestedCaption?: string;
  captionOptions: string[];
  explanation: string;
}

export interface SmartScopeSuggestions {
  recommended: {
    item: string;
    reason: string;
    confidence: number;
    source: 'user_pattern' | 'local_trend' | 'trade_standard' | 'win_rate';
  }[];
  warnings: {
    item: string;
    reason: string;
    suggestion: string;
  }[];
  missing: {
    item: string;
    reason: string;
  }[];
}

export interface SmartPricingRecommendation {
  recommended: {
    low: number;
    high: number;
  };
  adjustments: {
    name: string;
    amount: number;
    reason: string;
    confidence: number;
  }[];
  insights: {
    localMarketPosition: 'below' | 'average' | 'above';
    winRatePrediction: number | null;
    competitorRange: { low: number; high: number } | null;
  };
  explanation: string;
}

export interface ProposalRecommendations {
  photos: SmartPhotoSuggestion[];
  scope: SmartScopeSuggestions;
  pricing: SmartPricingRecommendation | null;
  options: {
    id: string;
    recommended: boolean | string;
    reason: string;
    winRateImpact: number | null;
  }[];
  overallConfidence: number;
  learningStatus: {
    hasUserPatterns: boolean;
    hasLocalData: boolean;
    dataPointCount: number;
    improvementTips: string[];
  };
}

// ==========================================
// Photo Recommendations
// ==========================================

/**
 * Get smart photo categorization suggestions
 */
export async function getSmartPhotoSuggestions(
  context: LearningContext,
  photoCount: number
): Promise<SmartPhotoSuggestion[]> {
  const suggestions: SmartPhotoSuggestion[] = [];

  for (let i = 1; i <= photoCount; i++) {
    const baseSuggestion = await learningService.suggestPhotoCategory(context, i);
    const captionOptions = await learningService.getCommonCaptions(context, baseSuggestion.category);

    // Generate explanation based on confidence
    let explanation: string;
    if (baseSuggestion.confidence >= 80) {
      explanation = `Highly recommended based on your consistent preference`;
    } else if (baseSuggestion.confidence >= 60) {
      explanation = `Suggested based on common patterns for this job type`;
    } else {
      explanation = `Default suggestion - will learn your preference over time`;
    }

    suggestions.push({
      ...baseSuggestion,
      suggestedCaption: captionOptions[0],
      captionOptions,
      explanation,
    });
  }

  return suggestions;
}

/**
 * Get smart caption suggestions based on category and context
 */
export async function getSmartCaptionSuggestions(
  context: LearningContext,
  category: ProposalPhotoCategory
): Promise<{
  suggestions: string[];
  templates: string[];
}> {
  // User's previous captions
  const userCaptions = await learningService.getCommonCaptions(context, category);

  // Category-specific templates
  const templates = getCaptionTemplates(category);

  return {
    suggestions: userCaptions,
    templates,
  };
}

function getCaptionTemplates(
  category: ProposalPhotoCategory
): string[] {
  const templates: Record<ProposalPhotoCategory, string[]> = {
    hero: [
      'Project overview',
      'Property exterior',
      'Main work area',
    ],
    existing: [
      'Current condition',
      'Area requiring attention',
      'Existing setup',
    ],
    shower: [
      'Current shower condition',
      'Shower surround showing wear',
      'Existing shower fixtures',
      'Grout condition',
    ],
    vanity: [
      'Existing vanity',
      'Sink and countertop condition',
      'Vanity cabinet condition',
    ],
    flooring: [
      'Current flooring condition',
      'Floor transition area',
      'Flooring wear pattern',
    ],
    tub: [
      'Existing bathtub',
      'Tub surround condition',
      'Tub drain area',
    ],
    toilet: [
      'Existing toilet',
      'Toilet area flooring',
    ],
    plumbing: [
      'Under-sink plumbing',
      'Water supply lines',
      'Drain condition',
    ],
    electrical: [
      'Existing electrical',
      'Outlet locations',
      'Lighting fixtures',
    ],
    damage: [
      'Water damage visible',
      'Area requiring repair',
      'Damage extent',
    ],
    kitchen: [
      'Kitchen overview',
      'Cooking area',
      'Kitchen storage',
    ],
    cabinets: [
      'Cabinet condition',
      'Interior cabinet view',
      'Cabinet hardware',
    ],
    countertops: [
      'Countertop condition',
      'Counter edge detail',
      'Surface wear',
    ],
    roofing: [
      'Roof overview',
      'Shingle condition',
      'Flashing area',
    ],
    siding: [
      'Exterior siding',
      'Siding damage',
      'Siding detail',
    ],
    windows: [
      'Window condition',
      'Frame detail',
      'Seal condition',
    ],
    hvac: [
      'HVAC unit',
      'Vent condition',
      'Ductwork',
    ],
    other: [
      'Additional documentation',
      'Reference photo',
      'Site detail',
    ],
  };

  return templates[category] || templates.other;
}

// ==========================================
// Scope Recommendations
// ==========================================

/**
 * Get smart scope suggestions based on all available data
 */
export async function getSmartScopeSuggestions(
  context: LearningContext,
  currentScope: string[]
): Promise<SmartScopeSuggestions> {
  const { additions, removals } = await learningService.getScopeSuggestions(context, currentScope);

  // Find items that are in template but might be commonly modified
  const recommended = additions.map(a => ({
    item: a.item,
    reason: a.reason,
    confidence: a.confidence,
    source: 'user_pattern' as const,
  }));

  // Generate warnings for items commonly removed
  const warnings = removals.map(r => ({
    item: r.item,
    reason: r.reason,
    suggestion: 'Consider removing if not applicable to this project',
  }));

  // Find potentially missing items based on job type
  const missing = findMissingEssentials(context, currentScope);

  return {
    recommended,
    warnings,
    missing,
  };
}

function findMissingEssentials(
  context: LearningContext,
  currentScope: string[]
): { item: string; reason: string }[] {
  // Essential items by job type that are commonly forgotten
  const essentials: Record<string, { item: string; keywords: string[] }[]> = {
    'bathroom-remodel': [
      { item: 'Protect existing surfaces during demolition', keywords: ['protect', 'cover', 'demolition'] },
      { item: 'Final cleanup and debris removal', keywords: ['cleanup', 'debris', 'removal'] },
      { item: 'Walkthrough with homeowner', keywords: ['walkthrough', 'inspection', 'final'] },
    ],
    'kitchen-remodel': [
      { item: 'Disconnect and cap existing plumbing', keywords: ['disconnect', 'cap', 'plumbing'] },
      { item: 'Protect flooring during installation', keywords: ['protect', 'floor'] },
    ],
  };

  const jobEssentials = essentials[context.jobTypeId || ''] || [];
  const missing: { item: string; reason: string }[] = [];

  for (const essential of jobEssentials) {
    const hasItem = currentScope.some(item =>
      essential.keywords.some(kw => item.toLowerCase().includes(kw))
    );

    if (!hasItem) {
      missing.push({
        item: essential.item,
        reason: `Commonly included in ${context.jobTypeId} projects`,
      });
    }
  }

  return missing;
}

// ==========================================
// Pricing Recommendations
// ==========================================

/**
 * Get smart pricing recommendation with full context
 */
export async function getSmartPricingRecommendation(
  context: LearningContext,
  basePriceLow: number,
  basePriceHigh: number,
  jobSize: number
): Promise<SmartPricingRecommendation | null> {
  const pricingSuggestion = await learningService.getPricingSuggestion(
    context,
    basePriceLow,
    basePriceHigh,
    jobSize
  );

  const geoInsights = await learningService.getGeographicInsights(context);

  if (!pricingSuggestion) {
    return null;
  }

  const adjustments: SmartPricingRecommendation['adjustments'] = [];

  // User's personal adjustment pattern
  if (pricingSuggestion.adjustmentFromBase !== 0) {
    adjustments.push({
      name: 'Your pricing pattern',
      amount: pricingSuggestion.adjustmentFromBase,
      reason: pricingSuggestion.reason,
      confidence: pricingSuggestion.confidence,
    });
  }

  // Geographic adjustment
  if (geoInsights.priceMultiplier !== 1.0 && geoInsights.confidence > 50) {
    const geoAdjustment = Math.round((geoInsights.priceMultiplier - 1) * 100);
    adjustments.push({
      name: 'Local market adjustment',
      amount: geoAdjustment,
      reason: `Based on ${context.zipcode} area pricing patterns`,
      confidence: geoInsights.confidence,
    });
  }

  // Determine market position
  let localMarketPosition: 'below' | 'average' | 'above' = 'average';
  if (pricingSuggestion.adjustmentFromBase < -10) {
    localMarketPosition = 'below';
  } else if (pricingSuggestion.adjustmentFromBase > 10) {
    localMarketPosition = 'above';
  }

  // Build explanation
  let explanation = `Recommended price of $${pricingSuggestion.suggestedLow.toLocaleString()} - $${pricingSuggestion.suggestedHigh.toLocaleString()}`;
  if (adjustments.length > 0) {
    explanation += ` includes ${adjustments.length} adjustment${adjustments.length > 1 ? 's' : ''} based on your patterns and local market data.`;
  } else {
    explanation += ` is based on standard pricing. We'll learn your preferences over time.`;
  }

  return {
    recommended: {
      low: pricingSuggestion.suggestedLow,
      high: pricingSuggestion.suggestedHigh,
    },
    adjustments,
    insights: {
      localMarketPosition,
      winRatePrediction: pricingSuggestion.localWinRate ?? null,
      // Competitor analysis not yet implemented - requires external data source.
      // Future enhancement: Integrate with market data APIs.
      // See: docs/FUTURE_ENHANCEMENTS.md
      competitorRange: null,
    },
    explanation,
  };
}

// ==========================================
// Full Proposal Recommendations
// ==========================================

/**
 * Get comprehensive recommendations for a proposal
 */
export async function getProposalRecommendations(
  context: LearningContext,
  currentData: {
    photoCount: number;
    scope: string[];
    templateScope: string[];
    basePriceLow: number;
    basePriceHigh: number;
    jobSize: number;
    options?: Record<string, boolean | string>;
  }
): Promise<ProposalRecommendations> {
  const [
    photoSuggestions,
    scopeSuggestions,
    pricingRecommendation,
  ] = await Promise.all([
    getSmartPhotoSuggestions(context, currentData.photoCount),
    getSmartScopeSuggestions(context, currentData.scope),
    getSmartPricingRecommendation(
      context,
      currentData.basePriceLow,
      currentData.basePriceHigh,
      currentData.jobSize
    ),
  ]);

  // Calculate overall confidence
  const confidenceScores = [
    ...photoSuggestions.map(p => p.confidence),
    pricingRecommendation?.adjustments.map(a => a.confidence) || [],
  ].flat();

  const overallConfidence = confidenceScores.length > 0
    ? Math.round(confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length)
    : 50;

  // Determine learning status
  const hasUserPatterns = photoSuggestions.some(p => p.confidence > 70);
  const hasLocalData = pricingRecommendation?.insights.localMarketPosition !== undefined;
  const dataPointCount = Math.max(...confidenceScores.map(c => Math.floor(c / 10)), 0);

  const improvementTips: string[] = [];
  if (!hasUserPatterns) {
    improvementTips.push('Complete a few more proposals to personalize photo suggestions');
  }
  if (!hasLocalData) {
    improvementTips.push('More projects in your area will improve local market insights');
  }
  if (overallConfidence < 60) {
    improvementTips.push('Recommendations will improve as we learn your preferences');
  }

  return {
    photos: photoSuggestions,
    scope: scopeSuggestions,
    pricing: pricingRecommendation,
    // Option recommendations not yet implemented - returns empty array for forward compatibility.
    // Future enhancement: Suggest options based on user patterns and job context.
    // See: docs/FUTURE_ENHANCEMENTS.md
    options: [],
    overallConfidence,
    learningStatus: {
      hasUserPatterns,
      hasLocalData,
      dataPointCount,
      improvementTips,
    },
  };
}

// ==========================================
// Learning Feedback
// ==========================================

/**
 * Process user feedback to improve recommendations
 */
export async function processFeedback(
  context: LearningContext,
  feedbackType: 'accepted' | 'modified' | 'rejected',
  suggestionType: 'photo' | 'scope' | 'pricing' | 'option',
  originalValue: unknown,
  newValue?: unknown
): Promise<void> {
  // Log the feedback as an action
  const actionType = feedbackType === 'accepted'
    ? 'price_accept_suggestion'
    : 'price_reject_suggestion';

  await learningService.logUserAction(actionType as any, context, {
    suggestionType,
    feedbackType,
    originalValue,
    newValue,
  });
}

export const recommendationEngine = {
  // Photos
  getSmartPhotoSuggestions,
  getSmartCaptionSuggestions,

  // Scope
  getSmartScopeSuggestions,

  // Pricing
  getSmartPricingRecommendation,

  // Full proposal
  getProposalRecommendations,

  // Feedback
  processFeedback,
};

export default recommendationEngine;
