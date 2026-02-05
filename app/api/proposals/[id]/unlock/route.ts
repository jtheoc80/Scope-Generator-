import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { storage } from '@/lib/services/storage';
import { billingService } from '@/lib/services/billingService';
import { USER_SESSION_COOKIE } from '@/lib/user-session';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const proposalId = parseInt(id);

    const user = await storage.getUser(userId);
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    const proposal = await storage.getProposal(proposalId);
    if (!proposal || proposal.userId !== userId) {
      return NextResponse.json(
        { message: 'Proposal not found or access denied' },
        { status: 404 }
      );
    }

    // Already unlocked
    if (proposal.isUnlocked) {
      return NextResponse.json(proposal);
    }

    // ========================================
    // Tier-based access control for unlock
    // ========================================
    const billingStatus = await billingService.getBillingStatus(userId);
    const now = new Date();

    let creditDeducted = false;

    // 1. Trial users (3-day): Free unlock
    if (user.trialEndsAt && new Date(user.trialEndsAt) > now) {
      // Allow - trial period active
    }
    // 2. Pro/Crew subscribers: Free unlock (included in subscription)
    else if (billingStatus.hasActiveSubscription) {
      // Allow - subscription includes unlock
    }
    // 3. Free users with credits: Deduct 1 credit
    else if (billingStatus.availableCredits > 0) {
      const updatedUser = await storage.deductProposalCredit(userId);
      if (!updatedUser) {
        return NextResponse.json(
          { message: 'Failed to deduct credit', requiresPayment: true },
          { status: 402 }
        );
      }
      creditDeducted = true;
    }
    // 4. No access
    else {
      return NextResponse.json(
        {
          message: 'No credits available. Purchase credits or subscribe to Pro.',
          requiresPayment: true,
          noCredits: true,
          requiresUpgrade: true,
        },
        { status: 402 }
      );
    }

    const unlocked = await storage.unlockProposal(proposalId, userId);

    if (!unlocked) {
      return NextResponse.json(
        { message: 'Failed to unlock proposal' },
        { status: 404 }
      );
    }

    // Fetch updated billing status for response
    const updatedBillingStatus = creditDeducted
      ? await billingService.getBillingStatus(userId)
      : billingStatus;

    const response = NextResponse.json({
      ...unlocked,
      remainingCredits: updatedBillingStatus.availableCredits,
      creditDeducted,
    });

    // Clear user session cookie cache if credit was deducted
    // This forces the dashboard to fetch fresh user data with updated credits
    if (creditDeducted) {
      response.cookies.delete(USER_SESSION_COOKIE);
    }

    return response;
  } catch (error) {
    console.error('Error unlocking proposal:', error);
    return NextResponse.json(
      { message: 'Failed to unlock proposal' },
      { status: 500 }
    );
  }
}

