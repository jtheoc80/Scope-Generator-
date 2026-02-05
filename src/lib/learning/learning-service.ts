/**
 * Learning Service
 * 
 * Core engine for the adaptive learning system.
 * Tracks user actions, learns preferences, and provides recommendations
 * that improve over time based on user behavior and geographic patterns.
 */

import { db } from "../../../lib/db";
import {
  userActionLog,
  geographicPatterns,
  photoCategorization,
  scopeItemPatterns,
  pricingPatterns,
  type UserActionType,
  type ProposalPhotoCategory,
} from "../../../shared/schema";
import { eq, and, desc, sql, count } from "drizzle-orm";
import { logger } from "../../../lib/logger";

// ==========================================
// Types
// ==========================================

export interface LearningContext {
  userId: string;
  tradeId?: string;
  jobTypeId?: string;
  zipcode?: string;
  city?: string;
  state?: string;
  neighborhood?: string;
  proposalId?: number;
}

export interface PhotoCategorySuggestion {
  category: ProposalPhotoCategory;
  confidence: number; // 0-100
  reason: string;
}

export interface ScopeSuggestion {
  item: string;
  action: 'add' | 'consider_removing';
  confidence: number;
  reason: string;
  winRateImpact?: number; // positive = improves win rate
}

export interface PricingSuggestion {
  suggestedLow: number;
  suggestedHigh: number;
  confidence: number;
  adjustmentFromBase: number; // percentage
  reason: string;
  localWinRate?: number;
}

export interface LearnedPreferences {
  photoCategories: Record<number, PhotoCategorySuggestion>; // by photo order
  commonCaptions: Record<ProposalPhotoCategory, string[]>;
  scopeAdditions: ScopeSuggestion[];
  scopeRemovals: ScopeSuggestion[];
  pricingAdjustment: PricingSuggestion | null;
  preferredOptions: Record<string, boolean | string>;
}

// ==========================================
// Action Tracking
// ==========================================

/**
 * Log a user action for learning
 */
export async function logUserAction(
  actionType: UserActionType,
  context: LearningContext,
  payload: Record<string, unknown> = {}
): Promise<void> {
  try {
    await db.insert(userActionLog).values({
      userId: context.userId,
      actionType,
      proposalId: context.proposalId ?? null,
      tradeId: context.tradeId ?? null,
      jobTypeId: context.jobTypeId ?? null,
      zipcode: context.zipcode ?? null,
      city: context.city ?? null,
      state: context.state ?? null,
      neighborhood: context.neighborhood ?? null,
      payload,
    });
  } catch (error) {
    // Don't fail the main operation if logging fails
    logger.error('Failed to log user action', error as Error);
  }
}

/**
 * Update outcome for actions related to a proposal
 */
export async function updateActionOutcomes(
  proposalId: number,
  outcome: 'won' | 'lost',
  finalValue?: number
): Promise<void> {
  try {
    await db
      .update(userActionLog)
      .set({
        outcomeType: outcome,
        outcomeValue: finalValue ?? null,
      })
      .where(eq(userActionLog.proposalId, proposalId));
  } catch (error) {
    logger.error('Failed to update action outcomes', error as Error);
  }
}

// ==========================================
// Photo Categorization Learning
// ==========================================

/**
 * Record how a user categorized a photo
 */
export async function recordPhotoCategory(
  context: LearningContext,
  photoOrder: number,
  category: ProposalPhotoCategory,
  caption: string | null,
  wasAutoAssigned: boolean,
  wasModified: boolean
): Promise<void> {
  try {
    await db.insert(photoCategorization).values({
      userId: context.userId,
      tradeId: context.tradeId ?? null,
      jobTypeId: context.jobTypeId ?? null,
      photoOrder,
      assignedCategory: category,
      assignedCaption: caption,
      wasAutoAssigned,
      wasModified,
    });

    // Also log as action
    await logUserAction('photo_categorize', context, {
      photoOrder,
      category,
      caption,
      wasModified,
    });
  } catch (error) {
    logger.error('Failed to record photo categorization', error as Error);
  }
}

