import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/services/db';
import { photoCategorization, userActionLog } from '@shared/schema';

/**
 * POST /api/learning/track/photo-category
 * Record how a user categorized a photo for learning
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
      photoOrder,
      category,
      caption,
      wasAutoAssigned,
      wasModified,
      tradeId,
      jobTypeId,
      zipcode,
      city,
      state,
      neighborhood,
      proposalId,
    } = body;

    if (!photoOrder || !category) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Record the categorization
    await db.insert(photoCategorization).values({
      userId,
      tradeId: tradeId ?? null,
      jobTypeId: jobTypeId ?? null,
      photoOrder,
      assignedCategory: category,
      assignedCaption: caption ?? null,
      wasAutoAssigned: wasAutoAssigned ?? false,
      wasModified: wasModified ?? false,
    });

    // Also log as action for broader learning
    await db.insert(userActionLog).values({
      userId,
      actionType: 'photo_categorize',
      proposalId: proposalId ?? null,
      tradeId: tradeId ?? null,
      jobTypeId: jobTypeId ?? null,
      zipcode: zipcode ?? null,
      city: city ?? null,
      state: state ?? null,
      neighborhood: neighborhood ?? null,
      payload: {
        photoOrder,
        category,
        caption,
        wasModified,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking photo category:', error);
    return NextResponse.json(
      { message: 'Failed to track' },
      { status: 500 }
    );
  }
}
