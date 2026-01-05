import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { stripeService } from '@/lib/services/stripeService';
import { storage } from '@/lib/services/storage';
import { billingService } from '@/lib/services/billingService';
import { isStripeConfigured } from '@/lib/services/stripeClient';

/**
 * Verify Checkout Session and Return Updated Billing Status
 * 
 * Called after successful Stripe checkout to:
 * 1. Verify the session belongs to the user
 * 2. Ensure credits/subscription are applied (idempotently)
 * 3. Return current billing status for UI refresh
 */
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

    // Retrieve session from Stripe
    const session = await stripeService.retrieveCheckoutSession(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { message: 'Session not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (session.metadata?.userId !== userId && session.client_reference_id !== userId) {
      return NextResponse.json(
        { message: 'Session does not belong to this user' },
        { status: 403 }
      );
    }

    // Determine what type of purchase this was
    const productType = session.metadata?.productType;
    const planType = session.metadata?.planType;
    const credits = parseInt(session.metadata?.credits || '0');
    
    let result: {
      type: 'subscription' | 'credits';
      creditsAdded?: number;
      planActivated?: string;
      alreadyProcessed: boolean;
    } = {
      type: 'credits',
      alreadyProcessed: false,
    };

    // Handle one-time credit purchases
    if (productType && ['starter', 'single', 'pack'].includes(productType) && credits > 0) {
      if (session.payment_status === 'paid') {
        const expiresAt = productType === 'pack' 
          ? new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000)
          : null;

        const creditResult = await storage.addProposalCredits(userId, credits, expiresAt, sessionId);
        
        result = {
          type: 'credits',
          creditsAdded: creditResult.alreadyProcessed ? 0 : credits,
          alreadyProcessed: creditResult.alreadyProcessed,
        };
      }
    }
    
    // Handle subscription purchases
    if (planType && session.subscription) {
      result = {
        type: 'subscription',
        planActivated: planType,
        alreadyProcessed: false, // Webhook handles the actual activation
      };
    }

    // Always return current billing status for UI to use
    const billingStatus = await billingService.getBillingStatus(userId);
    
    // Get updated user for credits display
    const user = await storage.getUser(userId);

    return NextResponse.json({ 
      verified: true,
      sessionId,
      purchaseType: result.type,
      ...result,
      // Include full billing status for immediate UI update
      billingStatus,
      // Include user credit info
      proposalCredits: user?.proposalCredits || 0,
      creditsExpireAt: user?.creditsExpireAt,
      isPro: user?.isPro || false,
      subscriptionPlan: user?.subscriptionPlan,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
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