/**
 * Get suggested category for a photo based on learning
 */
export async function suggestPhotoCategory(
  context: LearningContext,
  photoOrder: number
): Promise<PhotoCategorySuggestion> {
  // Default suggestions based on order (baseline)
  const defaults: Record<number, PhotoCategorySuggestion> = {
    1: { category: 'hero', confidence: 70, reason: 'First photo typically used as hero banner' },
    2: { category: 'existing', confidence: 60, reason: 'Second photo usually shows existing conditions' },
    3: { category: 'existing', confidence: 60, reason: 'Third photo usually shows existing conditions' },
    4: { category: 'existing', confidence: 55, reason: 'Fourth photo usually shows existing conditions' },
    5: { category: 'existing', confidence: 50, reason: 'Fifth photo usually shows existing conditions' },
    6: { category: 'existing', confidence: 50, reason: 'Sixth photo usually shows existing conditions' },
  };

  const defaultSuggestion = defaults[photoOrder] || {
    category: 'other' as ProposalPhotoCategory,
    confidence: 40,
    reason: 'Additional documentation photo'
  };

  try {
    // Check user's personal pattern first
    const userPatterns = await db
      .select({
        category: photoCategorization.assignedCategory,
        count: count(),
      })
      .from(photoCategorization)
      .where(and(
        eq(photoCategorization.userId, context.userId),
        eq(photoCategorization.photoOrder, photoOrder),
        context.tradeId ? eq(photoCategorization.tradeId, context.tradeId) : sql`true`,
        context.jobTypeId ? eq(photoCategorization.jobTypeId, context.jobTypeId) : sql`true`,
      ))
      .groupBy(photoCategorization.assignedCategory)
      .orderBy(desc(count()))
      .limit(1);

    if (userPatterns.length > 0 && userPatterns[0].count >= 3) {
      // User has a clear pattern (at least 3 data points)
      const pattern = userPatterns[0];
      const confidence = Math.min(95, 60 + (pattern.count * 5));
      return {
        category: pattern.category as ProposalPhotoCategory,
        confidence,
        reason: `Based on your preference (${pattern.count} similar photos)`,
      };
    }

    // Check trade-specific patterns from all users
    if (context.tradeId && context.jobTypeId) {
      const tradePatterns = await db
        .select({
          category: photoCategorization.assignedCategory,
          count: count(),
        })
        .from(photoCategorization)
        .where(and(
          eq(photoCategorization.tradeId, context.tradeId),
          eq(photoCategorization.jobTypeId, context.jobTypeId),
          eq(photoCategorization.photoOrder, photoOrder),
        ))
        .groupBy(photoCategorization.assignedCategory)
        .orderBy(desc(count()))
        .limit(1);

      if (tradePatterns.length > 0 && tradePatterns[0].count >= 10) {
        const pattern = tradePatterns[0];
        const confidence = Math.min(85, 50 + Math.floor(pattern.count / 5));
        return {
          category: pattern.category as ProposalPhotoCategory,
          confidence,
          reason: `Common for ${context.jobTypeId} projects`,
        };
      }
    }

    return defaultSuggestion;
  } catch (error) {
    logger.error('Failed to get photo category suggestion', error as Error);
    return defaultSuggestion;
  }
}

/**
 * Get common captions used by the user for a category
 */
