/**
 * useAutoEnhance Hook
 * 
 * Silently enhances proposals in the background.
 * Works automatically without user interaction.
 * 
 * Features:
 * - Auto-adds commonly required components (wax rings, supply lines, etc.)
 * - Learns from user modifications
 * - Applies regional patterns
 */

import { useEffect, useRef, useCallback } from 'react';

// ==========================================
// Types
// ==========================================

interface EnhancementContext {
  userId?: string;
  jobTypeId: string;
  tradeId?: string;
  zipcode?: string;
  city?: string;
  state?: string;
}

interface ScopeEnhancement {
  additions: string[];
  warnings: string[];
}

// ==========================================
// Construction Knowledge (Inline for Hook)
// ==========================================

// Required components by job type
const REQUIRED_COMPONENTS: Record<string, string[]> = {
  // Plumbing - Toilet
  'toilet-install': [
    'Include wax ring seal',
    'Include toilet supply line',
    'Include closet bolts',
    'Caulk base of toilet after installation',
    'Test for leaks',
  ],
  'toilet-replacement': [
    'Include wax ring seal',
    'Include toilet supply line',
    'Include closet bolts',
    'Caulk base of toilet after installation',
    'Test for leaks',
  ],
  
  // Plumbing - Faucet
  'faucet-install': [
    'Include supply lines (hot and cold)',
    'Include plumbers putty or silicone',
    'Test for leaks',
  ],
  'faucet-replacement': [
    'Include supply lines (hot and cold)',
    'Include plumbers putty or silicone',
    'Test for leaks',
  ],
  
  // Plumbing - Water Heater
  'water-heater': [
    'Include expansion tank',
    'Include T&P discharge pipe',
    'Include flexible water connectors',
    'Permit and inspection fees',
    'Test for proper operation',
  ],
  'water-heater-install': [
    'Include expansion tank',
    'Include T&P discharge pipe',
    'Include flexible water connectors',
    'Permit and inspection fees',
    'Test for proper operation',
  ],
  
  // Bathroom - Shower
  'shower-install': [
    'Include waterproof membrane',
    'Include cement board substrate',
    'Include thinset and grout',
    'Caulk all corners and transitions',
    'Test for leaks (flood test)',
  ],
  'shower-remodel': [
    'Include waterproof membrane',
    'Include cement board substrate',
    'Include thinset and grout',
    'Caulk all corners and transitions',
    'Test for leaks (flood test)',
  ],
  
  // Bathroom - Vanity
  'vanity-install': [
    'Include P-trap assembly',
    'Include supply lines',
    'Include drain assembly with stopper',
    'Caulk countertop to wall',
    'Test for leaks',
  ],
  
  // Bathroom - Full Remodel
  'bathroom-remodel': [
    'Protect existing surfaces during demolition',
    'Include all plumbing trim and fixtures',
    'Include waterproofing materials for wet areas',
    'Install GFCI outlets',
    'Final cleanup and debris removal',
    'Final walkthrough with homeowner',
  ],
  
  // Kitchen
  'kitchen-remodel': [
    'Include cabinet hardware',
    'Include GFCI outlets',
    'Include garbage disposal connection',
    'Test all appliance connections',
    'Final cleanup',
  ],
  
  // Flooring
  'flooring-install': [
    'Include underlayment/padding',
    'Include transition strips at doorways',
    'Include quarter round/shoe molding',
    'Final cleanup and debris disposal',
  ],
  'tile-floor': [
    'Include cement board underlayment',
    'Include thinset mortar',
    'Include grout and grout sealer',
    'Include transition strips',
    'Seal grout after curing',
  ],
  
  // Electrical
  'electrical-panel': [
    'Include new breakers as needed',
    'Permit and inspection fees',
    'Label all circuits',
    'Provide panel schedule to homeowner',
  ],
  
  // HVAC
  'hvac-install': [
    'Include refrigerant line set',
    'Include condensate drain line',
    'Include disconnect box',
    'Permit and inspection fees',
    'Test heating and cooling operation',
  ],
  
  // Roofing
  'roof-replacement': [
    'Include ice and water shield at eaves/valleys',
    'Include synthetic underlayment',
    'Include drip edge',
    'Include ridge vent',
    'Include all flashing (step, valley, pipe)',
    'Magnetic sweep for nails after completion',
    'Haul away debris',
  ],
  
  // Windows
  'window-replacement': [
    'Include flashing tape',
    'Include low-expansion foam insulation',
    'Include exterior caulk',
    'Test window operation',
  ],
};

// ==========================================
// Hook Implementation
// ==========================================

interface UseAutoEnhanceProps {
  context: EnhancementContext;
  currentScope: string[];
  onScopeEnhance?: (additions: string[]) => void;
  /** Disable auto-enhancement */
  disabled?: boolean;
  /** Only run once on mount */
  runOnce?: boolean;
}

