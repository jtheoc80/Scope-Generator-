import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/server/db';
import { userActionLog, pricingPatterns, scopeItemPatterns, proposals, mobileJobDrafts } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';

/**
 * POST /api/learning/track/outcome
 * Record proposal outcome (won/lost) to improve learning
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
    const { proposalId, outcome, finalValue } = body;

    if (!proposalId || !outcome) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['won', 'lost'].includes(outcome)) {
      return NextResponse.json(
        { message: 'Invalid outcome' },
        { status: 400 }
      );
    }

    // Get the proposal to verify ownership and get context
    const [proposal] = await db
      .select()
      .from(proposals)
      .where(and(
        eq(proposals.id, proposalId),
        eq(proposals.userId, userId)
      ))
      .limit(1);

    if (!proposal) {
      return NextResponse.json(
        { message: 'Proposal not found' },
        { status: 404 }
      );
    }

    // Update all actions related to this proposal with the outcome
    await db
      .update(userActionLog)
      .set({
        outcomeType: outcome,
        outcomeValue: finalValue ?? null,
      })
      .where(eq(userActionLog.proposalId, proposalId));

    // Update pricing patterns for this proposal
    await db
      .update(pricingPatterns)
      .set({ outcome })
      .where(and(
        eq(pricingPatterns.userId, userId),
        eq(pricingPatterns.tradeId, proposal.tradeId || ''),
        eq(pricingPatterns.jobTypeId, proposal.jobTypeId || ''),
        // Match by approximate time (within 24 hours of proposal creation)
        sql`${pricingPatterns.createdAt} >= ${proposal.createdAt}::timestamp - interval '1 day'`,
        sql`${pricingPatterns.createdAt} <= ${proposal.createdAt}::timestamp + interval '1 day'`,
      ));

    // Update scope item patterns with win/loss correlation
    const scope = proposal.scope as string[] || [];
    for (const scopeItem of scope) {
      const existing = await db
        .select()
        .from(scopeItemPatterns)
        .where(and(
          eq(scopeItemPatterns.tradeId, proposal.tradeId || ''),
          eq(scopeItemPatterns.jobTypeId, proposal.jobTypeId || ''),
          eq(scopeItemPatterns.scopeItem, scopeItem),
        ))
        .limit(1);

      if (existing.length > 0) {
        const updates = outcome === 'won'
          ? { wonWithItem: sql`${scopeItemPatterns.wonWithItem} + 1` }
          : { lostWithItem: sql`${scopeItemPatterns.lostWithItem} + 1` };

        await db
          .update(scopeItemPatterns)
          .set(updates)
          .where(eq(scopeItemPatterns.id, existing[0].id));
      }
    }

    // Log the outcome action
    await db.insert(userActionLog).values({
      userId,
      actionType: outcome === 'won' ? 'proposal_won' : 'proposal_lost',
      proposalId,
      tradeId: proposal.tradeId ?? null,
      jobTypeId: proposal.jobTypeId ?? null,
      zipcode: null, // Could parse from address if needed
      payload: { finalValue },
      outcomeType: outcome,
      outcomeValue: finalValue ?? null,
    });

    // Similar Job Retrieval (Phase 1): update outcome status for linked mobile job (if any).
    try {
      const [draft] = await db.select().from(mobileJobDrafts).where(eq(mobileJobDrafts.proposalId, proposalId)).limit(1);
      if (draft?.jobId) {
        const wonAt = outcome === "won" ? new Date() : null;
        const lostAt = outcome === "lost" ? new Date() : null;
        await db.execute(sql`
          INSERT INTO job_outcomes (job_id, status, final_price, won_at, lost_at, updated_at)
          VALUES (
            ${draft.jobId},
            ${outcome},
            ${finalValue ?? null},
            ${wonAt},
            ${lostAt},
            NOW()
          )
          ON CONFLICT (job_id)
          DO UPDATE SET
            status = EXCLUDED.status,
            final_price = COALESCE(EXCLUDED.final_price, job_outcomes.final_price),
            won_at = COALESCE(job_outcomes.won_at, EXCLUDED.won_at),
            lost_at = COALESCE(job_outcomes.lost_at, EXCLUDED.lost_at),
            updated_at = NOW()
        `);
      }
    } catch (e) {
      console.warn("similarity.outcome.update.failed", {
        proposalId,
        error: e instanceof Error ? e.message : String(e),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking outcome:', error);
    return NextResponse.json(
      { message: 'Failed to track outcome' },
      { status: 500 }
    );
  }
}
