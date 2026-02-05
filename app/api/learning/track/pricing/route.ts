import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/services/db';
import { pricingPatterns, userActionLog } from '@shared/schema';

/**
 * POST /api/learning/track/pricing
 * Record pricing adjustments for learning
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
    const {
      suggestedLow,
      suggestedHigh,
      finalLow,
      finalHigh,
      jobSize,
      tradeId,
      jobTypeId,
      zipcode,
      city,
      state,
      neighborhood,
      proposalId,
    } = body;

    if (!tradeId || !jobTypeId || finalLow === undefined || finalHigh === undefined) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate adjustment percentage
    const suggestedMid = ((suggestedLow || 0) + (suggestedHigh || 0)) / 2;
    const finalMid = (finalLow + finalHigh) / 2;
    const adjustmentPercent = suggestedMid > 0
      ? Math.round(((finalMid - suggestedMid) / suggestedMid) * 100)
      : 0;

    // Record the pricing pattern
    await db.insert(pricingPatterns).values({
      userId,
      tradeId,
      jobTypeId,
      jobSize: jobSize ?? 2, // default to medium
      zipcode: zipcode ?? null,
      suggestedPriceLow: suggestedLow ?? null,
      suggestedPriceHigh: suggestedHigh ?? null,
      finalPriceLow: finalLow,
      finalPriceHigh: finalHigh,
      adjustmentPercent,
    });

    // Log the action
    await db.insert(userActionLog).values({
      userId,
      actionType: 'price_adjust',
      proposalId: proposalId ?? null,
      tradeId,
      jobTypeId,
      zipcode: zipcode ?? null,
      city: city ?? null,
      state: state ?? null,
      neighborhood: neighborhood ?? null,
      payload: {
        suggestedLow,
        suggestedHigh,
        finalLow,
        finalHigh,
        adjustmentPercent,
        jobSize,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking pricing:', error);
    return NextResponse.json(
      { message: 'Failed to track' },
      { status: 500 }
    );
  }
}