/**
 * Hook that silently enhances scope with required components
 */
export function useAutoEnhance({
  context,
  currentScope,
  onScopeEnhance,
  disabled = false,
  runOnce = true,
}: UseAutoEnhanceProps) {
  const hasRun = useRef(false);
  const previousJobType = useRef<string | null>(null);

  // Get enhancements for current job type
  const getEnhancements = useCallback((): ScopeEnhancement => {
    if (!context.jobTypeId) {
      return { additions: [], warnings: [] };
    }

    const jobTypeNormalized = context.jobTypeId.toLowerCase().replace(/[\s_]/g, '-');
    
    // Try to find matching components
    let requiredItems: string[] = [];
    
    // Try exact match
    if (REQUIRED_COMPONENTS[jobTypeNormalized]) {
      requiredItems = REQUIRED_COMPONENTS[jobTypeNormalized];
    } else {
      // Try partial match
      for (const [key, items] of Object.entries(REQUIRED_COMPONENTS)) {
        if (jobTypeNormalized.includes(key) || key.includes(jobTypeNormalized)) {
          requiredItems = items;
          break;
        }
      }
    }

    if (requiredItems.length === 0) {
      return { additions: [], warnings: [] };
    }

    // Filter out items already in scope
    const scopeLower = new Set(currentScope.map(s => s.toLowerCase()));
    const additions: string[] = [];

    for (const item of requiredItems) {
      const itemLower = item.toLowerCase();
      
      // Check if already covered
      let isCovered = false;
      
      // Direct match
      if (scopeLower.has(itemLower)) {
        isCovered = true;
      } else {
        // Check for keyword overlap
        const keywords = itemLower.split(/[\s,\/]+/).filter(w => w.length > 3);
        for (const scopeItem of scopeLower) {
          const matchCount = keywords.filter(kw => scopeItem.includes(kw)).length;
          if (matchCount >= 2 || (keywords.length <= 2 && matchCount >= 1)) {
            isCovered = true;
            break;
          }
        }
      }

      if (!isCovered) {
        additions.push(item);
      }
    }

    return { additions, warnings: [] };
  }, [context.jobTypeId, currentScope]);

  // Run enhancement
  useEffect(() => {
    if (disabled) return;
    if (runOnce && hasRun.current && previousJobType.current === context.jobTypeId) return;
    if (!context.jobTypeId) return;
    if (!onScopeEnhance) return;

    const { additions } = getEnhancements();
    
    if (additions.length > 0) {
      // Apply enhancements silently
      onScopeEnhance(additions);
    }

    hasRun.current = true;
    previousJobType.current = context.jobTypeId;
  }, [context.jobTypeId, disabled, runOnce, getEnhancements, onScopeEnhance]);

  // Return enhancement info for debugging/display
  return {
    getEnhancements,
    hasRun: hasRun.current,
  };
}

// ==========================================
// Utility Functions
// ==========================================

/**
 * Get required components for a job type
 * Can be called directly without the hook
 */
export function getRequiredComponents(jobTypeId: string): string[] {
  const normalized = jobTypeId.toLowerCase().replace(/[\s_]/g, '-');
  
  if (REQUIRED_COMPONENTS[normalized]) {
    return REQUIRED_COMPONENTS[normalized];
  }
  
  // Try partial match
  for (const [key, items] of Object.entries(REQUIRED_COMPONENTS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return items;
    }
  }
  
  return [];
}

/**
 * Check if scope is missing commonly required items
 */
export function getMissingScopeItems(
  jobTypeId: string,
  currentScope: string[]
): string[] {
  const required = getRequiredComponents(jobTypeId);
  const scopeLower = new Set(currentScope.map(s => s.toLowerCase()));
  
  return required.filter(item => {
    const itemLower = item.toLowerCase();
    
    // Check direct match
    if (scopeLower.has(itemLower)) return false;
    
    // Check keyword overlap
    const keywords = itemLower.split(/[\s,\/]+/).filter(w => w.length > 3);
    for (const scopeItem of scopeLower) {
      const matchCount = keywords.filter(kw => scopeItem.includes(kw)).length;
      if (matchCount >= 2 || (keywords.length <= 2 && matchCount >= 1)) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Silent background learning tracker
 */
export function trackUserAction(
  action: 'scope_add' | 'scope_remove' | 'scope_modify' | 'price_adjust',
  context: EnhancementContext,
  data: Record<string, unknown>
): void {
  // Fire and forget - don't await
  if (typeof window === 'undefined') return;
  
  const endpoint = `/api/learning/track/${action.replace('_', '-')}`;
  
  fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ ...context, ...data }),
  }).catch(() => {
    // Silent fail
  });
}

export default useAutoEnhance;
