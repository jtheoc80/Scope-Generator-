import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/services/db';
import { scopeItemPatterns } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';

interface ScopeSuggestion {
  item: string;
  action: 'add' | 'consider_removing';
  confidence: number;
  reason: string;
  winRateImpact?: number;
}

/**
 * POST /api/learning/scope-suggestions
 * Get smart scope item suggestions based on learned patterns
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentScope, tradeId, jobTypeId } = body;

    if (!tradeId || !jobTypeId) {
      return NextResponse.json(
        { message: 'Trade and job type required' },
        { status: 400 }
      );
    }

    const additions: ScopeSuggestion[] = [];
    const removals: ScopeSuggestion[] = [];

    // Get patterns for this trade/job type
    const patterns = await db
      .select()
      .from(scopeItemPatterns)
      .where(and(
        eq(scopeItemPatterns.tradeId, tradeId),
        eq(scopeItemPatterns.jobTypeId, jobTypeId),
      ))
      .orderBy(desc(scopeItemPatterns.addedCount));

    const currentScopeLower = new Set<string>(
      (currentScope || []).map((s: string) => s.toLowerCase())
    );

    for (const pattern of patterns) {
      const isInCurrentScope = currentScopeLower.has(pattern.scopeItem.toLowerCase());
      const totalActions = pattern.addedCount + pattern.removedCount;

      if (totalActions < 5) continue; // Not enough data

      const addRate = pattern.addedCount / totalActions;
      const removeRate = pattern.removedCount / totalActions;
      
      // Calculate win rate impact
      const winLossTotal = pattern.wonWithItem + pattern.lostWithItem;
      const winRate = winLossTotal > 0
        ? pattern.wonWithItem / winLossTotal
        : null;

      // Suggest adding if frequently added and not in current scope
      if (!isInCurrentScope && addRate > 0.7 && pattern.addedCount >= 5) {
        const confidence = Math.min(90, Math.floor(addRate * 100));
        additions.push({
          item: pattern.scopeItem,
          action: 'add',
          confidence,
          reason: `Added by contractors ${Math.floor(addRate * 100)}% of the time`,
          winRateImpact: winRate !== null ? Math.floor((winRate - 0.5) * 100) : undefined,
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
          winRateImpact: winRate !== null ? Math.floor((winRate - 0.5) * 100) : undefined,
        });
      }
    }

    // Also suggest essential items that might be missing
    const essentials = getEssentialItems(tradeId, jobTypeId);
    for (const essential of essentials) {
      const hasItem = currentScopeLower.has(essential.item.toLowerCase()) ||
        Array.from(currentScopeLower).some(s => 
          essential.keywords.some(kw => s.includes(kw))
        );

      if (!hasItem) {
        // Check if it's not already in additions
        const alreadySuggested = additions.some(
          a => a.item.toLowerCase() === essential.item.toLowerCase()
        );
        
        if (!alreadySuggested) {
          additions.push({
            item: essential.item,
            action: 'add',
            confidence: 60,
            reason: essential.reason,
          });
        }
      }
    }

    return NextResponse.json({
      additions: additions.slice(0, 5), // Top 5 additions
      removals: removals.slice(0, 3),   // Top 3 removals
    });
  } catch (error) {
    console.error('Error getting scope suggestions:', error);
    return NextResponse.json(
      { message: 'Failed to get suggestions' },
      { status: 500 }
    );
  }
}

function getEssentialItems(
  tradeId: string,
  jobTypeId: string
): { item: string; keywords: string[]; reason: string }[] {
  // Essential items by trade/job type that are commonly forgotten
  const essentials: Record<string, { item: string; keywords: string[]; reason: string }[]> = {
    'bathroom-remodel': [
      { 
        item: 'Protect existing surfaces during demolition', 
        keywords: ['protect', 'cover', 'demolition'],
        reason: 'Essential for protecting client property',
      },
      { 
        item: 'Final cleanup and debris removal', 
        keywords: ['cleanup', 'debris', 'removal', 'clean'],
        reason: 'Commonly expected but sometimes forgotten',
      },
      { 
        item: 'Final walkthrough with homeowner', 
        keywords: ['walkthrough', 'inspection', 'final', 'review'],
        reason: 'Important for client satisfaction',
      },
    ],
    'kitchen-remodel': [
      { 
        item: 'Disconnect and cap existing plumbing', 
        keywords: ['disconnect', 'cap', 'plumbing'],
        reason: 'Safety requirement often overlooked',
      },
      { 
        item: 'Protect flooring during installation', 
        keywords: ['protect', 'floor', 'covering'],
        reason: 'Prevents damage claims',
      },
    ],
    'flooring': [
      { 
        item: 'Removal and disposal of existing flooring', 
        keywords: ['removal', 'disposal', 'existing', 'demo'],
        reason: 'Commonly included in flooring projects',
      },
      { 
        item: 'Floor leveling if needed', 
        keywords: ['level', 'leveling', 'subfloor'],
        reason: 'Often necessary but discovered during work',
      },
    ],
    'plumbing': [
      { 
        item: 'Test all fixtures for leaks after installation', 
        keywords: ['test', 'leak', 'check'],
        reason: 'Quality assurance step',
      },
    ],
  };

  // Try job type first, then trade
  return essentials[jobTypeId] || essentials[tradeId] || [];
}
