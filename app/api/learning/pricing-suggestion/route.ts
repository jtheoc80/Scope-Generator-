import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/server/db';
import { pricingPatterns, geographicPatterns } from '@shared/schema';
import { eq, and, sql, count } from 'drizzle-orm';

/**
 * POST /api/learning/pricing-suggestion
 * Get smart pricing suggestion based on learned patterns
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
    const { basePriceLow, basePriceHigh, jobSize, tradeId, jobTypeId, zipcode } = body;

    if (!tradeId || !jobTypeId || basePriceLow === undefined || basePriceHigh === undefined) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user's personal pricing pattern
    const userPatterns = await db
      .select({
        avgAdjustment: sql<number>`AVG(${pricingPatterns.adjustmentPercent})`,
        count: count(),
      })
      .from(pricingPatterns)
      .where(and(
        eq(pricingPatterns.userId, userId),
        eq(pricingPatterns.tradeId, tradeId),
        eq(pricingPatterns.jobTypeId, jobTypeId),
        jobSize ? eq(pricingPatterns.jobSize, jobSize) : sql`true`,
      ));

    // Get local area patterns
    const localPatterns = zipcode ? await db
      .select({
        avgAdjustment: sql<number>`AVG(${pricingPatterns.adjustmentPercent})`,
        winRate: sql<number>`AVG(CASE WHEN ${pricingPatterns.outcome} = 'won' THEN 100 ELSE 0 END)`,
        count: count(),
      })
      .from(pricingPatterns)
      .where(and(
        eq(pricingPatterns.tradeId, tradeId),
        eq(pricingPatterns.jobTypeId, jobTypeId),
        eq(pricingPatterns.zipcode, zipcode),
        jobSize ? eq(pricingPatterns.jobSize, jobSize) : sql`true`,
      )) : null;

    // Get geographic price multiplier if available
    const geoPattern = zipcode ? await db
      .select()
      .from(geographicPatterns)
      .where(and(
        eq(geographicPatterns.geoValue, zipcode),
        eq(geographicPatterns.geoLevel, 'zipcode'),
        eq(geographicPatterns.patternType, 'price_multiplier'),
        tradeId ? eq(geographicPatterns.tradeId, tradeId) : sql`true`,
      ))
      .limit(1) : null;

    let adjustment = 0;
    let confidence = 50;
    let reason = 'Based on standard pricing';
    let localWinRate: number | undefined;

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
      localWinRate = localPatterns[0].winRate;
    }
    // Apply geographic multiplier if available
    else if (geoPattern && geoPattern.length > 0) {
      const multiplier = geoPattern[0].patternValue as number;
      if (typeof multiplier === 'number' && multiplier !== 1) {
        adjustment = Math.round((multiplier - 1) * 100);
        confidence = geoPattern[0].confidence;
        reason = `Based on ${zipcode} area pricing trends`;
      }
    }

    const adjustmentMultiplier = 1 + (adjustment / 100);
    const recommendedLow = Math.round(basePriceLow * adjustmentMultiplier);
    const recommendedHigh = Math.round(basePriceHigh * adjustmentMultiplier);

    // Calculate market position
    let marketPosition: 'below' | 'average' | 'above' = 'average';
    if (adjustment < -10) {
      marketPosition = 'below';
    } else if (adjustment > 10) {
      marketPosition = 'above';
    }

    // Build explanation
    let explanation = `Recommended price of $${recommendedLow.toLocaleString()} - $${recommendedHigh.toLocaleString()}`;
    if (adjustment !== 0) {
      const direction = adjustment > 0 ? 'increase' : 'decrease';
      const absAdjustment = Math.abs(adjustment);
      explanation += ` reflects a ${absAdjustment}% ${direction} based on ${
        userPatterns[0]?.count >= 3 ? 'your pricing style' : 'local market conditions'
      }.`;
    } else {
      explanation += `. We'll learn your pricing preferences over time.`;
    }

    return NextResponse.json({
      recommendedLow,
      recommendedHigh,
      adjustmentPercent: adjustment,
      confidence,
      reason,
      localWinRate,
      marketPosition,
      explanation,
      // Include breakdown for transparency
      breakdown: {
        baseLow: basePriceLow,
        baseHigh: basePriceHigh,
        userAdjustment: userPatterns[0]?.count >= 3 ? userPatterns[0].avgAdjustment : null,
        localAdjustment: localPatterns?.[0]?.count >= 5 ? localPatterns[0].avgAdjustment : null,
        geoMultiplier: geoPattern?.[0]?.patternValue ?? null,
        dataPoints: {
          userHistory: userPatterns[0]?.count || 0,
          localMarket: localPatterns?.[0]?.count || 0,
        },
      },
    });
  } catch (error) {
    console.error('Error getting pricing suggestion:', error);
    return NextResponse.json(
      { message: 'Failed to get suggestion' },
      { status: 500 }
    );
  }
}
