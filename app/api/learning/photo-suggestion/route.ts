import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/server/db';
import { photoCategorization } from '@shared/schema';
import { eq, and, desc, count, sql } from 'drizzle-orm';
import type { ProposalPhotoCategory } from '@shared/schema';

/**
 * POST /api/learning/photo-suggestion
 * Get smart photo category suggestion based on learned patterns
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
    const { photoOrder, tradeId, jobTypeId } = body;

    if (!photoOrder || photoOrder < 1) {
      return NextResponse.json(
        { message: 'Invalid photo order' },
        { status: 400 }
      );
    }

    // Default suggestions based on photo order
    const defaults: Record<number, { category: ProposalPhotoCategory; confidence: number; reason: string }> = {
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
      reason: 'Additional documentation photo',
    };

    // Check user's personal pattern first
    const userPatterns = await db
      .select({
        category: photoCategorization.assignedCategory,
        count: count(),
      })
      .from(photoCategorization)
      .where(and(
        eq(photoCategorization.userId, userId),
        eq(photoCategorization.photoOrder, photoOrder),
        tradeId ? eq(photoCategorization.tradeId, tradeId) : sql`true`,
        jobTypeId ? eq(photoCategorization.jobTypeId, jobTypeId) : sql`true`,
      ))
      .groupBy(photoCategorization.assignedCategory)
      .orderBy(desc(count()))
      .limit(1);

    if (userPatterns.length > 0 && userPatterns[0].count >= 3) {
      // User has a clear pattern (at least 3 data points)
      const pattern = userPatterns[0];
      const confidence = Math.min(95, 60 + (pattern.count * 5));
      
      // Get common captions for this category
      const captions = await getCommonCaptions(userId, pattern.category as ProposalPhotoCategory);
      
      return NextResponse.json({
        category: pattern.category,
        confidence,
        reason: `Based on your preference (${pattern.count} similar photos)`,
        suggestedCaption: captions[0] || null,
        captionOptions: captions,
      });
    }

    // Check trade-specific patterns from all users
    if (tradeId && jobTypeId) {
      const tradePatterns = await db
        .select({
          category: photoCategorization.assignedCategory,
          count: count(),
        })
        .from(photoCategorization)
        .where(and(
          eq(photoCategorization.tradeId, tradeId),
          eq(photoCategorization.jobTypeId, jobTypeId),
          eq(photoCategorization.photoOrder, photoOrder),
        ))
        .groupBy(photoCategorization.assignedCategory)
        .orderBy(desc(count()))
        .limit(1);

      if (tradePatterns.length > 0 && tradePatterns[0].count >= 10) {
        const pattern = tradePatterns[0];
        const confidence = Math.min(85, 50 + Math.floor(pattern.count / 5));
        
        const captions = await getCommonCaptions(userId, pattern.category as ProposalPhotoCategory);
        
        return NextResponse.json({
          category: pattern.category,
          confidence,
          reason: `Common for ${jobTypeId} projects`,
          suggestedCaption: captions[0] || null,
          captionOptions: captions,
        });
      }
    }

    // Return default with category-appropriate captions
    const defaultCaptions = await getCommonCaptions(userId, defaultSuggestion.category);
    
    return NextResponse.json({
      ...defaultSuggestion,
      suggestedCaption: defaultCaptions[0] || null,
      captionOptions: defaultCaptions,
    });
  } catch (error) {
    console.error('Error getting photo suggestion:', error);
    return NextResponse.json(
      { message: 'Failed to get suggestion' },
      { status: 500 }
    );
  }
}

async function getCommonCaptions(
  userId: string,
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
        eq(photoCategorization.userId, userId),
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
  } catch {
    return [];
  }
}
