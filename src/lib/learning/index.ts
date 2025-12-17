/**
 * Learning System
 * 
 * A comprehensive adaptive learning system that personalizes the proposal
 * experience based on user behavior, geographic patterns, and trade-specific data.
 * 
 * Key Features:
 * - User Action Tracking: Records all user interactions for learning
 * - Photo Categorization: Learns how users categorize and caption photos
 * - Scope Learning: Identifies commonly added/removed scope items
 * - Pricing Patterns: Learns pricing adjustments by user and region
 * - Geographic Insights: Regional pricing, materials, and win rates
 * 
 * How it works:
 * 1. Track - Every user action is logged with context (trade, location, etc.)
 * 2. Learn - Patterns are extracted and aggregated periodically
 * 3. Recommend - Suggestions improve based on accumulated data
 * 4. Refine - User feedback further improves recommendations
 * 
 * Usage:
 * ```typescript
 * import { learningService, recommendationEngine } from '@/lib/learning';
 * 
 * // Track an action
 * await learningService.logUserAction('photo_categorize', context, payload);
 * 
 * // Get recommendations
 * const recommendations = await recommendationEngine.getProposalRecommendations(
 *   context,
 *   currentData
 * );
 * ```
 */

export {
  learningService,
  logUserAction,
  updateActionOutcomes,
  recordPhotoCategory,
  suggestPhotoCategory,
  getCommonCaptions,
  recordScopeAction,
  getScopeSuggestions,
  recordPricingAdjustment,
  getPricingSuggestion,
  getGeographicInsights,
  getLearnedPreferences,
  type LearningContext,
  type PhotoCategorySuggestion,
  type ScopeSuggestion,
  type PricingSuggestion,
  type LearnedPreferences,
} from './learning-service';

export {
  recommendationEngine,
  getSmartPhotoSuggestions,
  getSmartCaptionSuggestions,
  getSmartScopeSuggestions,
  getSmartPricingRecommendation,
  getProposalRecommendations,
  processFeedback,
  type SmartPhotoSuggestion,
  type SmartScopeSuggestions,
  type SmartPricingRecommendation,
  type ProposalRecommendations,
} from './recommendation-engine';