export async function getCommonCaptions(
  context: LearningContext,
  category: ProposalPhotoCategory
): Promise<string[]> {
  try {
    const captions = await db
      .select({
        caption: photoCategorization.assignedCaption,
        count: count(),
      })
      .from(photoCategorization)
      .where(and(
        eq(photoCategorization.userId, context.userId),
        eq(photoCategorization.assignedCategory, category),
        sql`${photoCategorization.assignedCaption} IS NOT NULL`,
        sql`${photoCategorization.assignedCaption} != ''`,
      ))
      .groupBy(photoCategorization.assignedCaption)
      .orderBy(desc(count()))
      .limit(5);

    return captions
      .filter(c => c.caption)
      .map(c => c.caption as string);
  } catch (error) {
    logger.error('Failed to get common captions', error as Error);
    return [];
  }
}

// ==========================================
// Scope Item Learning
// ==========================================

/**
 * Record a scope item modification
 */
export async function recordScopeAction(
  context: LearningContext,
  scopeItem: string,
  action: 'add' | 'remove' | 'modify',
  isFromTemplate: boolean
): Promise<void> {
  try {
    // Upsert the scope item pattern
    const existing = await db
      .select()
      .from(scopeItemPatterns)
      .where(and(
        eq(scopeItemPatterns.tradeId, context.tradeId || ''),
        eq(scopeItemPatterns.jobTypeId, context.jobTypeId || ''),
        eq(scopeItemPatterns.scopeItem, scopeItem),
        context.zipcode
          ? eq(scopeItemPatterns.zipcode, context.zipcode)
          : sql`${scopeItemPatterns.zipcode} IS NULL`,
      ))
      .limit(1);

    if (existing.length > 0) {
      const updates: Record<string, unknown> = { updatedAt: new Date() };
      if (action === 'add') updates.addedCount = sql`${scopeItemPatterns.addedCount} + 1`;
      if (action === 'remove') updates.removedCount = sql`${scopeItemPatterns.removedCount} + 1`;
      if (action === 'modify') updates.modifiedCount = sql`${scopeItemPatterns.modifiedCount} + 1`;

      await db
        .update(scopeItemPatterns)
        .set(updates)
        .where(eq(scopeItemPatterns.id, existing[0].id));
    } else {
      await db.insert(scopeItemPatterns).values({
        tradeId: context.tradeId || '',
        jobTypeId: context.jobTypeId || '',
        zipcode: context.zipcode ?? null,
        scopeItem,
        addedCount: action === 'add' ? 1 : 0,
        removedCount: action === 'remove' ? 1 : 0,
        modifiedCount: action === 'modify' ? 1 : 0,
        isFromTemplate,
      });
    }

    // Log the action
    await logUserAction(
      action === 'add' ? 'scope_add' : action === 'remove' ? 'scope_remove' : 'scope_edit',
      context,
      { scopeItem, isFromTemplate }
    );
  } catch (error) {
    logger.error('Failed to record scope action', error as Error);
  }
}

/**
 * Get scope suggestions based on patterns
 */
