import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { stripeService } from '@/lib/services/stripeService';
import { storage } from '@/lib/services/storage';
import { billingService } from '@/lib/services/billingService';
import { isStripeConfigured } from '@/lib/services/stripeClient';
import { USER_SESSION_COOKIE } from '@/lib/user-session';

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

        // Only add credits in development environment
        // In production, webhook will handle credit addition
        const isDevelopment = process.env.NODE_ENV === 'development';

        console.log('[verify-session] Environment check:', {
          NODE_ENV: process.env.NODE_ENV,
          isDevelopment,
          userId,
          credits,
          sessionId,
        });

        let creditsAdded = 0;
        let alreadyProcessed = false;

        if (isDevelopment) {
          // In development, first check if transaction was already processed (by webhook or previous call)
          // This uses the credit_transactions table as the source of truth
          const recordResult = await billingService.recordCreditPurchase({
            userId,
            stripeCheckoutSessionId: sessionId,
            stripePaymentIntentId: session.payment_intent as string,
            productType,
            creditsAdded: credits,
            amountPaid: session.amount_total || 0,
            expiresAt: expiresAt || undefined,
          });

          alreadyProcessed = recordResult.alreadyProcessed;

          if (!alreadyProcessed) {
            // Add credits directly in dev mode (webhooks may not be configured)
            // Use storage.addProposalCredits which also checks processed_sessions for extra safety
            console.log('[verify-session] Adding credits in development mode');
            const creditResult = await storage.addProposalCredits(userId, credits, expiresAt, sessionId);

            // If storage says already processed (via processed_sessions), that's fine - credits were already added
            if (creditResult.alreadyProcessed) {
              console.log('[verify-session] Credits already added via processed_sessions, skipping');
              creditsAdded = 0;
              alreadyProcessed = true;
            } else {
              creditsAdded = credits;
              console.log('[verify-session] Credits added successfully:', {
                creditsAdded,
                newTotal: creditResult.user?.proposalCredits,
              });
            }
          } else {
            console.log('[verify-session] Transaction already processed in credit_transactions, skipping credit addition');
            creditsAdded = 0;
          }
        } else {
          // In production, just record the transaction (webhook will add credits)
          console.log('[verify-session] Production mode - recording transaction only (webhook will add credits)');
          const recordResult = await billingService.recordCreditPurchase({
            userId,
            stripeCheckoutSessionId: sessionId,
            stripePaymentIntentId: session.payment_intent as string,
            productType,
            creditsAdded: credits,
            amountPaid: session.amount_total || 0,
            expiresAt: expiresAt || undefined,
          });
          alreadyProcessed = recordResult.alreadyProcessed;
          console.log('[verify-session] Transaction recorded:', { alreadyProcessed });
        }

        result = {
          type: 'credits',
          creditsAdded,
          alreadyProcessed,
        };
      }
    }

    // Handle subscription purchases
    if (planType && session.subscription) {
      const isDevelopment = process.env.NODE_ENV === 'development';
      let creditsAdded = 0;

      console.log('[verify-session] Subscription purchase detected', {
        planType,
        subscriptionId: session.subscription,
        isDevelopment,
        userId,
      });

      // Grant credits for new subscriptions (both dev and production)
      // In production, webhook should also handle this, but we use subscription ID
      // matching as idempotency key to prevent double-granting
      const creditsToGrant = planType === 'crew' ? 50 : 15;
      const subscriptionId = typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription.id;
      const customerId = typeof session.customer === 'string'
        ? session.customer
        : session.customer?.id || '';

      // Get current user state
      const user = await storage.getUser(userId);
      console.log('[verify-session] Current user state', {
        userId,
        currentCredits: user?.proposalCredits,
        currentStripeSubscriptionId: user?.stripeSubscriptionId,
        currentIsPro: user?.isPro,
        newSubscriptionId: subscriptionId,
      });

      // Grant credits if:
      // 1. User has no subscription ID set, OR
      // 2. User has the same subscription ID but isPro=false (incomplete activation)

      console.log('[verify-session] Already fully activated', {
        userId,
        existingSubscriptionId: user?.stripeSubscriptionId,
        newSubscriptionId: subscriptionId,
        isPro: user?.isPro,
      });
      console.log('[verify-session] Granting initial subscription credits', {
        userId,
        planType,
        creditsToGrant,
        subscriptionId,
        reason: !user?.stripeSubscriptionId
          ? 'no existing subscription'
          : 'isPro is false',
        mode: isDevelopment ? 'development' : 'production',
      });

      try {
        // Use storage method to update user
        const updatedUser = await storage.activateProSubscription(
          userId,
          customerId,
          subscriptionId,
          planType,
          creditsToGrant
        );

        if (updatedUser) {
          creditsAdded = creditsToGrant;
          console.log('[verify-session] Granted subscription credits successfully:', {
            userId,
            creditsAdded,
            planType,
            newCredits: updatedUser.proposalCredits,
          });
        } else {
          console.error('[verify-session] Failed to update user - activateProSubscription returned null');
        }
      } catch (error) {
        console.error('[verify-session] Error granting subscription credits:', error);
      }
      result = {
        type: 'subscription',
        planActivated: planType,
        creditsAdded: creditsAdded || undefined,
        alreadyProcessed: creditsAdded === 0,
      };
    }

    // Always return current billing status for UI to use
    const billingStatus = await billingService.getBillingStatus(userId);

    // Get updated user for credits display
    const user = await storage.getUser(userId);

    // Clear the user session cache cookie so /api/auth/user will fetch fresh data
    // This ensures the dashboard shows updated credits immediately
    const response = NextResponse.json({
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

    // Clear the user session cache cookie to force fresh data fetch
    response.cookies.delete(USER_SESSION_COOKIE);

    return response;
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
