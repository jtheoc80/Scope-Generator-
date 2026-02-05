import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { storage } from '@/lib/services/storage';
import { billingService } from '@/lib/services/billingService';
import { insertProposalSchema } from '@shared/schema';
import { getRequestUserId } from '@/lib/services/requestUserId';
import { USER_SESSION_COOKIE } from '@/lib/user-session';

export async function GET() {
  try {
    // NOTE: No NextRequest available here; this endpoint is not used by QA cookie auth.
    // It remains Clerk-only for now.
    const { auth } = await import('@clerk/nextjs/server');
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const proposals = await storage.getProposalsByUser(userId);

    // Get view stats for all proposals
    const proposalIds = proposals.map(p => p.id);
    const viewStats = await storage.getProposalViewStatsBulk(proposalIds);

    // Merge view stats into proposals
    const proposalsWithViews = proposals.map(p => ({
      ...p,
      viewCount: viewStats[p.id]?.viewCount || 0,
      lastViewedAt: viewStats[p.id]?.lastViewedAt || null,
      // Ensure isUnlocked is always a boolean (defaults to false if null/undefined)
      isUnlocked: p.isUnlocked ?? false,
    }));

    const response = NextResponse.json(proposalsWithViews);
    // Prevent caching to ensure fresh data
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  } catch (error) {
    logger.error('Error fetching proposals', error as Error);
    return NextResponse.json(
      { message: 'Failed to fetch proposals' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getRequestUserId(request);

    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Ensure scopeSections defaults to empty array (never undefined)
    const validationResult = insertProposalSchema.safeParse({
      ...body,
      userId,
      // Default scopeSections to [] if not provided
      scopeSections: body.scopeSections ?? [],
    });

    if (!validationResult.success) {
      const message =
        validationResult.error.issues?.[0]?.message ??
        validationResult.error.message ??
        'Invalid proposal data';
      return NextResponse.json(
        { message, errors: validationResult.error.format() },
        { status: 400 }
      );
    }

    // Get billing status to determine unlock behavior
    const billingStatus = await billingService.getBillingStatus(userId);
    const now = new Date();
    
    // Check if user is in trial
    const isInTrial = user.trialEndsAt && new Date(user.trialEndsAt) > now;
    
    logger.debug('User billing status for proposal creation', {
      userId,
      isInTrial,
      hasActiveSubscription: billingStatus.hasActiveSubscription,
      availableCredits: billingStatus.availableCredits,
      trialEndsAt: user.trialEndsAt,
      subscriptionPlan: user.subscriptionPlan,
      isPro: user.isPro,
    });
    
    // Determine if proposal should be auto-unlocked
    let isUnlocked = false;
    let creditDeducted = false;

    // 1. Pro/Crew subscribers: MUST deduct 1 credit and auto-unlock (even if in trial)
    // Pro users always pay with credits, trial status doesn't exempt them
    if (billingStatus.hasActiveSubscription) {
      logger.info('Pro user creating proposal', {
        userId,
        availableCredits: billingStatus.availableCredits,
        hasActiveSubscription: billingStatus.hasActiveSubscription
      });

      // Pro users MUST have credits to create proposals - check first
      if (billingStatus.availableCredits <= 0) {
        logger.warn('Pro user has no credits', { userId });
        return NextResponse.json(
          { 
            message: 'Insufficient credits. Please purchase more credits to create proposals.',
            requiresPayment: true,
            noCredits: true
          },
          { status: 402 }
        );
      }
      
      // Deduct credit for Pro users when creating proposal (atomic operation)
      logger.debug('Attempting to deduct credit for Pro user', { userId });
      const updatedUser = await storage.deductProposalCredit(userId);
      logger.debug('Credit deduction result', {
        userId,
        success: !!updatedUser,
        remainingCredits: updatedUser?.proposalCredits
      });

      if (!updatedUser) {
        // Credit deduction failed (insufficient credits or expired)
        logger.warn('Credit deduction failed for Pro user', { userId });
        return NextResponse.json(
          { 
            message: 'Failed to deduct credit. Please check your credits or purchase more.',
            requiresPayment: true,
            noCredits: true
          },
          { status: 402 }
        );
      }
      
      // Credit deducted successfully - unlock the proposal
      logger.info('Credit deducted successfully, unlocking proposal', {
        userId,
        remainingCredits: updatedUser.proposalCredits,
      });
      isUnlocked = true;
      creditDeducted = true;
    }
    // 2. Trial users (free users in trial): Free auto-unlock (no credit deduction)
    else if (isInTrial) {
      logger.debug('Free user in trial - no credit deduction', { userId });
      isUnlocked = true;
    }
    // 3. Free users (not in trial): Create as locked (they need to unlock via /unlock endpoint)
    else {
      logger.debug('Free user creating proposal - will be locked', { userId });
      isUnlocked = false;
    }
    
    logger.debug('Final proposal state', {
      userId,
      isUnlocked,
      creditDeducted,
    });

    const proposal = await storage.createProposal({
      ...validationResult.data,
      isUnlocked,
    });
    
    const response = NextResponse.json({ 
      message: "Proposal created successfully", 
      proposal,
      creditDeducted,
      remainingCredits: creditDeducted ? billingStatus.availableCredits - 1 : billingStatus.availableCredits,
    }, { status: 201 } as any as Response);

    // Clear user session cookie cache if credit was deducted
    // This forces the dashboard to fetch fresh user data with updated credits
    if (creditDeducted) {
      response.cookies.delete(USER_SESSION_COOKIE);
      logger.debug('Cleared user session cookie cache after credit deduction', { userId });
    }

    return response;
  } catch (error) {
    logger.error('Error creating proposal', error as Error);
    return NextResponse.json({ message: "Failed to create proposal" }, { status: 500 } as any as Response);
  }
}