export async function getScopeSuggestions(
  context: LearningContext,
  currentScope: string[]
): Promise<{ additions: ScopeSuggestion[]; removals: ScopeSuggestion[] }> {
  const additions: ScopeSuggestion[] = [];
  const removals: ScopeSuggestion[] = [];

  if (!context.tradeId || !context.jobTypeId) {
    return { additions, removals };
  }

  try {
    // Get patterns for this trade/job type
    const patterns = await db
      .select()
      .from(scopeItemPatterns)
      .where(and(
        eq(scopeItemPatterns.tradeId, context.tradeId),
        eq(scopeItemPatterns.jobTypeId, context.jobTypeId),
      ))
      .orderBy(desc(scopeItemPatterns.addedCount));

    const currentScopeLower = new Set(currentScope.map(s => s.toLowerCase()));

    for (const pattern of patterns) {
      const isInCurrentScope = currentScopeLower.has(pattern.scopeItem.toLowerCase());
      const totalActions = pattern.addedCount + pattern.removedCount;

      if (totalActions < 5) continue; // Not enough data

      const addRate = pattern.addedCount / totalActions;
      const removeRate = pattern.removedCount / totalActions;
      const winRate = pattern.wonWithItem + pattern.lostWithItem > 0
        ? pattern.wonWithItem / (pattern.wonWithItem + pattern.lostWithItem)
        : null;

      // Suggest adding if frequently added and not in current scope
      if (!isInCurrentScope && addRate > 0.7 && pattern.addedCount >= 5) {
        const confidence = Math.min(90, Math.floor(addRate * 100));
        additions.push({
          item: pattern.scopeItem,
          action: 'add',
          confidence,
          reason: `Added by contractors ${Math.floor(addRate * 100)}% of the time`,
          winRateImpact: winRate ? Math.floor((winRate - 0.5) * 100) : undefined,
        });
      }

      // Suggest removing if frequently removed and in current scope
      if (isInCurrentScope && removeRate > 0.5 && pattern.removedCount >= 3) {
        const confidence = Math.min(80, Math.floor(removeRate * 100));
        removals.push({
          item: pattern.scopeItem,
          action: 'consider_removing',
          confidence,
          reason: `Removed by contractors ${Math.floor(removeRate * 100)}% of the time`,
          winRateImpact: winRate ? Math.floor((winRate - 0.5) * 100) : undefined,
        });
      }
    }

    return {
      additions: additions.slice(0, 5), // Top 5 suggestions
      removals: removals.slice(0, 3),   // Top 3 removal suggestions
    };
  } catch (error) {
    logger.error('Failed to get scope suggestions', error as Error);
    return { additions, removals };
  }
}

// ==========================================
// Pricing Learning
// ==========================================

/**
 * Record a pricing adjustment
 */
export async function recordPricingAdjustment(
  context: LearningContext,
  suggestedLow: number,
  suggestedHigh: number,
  finalLow: number,
  finalHigh: number,
  jobSize: number
): Promise<void> {
  const suggestedMid = (suggestedLow + suggestedHigh) / 2;
  const finalMid = (finalLow + finalHigh) / 2;
  const adjustmentPercent = suggestedMid > 0
    ? Math.round(((finalMid - suggestedMid) / suggestedMid) * 100)
    : 0;

  try {
    await db.insert(pricingPatterns).values({
      userId: context.userId,
      tradeId: context.tradeId || '',
      jobTypeId: context.jobTypeId || '',
      jobSize,
      zipcode: context.zipcode ?? null,
      suggestedPriceLow: suggestedLow,
      suggestedPriceHigh: suggestedHigh,
      finalPriceLow: finalLow,
      finalPriceHigh: finalHigh,
      adjustmentPercent,
    });

    // Log the action
    await logUserAction('price_adjust', context, {
      suggestedLow,
      suggestedHigh,
      finalLow,
      finalHigh,
      adjustmentPercent,
      jobSize,
    });
  } catch (error) {
    logger.error('Failed to record pricing adjustment', error as Error);
  }
}

/**
 * Get pricing suggestion based on learned patterns
 */
