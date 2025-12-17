/**
 * Auto-Enhance Service
 * 
 * Silently enhances proposals in the background with:
 * 1. Construction domain knowledge (materials, components)
 * 2. Learned user preferences
 * 3. Regional patterns
 * 
 * This works automatically - no user interaction required.
 */

import { constructionKnowledge, type RequiredComponent } from './construction-knowledge';

// ==========================================
// Types
// ==========================================

export interface EnhancementContext {
  userId?: string;
  jobTypeId: string;
  tradeId?: string;
  zipcode?: string;
  city?: string;
  state?: string;
}

export interface ScopeEnhancement {
  /** Items to add to scope */
  additions: string[];
  /** Warnings about potentially missing items */
  warnings: string[];
  /** Source of each addition */
  sources: Record<string, 'knowledge' | 'learned' | 'regional'>;
}

export interface PricingEnhancement {
  /** Suggested multiplier based on learning */
  multiplier: number;
  /** Reason for adjustment */
  reason: string;
  /** Confidence level */
  confidence: number;
}

export interface PhotoEnhancement {
  /** Suggested category for photo at position */
  categories: Record<number, string>;
  /** Confidence levels */
  confidence: Record<number, number>;
}

// ==========================================
// Scope Auto-Enhancement
// ==========================================

/**
 * Automatically enhance scope with commonly needed items
 * Works silently - returns items to add without user prompt
 */
export function autoEnhanceScope(
  context: EnhancementContext,
  currentScope: string[],
  options: {
    /** Include prep work items */
    includePrep?: boolean;
    /** Include completion/cleanup items */
    includeCompletion?: boolean;
    /** Maximum items to add */
    maxAdditions?: number;
  } = {}
): ScopeEnhancement {
  const {
    includePrep = false,
    includeCompletion = true,
    maxAdditions = 10,
  } = options;

  const additions: string[] = [];
  const warnings: string[] = [];
  const sources: Record<string, 'knowledge' | 'learned' | 'regional'> = {};
  const scopeLower = new Set(currentScope.map(s => s.toLowerCase()));

  // 1. Get construction knowledge requirements
  const knowledge = constructionKnowledge.getJobKnowledge(context.jobTypeId);
  
  if (knowledge) {
    // Add required components that are missing
    const missingComponents = constructionKnowledge.getMissingComponents(
      context.jobTypeId,
      currentScope
    );

    for (const component of missingComponents) {
      if (!isItemCovered(component.item, scopeLower)) {
        // For "always" required items, add silently
        if (component.condition === 'always' || component.condition === 'typically') {
          additions.push(formatScopeItem(component));
          sources[component.item] = 'knowledge';
        } else {
          // For "if_needed" items, add as warning
          warnings.push(`Consider: ${component.item}`);
        }
      }
    }

    // Add completion items if enabled
    if (includeCompletion) {
      const completionItems = knowledge.completionItems;
      for (const item of completionItems) {
        if (!isItemCovered(item, scopeLower) && !additions.includes(item)) {
          // Only add essential completion items
          if (isEssentialCompletion(item)) {
            additions.push(item);
            sources[item] = 'knowledge';
          }
        }
      }
    }

    // Add prep items if enabled
    if (includePrep) {
      const prepItems = knowledge.prepWork;
      for (const item of prepItems) {
        if (!isItemCovered(item, scopeLower) && !additions.includes(item)) {
          if (isEssentialPrep(item)) {
            additions.push(item);
            sources[item] = 'knowledge';
          }
        }
      }
    }

    // Add common oversights as warnings
    for (const oversight of knowledge.commonOversights) {
      if (!isItemCovered(oversight, scopeLower)) {
        warnings.push(oversight);
      }
    }
  }

  // Limit additions
  return {
    additions: additions.slice(0, maxAdditions),
    warnings: warnings.slice(0, 5),
    sources,
  };
}

/**
 * Check if an item is already covered in the scope
 */
