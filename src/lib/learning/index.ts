/**
 * Learning System
 * 
 * A comprehensive adaptive learning system that works silently in the background.
 * After 7 days of usage, the app becomes instinctive and automatically applies
 * learned preferences.
 * 
 * Key Features:
 * - Silent Background Learning: No user interaction required
 * - Construction Knowledge: Built-in domain expertise (wax rings, supply lines, etc.)
 * - Adaptive Profiles: Learns user patterns over 7 days
 * - Regional Patterns: Learns pricing and preferences by location
 * - Instinctive Defaults: Auto-applies learned preferences after learning period
 * 
 * How it works:
 * 1. Day 1-7: Silent observation - tracks all user actions
 * 2. Day 7+: Adaptation - starts applying learned preferences automatically
 * 3. Ongoing: Continuous refinement - keeps learning from new actions
 * 
 * Usage:
 * ```typescript
 * import { useAdaptive } from '@/hooks/useAdaptive';
 * 
 * // In your component
 * const { applyLearning, track, status } = useAdaptive({
 *   userId,
 *   jobTypeId: 'toilet-install',
 * });
 * 
 * // Auto-enhance scope (adds wax ring, supply line, etc.)
 * const enhancedScope = applyLearning.toScope(baseScope);
 * 
 * // Auto-adjust price based on user's patterns
 * const { low, high } = applyLearning.toPrice(baseLow, baseHigh);
 * 
 * // Tracking happens automatically - user actions are observed
 * ```
 */

// Construction Domain Knowledge
export {
  constructionKnowledge,
  getJobKnowledge,
  getRequiredComponents,
  getDefaultScope,
  getMissingComponents,
  getCompletionItems,
  enhanceScopeWithKnowledge,
  type JobTypeKnowledge,
  type RequiredComponent,
} from './construction-knowledge';

// Auto-Enhancement (Silent Background)
export {
  autoEnhancer,
  autoEnhanceScope,
  autoEnhancePhotos,
  autoEnhance,
  recordModification,
  type EnhancementContext,
  type ScopeEnhancement,
  type PhotoEnhancement,
  type AutoEnhanceResult,
} from './auto-enhance';

// Adaptive User Profile
export {
  adaptiveProfile,
  getUserProfile,
  saveUserProfile,
  trackAction,
  getLearnedPricingAdjustment,
  getLearnedScopeModifications,
  getLearnedPhotoCategory,
  getLearnedCaptions,
  isInLearningPeriod,
  getLearningProgress,
  type UserProfile,
  type LearnedPreferences as AdaptivePreferences,
} from './adaptive-profile';

// Server-side Learning Service
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

// Recommendation Engine
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