export async function getPricingSuggestion(
  context: LearningContext,
  basePriceLow: number,
  basePriceHigh: number,
  jobSize: number
): Promise<PricingSuggestion | null> {
  if (!context.tradeId || !context.jobTypeId) {
    return null;
  }

  try {
    // Get user's personal pricing pattern
    const userPatterns = await db
      .select({
        avgAdjustment: sql<number>`AVG(${pricingPatterns.adjustmentPercent})`,
        count: count(),
      })
      .from(pricingPatterns)
      .where(and(
        eq(pricingPatterns.userId, context.userId),
        eq(pricingPatterns.tradeId, context.tradeId),
        eq(pricingPatterns.jobTypeId, context.jobTypeId),
        eq(pricingPatterns.jobSize, jobSize),
      ));

    // Get local area patterns
    const localPatterns = context.zipcode ? await db
      .select({
        avgAdjustment: sql<number>`AVG(${pricingPatterns.adjustmentPercent})`,
        winRate: sql<number>`AVG(CASE WHEN ${pricingPatterns.outcome} = 'won' THEN 100 ELSE 0 END)`,
        count: count(),
      })
      .from(pricingPatterns)
      .where(and(
        eq(pricingPatterns.tradeId, context.tradeId),
        eq(pricingPatterns.jobTypeId, context.jobTypeId),
        eq(pricingPatterns.zipcode, context.zipcode),
        eq(pricingPatterns.jobSize, jobSize),
      )) : null;

    let adjustment = 0;
    let confidence = 50;
    let reason = 'Based on standard pricing';

    // Prefer user's own pattern if enough data
    if (userPatterns.length > 0 && userPatterns[0].count >= 3) {
      adjustment = userPatterns[0].avgAdjustment || 0;
      confidence = Math.min(90, 60 + (userPatterns[0].count * 3));
      reason = `Based on your pricing history (${userPatterns[0].count} similar jobs)`;
    }
    // Fall back to local patterns
    else if (localPatterns && localPatterns.length > 0 && localPatterns[0].count >= 5) {
      adjustment = localPatterns[0].avgAdjustment || 0;
      confidence = Math.min(80, 50 + Math.floor(localPatterns[0].count / 2));
      reason = `Based on local market data (${localPatterns[0].count} jobs in area)`;
    }

    const adjustmentMultiplier = 1 + (adjustment / 100);

    return {
      suggestedLow: Math.round(basePriceLow * adjustmentMultiplier),
      suggestedHigh: Math.round(basePriceHigh * adjustmentMultiplier),
      confidence,
      adjustmentFromBase: adjustment,
      reason,
      localWinRate: localPatterns?.[0]?.winRate ?? undefined,
    };
  } catch (error) {
    logger.error('Failed to get pricing suggestion', error as Error);
    return null;
  }
}

// ==========================================
// Geographic Pattern Learning
// ==========================================

/**
 * Get or create geographic pattern
 */
export async function getGeographicInsights(
  context: LearningContext
): Promise<{
  priceMultiplier: number;
  commonMaterials: string[];
  localWinRate: number | null;
  confidence: number;
}> {
  const defaults = {
    priceMultiplier: 1.0,
    commonMaterials: [],
    localWinRate: null,
    confidence: 0,
  };

  if (!context.zipcode) return defaults;

  try {
    const patterns = await db
      .select()
      .from(geographicPatterns)
      .where(and(
        eq(geographicPatterns.geoValue, context.zipcode),
        eq(geographicPatterns.geoLevel, 'zipcode'),
        context.tradeId ? eq(geographicPatterns.tradeId, context.tradeId) : sql`true`,
      ));

    let priceMultiplier = 1.0;
    let commonMaterials: string[] = [];
    let localWinRate: number | null = null;
    let confidence = 0;

    for (const pattern of patterns) {
      if (pattern.patternType === 'price_multiplier' && typeof pattern.patternValue === 'number') {
        priceMultiplier = pattern.patternValue;
        confidence = Math.max(confidence, pattern.confidence);
      }
      if (pattern.patternType === 'common_materials' && Array.isArray(pattern.patternValue)) {
        commonMaterials = pattern.patternValue as string[];
      }
      if (pattern.patternType === 'win_rate' && typeof pattern.patternValue === 'number') {
        localWinRate = pattern.patternValue;
      }
    }

    return { priceMultiplier, commonMaterials, localWinRate, confidence };
  } catch (error) {
    logger.error('Failed to get geographic insights', error as Error);
    return defaults;
  }
}

// ==========================================
// Aggregated Preferences
// ==========================================

/**
 * Get all learned preferences for a user in a given context
 */
