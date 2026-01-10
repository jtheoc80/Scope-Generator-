/**
 * useAdaptive Hook
 * 
 * The main hook for the adaptive learning system.
 * Works completely in the background - no UI needed.
 * 
 * After 7 days of usage, the app becomes instinctive:
 * - Auto-applies pricing adjustments
 * - Auto-adds scope items the user always includes
 * - Auto-categorizes photos based on patterns
 * - Suggests captions based on history
 * 
 * Usage:
 * ```tsx
 * const { applyLearning, track } = useAdaptive({ userId, jobTypeId });
 * 
 * // When creating a proposal, apply learned defaults
 * const enhancedScope = applyLearning.toScope(baseScope);
 * const adjustedPrice = applyLearning.toPrice(basePrice);
 * 
 * // Track actions silently
 * track.scopeAdd('Install wax ring');
 * track.priceAdjust(5); // +5%
 * ```
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  trackAction,
  getLearnedPricingAdjustment,
  getLearnedScopeModifications,
  getLearnedPhotoCategory,
  getLearnedCaptions,
  getLearningProgress,
} from '@/src/lib/learning/adaptive-profile';
import { getRequiredComponents, getMissingScopeItems } from './useAutoEnhance';

// ==========================================
// Types
// ==========================================

interface AdaptiveContext {
  userId: string;
  jobTypeId?: string;
  tradeId?: string;
  zipcode?: string;
}

interface UseAdaptiveReturn {
  /** Apply learned defaults */
  applyLearning: {
    /** Enhance scope with learned + required items */
    toScope: (baseScope: string[]) => string[];
    /** Adjust price based on learned patterns */
    toPrice: (baseLow: number, baseHigh: number) => { low: number; high: number };
    /** Get photo category for position */
    toPhotoCategory: (position: number) => string;
    /** Get caption suggestions */
    toCaptions: (category: string) => string[];
  };
  /** Track user actions (silent) */
  track: {
    scopeAdd: (item: string) => void;
    scopeRemove: (item: string) => void;
    priceAdjust: (percent: number) => void;
    photoCategory: (position: number, category: string, caption?: string) => void;
    proposalCreate: (data: { photoCount: number; scopeCount: number }) => void;
  };
  /** Learning status */
  status: {
    isAdapted: boolean;
    daysActive: number;
    daysRemaining: number;
    confidence: number;
  };
}

// ==========================================
// Hook Implementation
// ==========================================

