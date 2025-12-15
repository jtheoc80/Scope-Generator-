import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { stripeService } from '@/lib/services/stripeService';
import { storage } from '@/lib/services/storage';
import { isStripeConfigured } from '@/lib/services/stripeClient';

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { message: 'Stripe is not configured' },
        { status: 503 }
      );
    }

    // Verify authentication
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sessionId } = body;
    
    if (!sessionId) {
      return NextResponse.json(
        { message: 'Session ID is required' },
        { status: 400 }
      );
    }

    const session = await stripeService.retrieveCheckoutSession(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { message: 'Session not found' },
        { status: 404 }
      );
    }

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { message: 'Payment not completed' },
        { status: 400 }
      );
    }

    if (session.metadata?.userId !== userId) {
      return NextResponse.json(
        { message: 'Session does not belong to this user' },
        { status: 403 }
      );
    }

    const credits = parseInt(session.metadata?.credits || '0');
    const productType = session.metadata?.productType as 'single' | 'pack';

    if (credits < 1) {
      return NextResponse.json(
        { message: 'Invalid credits in session' },
        { status: 400 }
      );
    }

    const expiresAt = productType === 'pack' 
      ? new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000)
      : null;

    const result = await storage.addProposalCredits(userId, credits, expiresAt, sessionId);
    
    if (!result.user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      proposalCredits: result.user.proposalCredits,
      creditsExpireAt: result.user.creditsExpireAt,
      creditsAdded: result.alreadyProcessed ? 0 : credits,
      alreadyProcessed: result.alreadyProcessed
    });
  } catch (error: any) {
    if (error.code === 'resource_missing') {
      return NextResponse.json(
        { message: 'Invalid session' },
        { status: 404 }
      );
    }
    console.error('Error verifying session:', error);
    return NextResponse.json(
      { message: 'Failed to verify session' },
      { status: 500 }
    );
  }
}
