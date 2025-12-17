import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/server/db';
import { 
  userActionLog, 
  photoCategorization, 
  pricingPatterns,
  geographicPatterns,
} from '@shared/schema';
import { eq, and, count, gte, sql } from 'drizzle-orm';

/**
 * POST /api/learning/insights
 * Get learning system insights for the user
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
    const { tradeId, jobTypeId, zipcode, city } = body;

    // Get user's total actions (data points)
    const [actionCount] = await db
      .select({ count: count() })
      .from(userActionLog)
      .where(eq(userActionLog.userId, userId));

    // Get photo categorization count for this user
    const [photoCount] = await db
      .select({ count: count() })
      .from(photoCategorization)
      .where(eq(photoCategorization.userId, userId));

    // Get pricing pattern count
    const [pricingCount] = await db
      .select({ count: count() })
      .from(pricingPatterns)
      .where(eq(pricingPatterns.userId, userId));

    // Check for local data
    let hasLocalData = false;
    if (zipcode) {
      const [localCount] = await db
        .select({ count: count() })
        .from(geographicPatterns)
        .where(and(
          eq(geographicPatterns.geoValue, zipcode),
          eq(geographicPatterns.geoLevel, 'zipcode'),
        ));
      hasLocalData = localCount.count > 0;
    }

    // Calculate data points and confidence
    const totalDataPoints = 
      (actionCount?.count || 0) + 
      (photoCount?.count || 0) * 2 + // Photos weighted higher
      (pricingCount?.count || 0) * 3; // Pricing weighted highest

    // Determine if user has patterns
    const hasUserPatterns = 
      (photoCount?.count || 0) >= 5 || 
      (pricingCount?.count || 0) >= 3;

    // Calculate confidence level
    let confidenceLevel: 'low' | 'medium' | 'high' = 'low';
    if (totalDataPoints >= 50 && hasUserPatterns) {
      confidenceLevel = 'high';
    } else if (totalDataPoints >= 15 || hasUserPatterns) {
      confidenceLevel = 'medium';
    }

    // Generate improvement tips
    const tips: string[] = [];
    
    if ((photoCount?.count || 0) < 10) {
      tips.push('Categorize more photos to improve photo suggestions');
    }
    
    if ((pricingCount?.count || 0) < 5) {
      tips.push('Complete a few more proposals to learn your pricing style');
    }
    
    if (!hasLocalData && zipcode) {
      tips.push(`More proposals in ${city || zipcode} will unlock local insights`);
    }

    if (tips.length === 0) {
      if (confidenceLevel === 'high') {
        tips.push('Great job! Recommendations are well-tuned to your style');
      } else {
        tips.push('Keep using the app to improve recommendations');
      }
    }

    // Get recent activity summary
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentActivity] = await db
      .select({ count: count() })
      .from(userActionLog)
      .where(and(
        eq(userActionLog.userId, userId),
        gte(userActionLog.createdAt, thirtyDaysAgo)
      ));

    return NextResponse.json({
      hasUserPatterns,
      hasLocalData,
      confidenceLevel,
      dataPointCount: totalDataPoints,
      tips,
      stats: {
        totalActions: actionCount?.count || 0,
        photosCategorized: photoCount?.count || 0,
        pricingAdjustments: pricingCount?.count || 0,
        recentActivity: recentActivity?.count || 0,
      },
    });
  } catch (error) {
    console.error('Error getting insights:', error);
    return NextResponse.json(
      { message: 'Failed to get insights' },
      { status: 500 }
    );
  }
}