export async function getLearnedPreferences(
  context: LearningContext
): Promise<LearnedPreferences> {
  const [
    photoSuggestions,
    scopeSuggestions,
  ] = await Promise.all([
    // Get photo suggestions for first 6 photos
    Promise.all([1, 2, 3, 4, 5, 6].map(order =>
      suggestPhotoCategory(context, order).then(s => ({ order, suggestion: s }))
    )),
    // Get scope suggestions (need current scope from caller)
    getScopeSuggestions(context, []),
  ]);

  // Build photo category map
  const photoCategories: Record<number, PhotoCategorySuggestion> = {};
  for (const { order, suggestion } of photoSuggestions) {
    photoCategories[order] = suggestion;
  }

  // Get common captions for each category
  const commonCaptions: Record<ProposalPhotoCategory, string[]> = {} as any;
  const categories: ProposalPhotoCategory[] = ['hero', 'existing', 'shower', 'vanity', 'flooring', 'damage'];
  for (const cat of categories) {
    commonCaptions[cat] = await getCommonCaptions(context, cat);
  }

  return {
    photoCategories,
    commonCaptions,
    scopeAdditions: scopeSuggestions.additions,
    scopeRemovals: scopeSuggestions.removals,
    pricingAdjustment: null, // Caller should use getPricingSuggestion with base prices
    // Option learning not yet implemented - returns empty object for forward compatibility.
    // Future enhancement: Track user option selections and suggest based on patterns.
    // See: docs/FUTURE_ENHANCEMENTS.md
    preferredOptions: {},
  };
}

// ==========================================
// Learning System Maintenance
// ==========================================

/**
 * Update aggregated patterns (run periodically)
 */
export async function updateAggregatedPatterns(): Promise<void> {
  // This would be run as a cron job to aggregate patterns
  // from the raw action log into the pattern tables
  logger.info('Updating aggregated patterns...');

  try {
    // 1. Update Scope Item Patterns
    // Move frequent additions from raw logs to patterns table
    await db.execute(sql`
      INSERT INTO scope_item_patterns (trade_id, job_type_id, scope_item, added_count, updated_at)
      SELECT 
        trade_id, 
        job_type_id, 
        payload->>'scopeItem' as item, 
        COUNT(*) as count,
        NOW()
      FROM user_action_log 
      WHERE action_type = 'scope_add' 
        AND created_at > NOW() - INTERVAL '7 days'
      GROUP BY trade_id, job_type_id, payload->>'scopeItem'
      ON CONFLICT (trade_id, job_type_id, scope_item) 
      DO UPDATE SET added_count = scope_item_patterns.added_count + EXCLUDED.added_count;
    `);

    // 2. Update Pricing Patterns (simplified)
    await db.execute(sql`
      INSERT INTO pricing_patterns (user_id, trade_id, job_type_id, job_size, adjustment_percent, updated_at)
      SELECT 
        user_id,
        trade_id,
        job_type_id,
        (payload->>'jobSize')::int as size,
        AVG((payload->>'adjustmentPercent')::int) as avg_adj,
        NOW()
      FROM user_action_log 
      WHERE action_type = 'price_adjust' 
        AND created_at > NOW() - INTERVAL '30 days'
      GROUP BY user_id, trade_id, job_type_id, payload->>'jobSize'
      ON CONFLICT (user_id, trade_id, job_type_id, job_size)
      DO UPDATE SET adjustment_percent = EXCLUDED.adjustment_percent;
    `);

    logger.info('Aggregated patterns updated successfully');
  } catch (error) {
    logger.error('Failed to update aggregated patterns', error as Error);
  }
}

export const learningService = {
  // Action tracking
  logUserAction,
  updateActionOutcomes,

  // Photo learning
  recordPhotoCategory,
  suggestPhotoCategory,
  getCommonCaptions,

  // Scope learning
  recordScopeAction,
  getScopeSuggestions,

  // Pricing learning
  recordPricingAdjustment,
  getPricingSuggestion,

  // Geographic learning
  getGeographicInsights,

  // Aggregated
  getLearnedPreferences,

  // Maintenance
  updateAggregatedPatterns,
};

export default learningService;
