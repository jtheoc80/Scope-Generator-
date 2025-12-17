import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/server/db';
import { scopeItemPatterns, userActionLog } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';

/**
 * POST /api/learning/track/scope-action
 * Record scope item modifications for learning
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
      scopeItem,
      action,
      isFromTemplate,
      tradeId,
      jobTypeId,
      zipcode,
      city,
      state,
      neighborhood,
      proposalId,
    } = body;

    if (!scopeItem || !action || !tradeId || !jobTypeId) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Upsert the scope item pattern
    const existing = await db
      .select()
      .from(scopeItemPatterns)
      .where(and(
        eq(scopeItemPatterns.tradeId, tradeId),
        eq(scopeItemPatterns.jobTypeId, jobTypeId),
        eq(scopeItemPatterns.scopeItem, scopeItem),
        zipcode
          ? eq(scopeItemPatterns.zipcode, zipcode)
          : sql`${scopeItemPatterns.zipcode} IS NULL`,
      ))
      .limit(1);

    if (existing.length > 0) {
      const updates: Record<string, unknown> = { updatedAt: new Date() };
      
      if (action === 'add') {
        updates.addedCount = sql`${scopeItemPatterns.addedCount} + 1`;
      } else if (action === 'remove') {
        updates.removedCount = sql`${scopeItemPatterns.removedCount} + 1`;
      } else if (action === 'modify') {
        updates.modifiedCount = sql`${scopeItemPatterns.modifiedCount} + 1`;
      }

      await db
        .update(scopeItemPatterns)
        .set(updates)
        .where(eq(scopeItemPatterns.id, existing[0].id));
    } else {
      await db.insert(scopeItemPatterns).values({
        tradeId,
        jobTypeId,
        zipcode: zipcode ?? null,
        scopeItem,
        addedCount: action === 'add' ? 1 : 0,
        removedCount: action === 'remove' ? 1 : 0,
        modifiedCount: action === 'modify' ? 1 : 0,
        isFromTemplate: isFromTemplate ?? false,
      });
    }

    // Log the action
    const actionType = action === 'add' 
      ? 'scope_add' 
      : action === 'remove' 
        ? 'scope_remove' 
        : 'scope_edit';

    await db.insert(userActionLog).values({
      userId,
      actionType,
      proposalId: proposalId ?? null,
      tradeId: tradeId ?? null,
      jobTypeId: jobTypeId ?? null,
      zipcode: zipcode ?? null,
      city: city ?? null,
      state: state ?? null,
      neighborhood: neighborhood ?? null,
      payload: { scopeItem, isFromTemplate },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking scope action:', error);
    return NextResponse.json(
      { message: 'Failed to track' },
      { status: 500 }
    );
  }
}