function isItemCovered(item: string, scopeLower: Set<string>): boolean {
  const itemLower = item.toLowerCase();
  
  // Direct match
  if (scopeLower.has(itemLower)) return true;
  
  // Check if any scope item contains key words from this item
  const keyWords = itemLower
    .split(/[\s,\/\(\)]+/)
    .filter(w => w.length > 3);
  
  for (const scopeItem of scopeLower) {
    const matchCount = keyWords.filter(kw => scopeItem.includes(kw)).length;
    if (matchCount >= 2 || (keyWords.length === 1 && matchCount === 1)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Format a component as a scope item string
 */
function formatScopeItem(component: RequiredComponent): string {
  // Some items need context
  if (component.category === 'material') {
    // Check if it should be prefixed
    if (!component.item.toLowerCase().startsWith('install') && 
        !component.item.toLowerCase().startsWith('provide') &&
        !component.item.toLowerCase().startsWith('include')) {
      return `Include ${component.item.toLowerCase()}`;
    }
  }
  return component.item;
}

/**
 * Check if completion item is essential (should be auto-added)
 */
function isEssentialCompletion(item: string): boolean {
  const essentialKeywords = [
    'test', 'leak', 'clean', 'debris', 'inspection',
    'walkthrough', 'disposal', 'haul'
  ];
  const itemLower = item.toLowerCase();
  return essentialKeywords.some(kw => itemLower.includes(kw));
}

/**
 * Check if prep item is essential
 */
function isEssentialPrep(item: string): boolean {
  const essentialKeywords = [
    'protect', 'turn off', 'disconnect', 'shut off',
    'permit', 'clear'
  ];
  const itemLower = item.toLowerCase();
  return essentialKeywords.some(kw => itemLower.includes(kw));
}

// ==========================================
// Photo Auto-Enhancement
// ==========================================

/**
 * Get smart photo categories based on position
 * Works silently - no user interaction
 */
export function autoEnhancePhotos(
  context: EnhancementContext,
  photoCount: number
): PhotoEnhancement {
  const categories: Record<number, string> = {};
  const confidence: Record<number, number> = {};

  // Default pattern based on construction best practices
  for (let i = 1; i <= photoCount; i++) {
    if (i === 1) {
      // First photo is usually wide shot/hero
      categories[i] = 'hero';
      confidence[i] = 80;
    } else if (i <= 4) {
      // Next few are existing conditions
      categories[i] = 'existing';
      confidence[i] = 70;
    } else if (i <= 6) {
      // Then damage/problem areas
      categories[i] = 'damage';
      confidence[i] = 60;
    } else {
      // Rest are other/detail shots
      categories[i] = 'other';
      confidence[i] = 50;
    }
  }

  // Override with job-type specific logic
  const knowledge = constructionKnowledge.getJobKnowledge(context.jobTypeId);
  if (knowledge) {
    // Adjust based on job type
    // e.g., bathroom jobs should have shower/vanity categories
    const tradeCategories = getTradeSpecificCategories(knowledge.tradeName);
    
    // Replace some "other" with trade-specific categories
    let tradeIndex = 0;
    for (let i = 5; i <= Math.min(photoCount, 8); i++) {
      if (categories[i] === 'other' || categories[i] === 'damage') {
        if (tradeCategories[tradeIndex]) {
          categories[i] = tradeCategories[tradeIndex];
          confidence[i] = 65;
          tradeIndex++;
        }
      }
    }
  }

  return { categories, confidence };
}

function getTradeSpecificCategories(tradeName: string): string[] {
  const tradeCategories: Record<string, string[]> = {
    'Plumbing': ['plumbing', 'damage'],
    'Bathroom': ['shower', 'vanity', 'flooring', 'toilet'],
    'Kitchen': ['cabinets', 'countertops', 'plumbing'],
    'Flooring': ['flooring', 'damage'],
    'Electrical': ['electrical'],
    'HVAC': ['hvac'],
    'Roofing': ['roofing', 'damage'],
    'Windows': ['windows'],
  };
  
  return tradeCategories[tradeName] || [];
}

// ==========================================
// Main Auto-Enhance Function
// ==========================================

export interface AutoEnhanceResult {
  scope: ScopeEnhancement;
  photos: PhotoEnhancement;
  /** Whether enhancements were applied */
  enhanced: boolean;
}

/**
 * Main auto-enhance function
 * Call this when creating/loading a proposal
 */
export async function autoEnhance(
  context: EnhancementContext,
  currentData: {
    scope: string[];
    photoCount: number;
  }
): Promise<AutoEnhanceResult> {
  // Enhance scope with construction knowledge
  const scopeEnhancement = autoEnhanceScope(context, currentData.scope, {
    includeCompletion: true,
    includePrep: false, // Prep is usually implicit
  });

  // Get smart photo categories
  const photoEnhancement = autoEnhancePhotos(context, currentData.photoCount);

  return {
    scope: scopeEnhancement,
    photos: photoEnhancement,
    enhanced: scopeEnhancement.additions.length > 0,
  };
}

// ==========================================
// Background Learning Integration
// ==========================================

/**
 * Record user modifications to learn preferences
 * Called silently when user makes changes
 */
export async function recordModification(
  context: EnhancementContext,
  modification: {
    type: 'scope_add' | 'scope_remove' | 'photo_category' | 'price_adjust';
    item?: string;
    value?: unknown;
    original?: unknown;
  }
): Promise<void> {
  // This would call the learning API in the background
  // For now, we'll rely on the API endpoints already created
  
  if (typeof window === 'undefined') return; // Server-side
  
  try {
    const endpoint = `/api/learning/track/${modification.type.replace('_', '-')}`;
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        ...context,
        ...modification,
      }),
    });
  } catch {
    // Silent fail - don't disrupt user flow
  }
}

export const autoEnhancer = {
  autoEnhanceScope,
  autoEnhancePhotos,
  autoEnhance,
  recordModification,
};

export default autoEnhancer;