export function useAdaptive(context: AdaptiveContext): UseAdaptiveReturn {
  const { userId, jobTypeId, tradeId, zipcode } = context;
  const proposalIdRef = useRef<string>(`proposal-${Date.now()}`);

  // Get learning progress on mount
  const status = useMemo(() => {
    if (!userId) {
      return { isAdapted: false, daysActive: 0, daysRemaining: 7, confidence: 0 };
    }
    const progress = getLearningProgress(userId);
    return {
      isAdapted: progress.isComplete,
      daysActive: progress.daysActive,
      daysRemaining: progress.daysRemaining,
      confidence: progress.confidence,
    };
  }, [userId]);

  // ==========================================
  // Apply Learning
  // ==========================================

  /**
   * Enhance scope with learned preferences + construction knowledge
   */
  const toScope = useCallback((baseScope: string[]): string[] => {
    if (!userId) return baseScope;

    const enhanced = [...baseScope];
    const existing = new Set(baseScope.map(s => s.toLowerCase()));

    // 1. Add construction knowledge requirements (always)
    if (jobTypeId) {
      const required = getMissingScopeItems(jobTypeId, baseScope);
      for (const item of required) {
        if (!existing.has(item.toLowerCase())) {
          enhanced.push(item);
          existing.add(item.toLowerCase());
        }
      }
    }

    // 2. Add learned preferences (if adapted)
    const learned = getLearnedScopeModifications(userId, enhanced, jobTypeId);
    if (learned) {
      for (const item of learned.add) {
        if (!existing.has(item.toLowerCase())) {
          enhanced.push(item);
          existing.add(item.toLowerCase());
        }
      }
      // Note: We don't auto-remove, just track for future learning
    }

    return enhanced;
  }, [userId, jobTypeId]);

  /**
   * Adjust price based on learned patterns
   */
  const toPrice = useCallback((baseLow: number, baseHigh: number): { low: number; high: number } => {
    if (!userId) return { low: baseLow, high: baseHigh };

    const learned = getLearnedPricingAdjustment(userId, jobTypeId, zipcode);
    
    if (learned && learned.confidence >= 50) {
      const multiplier = 1 + (learned.adjustment / 100);
      return {
        low: Math.round(baseLow * multiplier),
        high: Math.round(baseHigh * multiplier),
      };
    }

    return { low: baseLow, high: baseHigh };
  }, [userId, jobTypeId, zipcode]);

  /**
   * Get photo category for position
   */
  const toPhotoCategory = useCallback((position: number): string => {
    if (!userId) {
      return getDefaultCategory(position);
    }

    const learned = getLearnedPhotoCategory(userId, position);
    if (learned && learned.confidence >= 50) {
      return learned.category;
    }

    return getDefaultCategory(position);
  }, [userId]);

  /**
   * Get caption suggestions
   */
  const toCaptions = useCallback((category: string): string[] => {
    if (!userId) return [];
    return getLearnedCaptions(userId, category);
  }, [userId]);

  // ==========================================
  // Track Actions
  // ==========================================

  const trackContext = useMemo(() => ({
    proposalId: proposalIdRef.current,
    jobTypeId,
    tradeId,
    zipcode,
  }), [jobTypeId, tradeId, zipcode]);

  const trackScopeAdd = useCallback((item: string) => {
    if (!userId) return;
    trackAction(userId, 'scope_add', trackContext, { scopeItem: item, jobTypeId });
  }, [userId, trackContext, jobTypeId]);

  const trackScopeRemove = useCallback((item: string) => {
    if (!userId) return;
    trackAction(userId, 'scope_remove', trackContext, { scopeItem: item, jobTypeId });
  }, [userId, trackContext, jobTypeId]);

  const trackPriceAdjust = useCallback((percent: number) => {
    if (!userId) return;
    trackAction(userId, 'price_adjust', trackContext, {
      adjustmentPercent: percent,
      jobTypeId,
      zipcode,
    });
  }, [userId, trackContext, jobTypeId, zipcode]);

  const trackPhotoCategory = useCallback((position: number, category: string, caption?: string) => {
    if (!userId) return;
    trackAction(userId, 'photo_categorize', trackContext, {
      photoOrder: position,
      category,
      caption,
    });
  }, [userId, trackContext]);

  const trackProposalCreate = useCallback((data: { photoCount: number; scopeCount: number }) => {
    if (!userId) return;
    trackAction(userId, 'proposal_create', trackContext, {
      jobTypeId,
      zipcode,
      ...data,
    });
  }, [userId, trackContext, jobTypeId, zipcode]);

  // ==========================================
  // Return
  // ==========================================

  return {
    applyLearning: {
      toScope,
      toPrice,
      toPhotoCategory,
      toCaptions,
    },
    track: {
      scopeAdd: trackScopeAdd,
      scopeRemove: trackScopeRemove,
      priceAdjust: trackPriceAdjust,
      photoCategory: trackPhotoCategory,
      proposalCreate: trackProposalCreate,
    },
    status,
  };
}

// ==========================================
// Helpers
// ==========================================

function getDefaultCategory(position: number): string {
  if (position === 1) return 'hero';
  if (position <= 4) return 'existing';
  if (position <= 6) return 'damage';
  return 'other';
}

// ==========================================
// Utility Hook for Simple Integration
// ==========================================

/**
 * Simple hook that auto-enhances scope when jobTypeId changes
 * Use this for automatic scope enhancement without manual calls
 */
export function useAutoScope(
  userId: string,
  jobTypeId: string | undefined,
  onEnhance: (additions: string[]) => void
): void {
  const hasApplied = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (!jobTypeId || !userId) return;
    if (hasApplied.current[jobTypeId]) return;

    // Get required items
    const required = getRequiredComponents(jobTypeId);
    
    // Get learned items
    const learned = getLearnedScopeModifications(userId, [], jobTypeId);
    
    const allItems = [
      ...required,
      ...(learned?.add || []),
    ];

    // De-duplicate
    const unique = [...new Set(allItems)];

    if (unique.length > 0) {
      onEnhance(unique);
      hasApplied.current[jobTypeId] = true;
    }
  }, [jobTypeId, userId, onEnhance]);
}

/**
 * Simple hook that auto-adjusts price when conditions change
 */
export function useAutoPrice(
  userId: string,
  baseLow: number,
  baseHigh: number,
  jobTypeId?: string,
  zipcode?: string
): { low: number; high: number; wasAdjusted: boolean } {
  return useMemo(() => {
    if (!userId || !baseLow || !baseHigh) {
      return { low: baseLow, high: baseHigh, wasAdjusted: false };
    }

    const learned = getLearnedPricingAdjustment(userId, jobTypeId, zipcode);
    
    if (learned && learned.confidence >= 50) {
      const multiplier = 1 + (learned.adjustment / 100);
      return {
        low: Math.round(baseLow * multiplier),
        high: Math.round(baseHigh * multiplier),
        wasAdjusted: true,
      };
    }

    return { low: baseLow, high: baseHigh, wasAdjusted: false };
  }, [userId, baseLow, baseHigh, jobTypeId, zipcode]);
}

export default useAdaptive;
