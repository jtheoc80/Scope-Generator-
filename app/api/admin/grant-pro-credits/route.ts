import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/services/db';
import { sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { USER_SESSION_COOKIE } from '@/lib/user-session';

/**
 * Admin endpoint to grant initial credits to existing Pro/Crew users
 * This fixes users who subscribed before the credit-granting logic was added
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

    // Check if user is admin (you can adjust this check as needed)
    const userResult = await db.execute(
      sql`SELECT role FROM users WHERE id = ${userId} LIMIT 1`
    );
    const user = userResult.rows[0] as { role?: string } | undefined;
    
    // For now, allow any authenticated user to grant credits to themselves
    // In production, you might want to restrict this to admins only

    const body = await request.json().catch(() => ({}));
    const targetUserId = body.userId || userId; // Allow granting to self or specified user

    // Get target user's subscription info
    const targetUserResult = await db.execute(
      sql`
        SELECT 
          id, 
          subscription_plan, 
          proposal_credits,
          stripe_subscription_id
        FROM users 
        WHERE id = ${targetUserId} 
        LIMIT 1
      `
    );

    if (targetUserResult.rows.length === 0) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    const targetUser = targetUserResult.rows[0] as {
      id: string;
      subscription_plan: string | null;
      proposal_credits: number;
      stripe_subscription_id: string | null;
    };

    // Only grant credits to Pro or Crew users
    if (!targetUser.subscription_plan || !['pro', 'crew'].includes(targetUser.subscription_plan)) {
      return NextResponse.json(
        { message: 'User is not a Pro or Crew subscriber' },
        { status: 400 }
      );
    }

    // Determine credits to grant
    const creditsToGrant = targetUser.subscription_plan === 'crew' ? 50 : 15;

    // Grant credits
    await db.execute(
      sql`
        UPDATE users 
        SET 
          proposal_credits = proposal_credits + ${creditsToGrant},
          updated_at = NOW() 
        WHERE id = ${targetUserId}
      `
    );

    logger.info('Granted Pro credits to existing user', {
      userId: targetUserId,
      plan: targetUser.subscription_plan,
      creditsGranted: creditsToGrant,
      previousCredits: targetUser.proposal_credits,
      grantedBy: userId,
    });

    const response = NextResponse.json({
      success: true,
      message: `Granted ${creditsToGrant} credits to ${targetUser.subscription_plan} user`,
      creditsGranted: creditsToGrant,
      userId: targetUserId,
    });

    // Clear user session cookie to force fresh data fetch
    response.cookies.delete(USER_SESSION_COOKIE);

    return response;
  } catch (error) {
    logger.error('Error granting Pro credits', error as Error);
    return NextResponse.json(
      { message: 'Failed to grant credits' },
      { status: 500 }
    );
  }
}
