import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { stripeService } from '@/lib/services/stripeService';
import { storage } from '@/lib/services/storage';
import { billingService } from '@/lib/services/billingService';
import { isStripeConfigured, getStripeClient } from '@/lib/services/stripeClient';
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
          // PRODUCTION MODE: DO NOT record transaction here!
          // The webhook is the SINGLE source of truth for adding credits.
          // Recording here would cause a race condition where:
          //   1. verify-session runs first (user redirect is fast)
          //   2. verify-session records transaction
          //   3. webhook sees transaction exists, skips credit addition
          //   4. User never gets credits!
          // 
          // Instead, just check if credits were already added by the webhook
          console.log('[verify-session] Production mode - checking if webhook already processed');
          const existingTransaction = await billingService.recordCreditPurchase({
            userId,
            stripeCheckoutSessionId: sessionId,
            stripePaymentIntentId: session.payment_intent as string,
            productType,
            creditsAdded: credits,
            amountPaid: session.amount_total || 0,
            expiresAt: expiresAt || undefined,
          });
          
          // If transaction already exists, webhook handled it - credits were added
          // If transaction is new, we just recorded it but webhook will still add credits
          // because we check webhook_events table, not credit_transactions
          alreadyProcessed = existingTransaction.alreadyProcessed;
          
          // In production, we don't add credits here - webhook does
          // Just report whether it was already processed
          console.log('[verify-session] Production mode - transaction check:', { 
            alreadyProcessed,
            note: 'Credits added by webhook, not verify-session'
          });
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

      const creditsToGrant = planType === 'crew' ? 50 : 15;
      const subscriptionId = typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription.id;
      const customerId = typeof session.customer === 'string'
        ? session.customer
        : session.customer?.id || '';

      console.log('[verify-session] Subscription purchase detected', {
        planType,
        subscriptionId,
        customerId,
        isDevelopment,
        userId,
        creditsToGrant,
      });

      // Get current user state
      const user = await storage.getUser(userId);
      console.log('[verify-session] Current user state', {
        userId,
        currentCredits: user?.proposalCredits,
        currentStripeSubscriptionId: user?.stripeSubscriptionId,
        currentIsPro: user?.isPro,
        newSubscriptionId: subscriptionId,
      });

      if (isDevelopment) {
        // DEVELOPMENT MODE: Grant credits directly (webhooks may not be configured)
        // Use subscription ID as idempotency key
        if (user?.stripeSubscriptionId !== subscriptionId) {
          console.log('[verify-session] Development mode - granting subscription credits directly', {
            userId,
            planType,
            creditsToGrant,
            subscriptionId,
          });

          try {
            const updatedUser = await storage.activateProSubscription(
              userId,
              customerId,
              subscriptionId,
              planType,
              creditsToGrant
            );

            if (updatedUser) {
              creditsAdded = creditsToGrant;
              console.log('[verify-session] Development - granted subscription credits:', {
                userId,
                creditsAdded,
                planType,
                newCredits: updatedUser.proposalCredits,
              });

              // Also upsert the subscriptions table
              try {
                const stripe = getStripeClient();
                const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);

                await billingService.upsertSubscription(
                  {
                    userId,
                    stripeCustomerId: customerId,
                    stripeSubscriptionId: subscriptionId,
                    status: stripeSubscription.status,
                    plan: planType,
                    currentPeriodStart: stripeSubscription.current_period_start
                      ? new Date(stripeSubscription.current_period_start * 1000)
                      : undefined,
                    currentPeriodEnd: stripeSubscription.current_period_end
                      ? new Date(stripeSubscription.current_period_end * 1000)
                      : undefined,
                    cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
                    canceledAt: stripeSubscription.canceled_at
                      ? new Date(stripeSubscription.canceled_at * 1000)
                      : null,
                  },
                  `verify-session-dev-${sessionId}`,
                  'verify-session'
                );
              } catch (subError) {
                console.error('[verify-session] Error upserting subscription:', subError);
              }
            }
          } catch (error) {
            console.error('[verify-session] Error granting subscription credits:', error);
          }
        } else {
          console.log('[verify-session] Development - subscription already activated', {
            userId,
            subscriptionId,
          });
        }
      } else {
        // PRODUCTION MODE: DO NOT grant credits here!
        // The webhook (handleCheckoutCompleted) is the SINGLE source of truth.
        // We only update UI-facing fields so the dashboard looks correct immediately.
        console.log('[verify-session] Production mode - NOT granting credits (webhook handles this)', {
          userId,
          planType,
          subscriptionId,
        });

        // Update subscription info for immediate UI feedback
        // Credits will be added by webhook
        try {
          await storage.updateUserStripeInfo(userId, {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            isPro: true,
            subscriptionPlan: planType,
          });
          console.log('[verify-session] Production - updated subscription info (credits from webhook)');
        } catch (error) {
          console.error('[verify-session] Error updating subscription info:', error);
        }
      }

      result = {
        type: 'subscription',
        planActivated: planType,
        creditsAdded: creditsAdded || undefined,
        alreadyProcessed: !isDevelopment || creditsAdded === 0,
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
