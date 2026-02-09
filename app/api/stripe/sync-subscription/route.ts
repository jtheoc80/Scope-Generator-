import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { billingService } from '@/lib/services/billingService';
import { getStripeClient } from '@/lib/services/stripeClient';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

/**
 * Sync subscription data from Stripe for the current user
 * This backfills missing period data that wasn't saved previously
 */
export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // Get the user's subscription from our database
        const subscription = await billingService.getSubscriptionByUserId(userId);

        if (!subscription || !subscription.stripeSubscriptionId) {
            return NextResponse.json({
                message: 'No subscription found for user',
                success: false
            });
        }

        // Fetch the subscription from Stripe
        const stripe = getStripeClient();
        const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);

        // Update our database with the Stripe data
        const currentPeriodStart = stripeSubscription.current_period_start
            ? new Date(stripeSubscription.current_period_start * 1000)
            : null;
        const currentPeriodEnd = stripeSubscription.current_period_end
            ? new Date(stripeSubscription.current_period_end * 1000)
            : null;

        await db.execute(
            sql`UPDATE subscriptions SET
        current_period_start = ${currentPeriodStart},
        current_period_end = ${currentPeriodEnd},
        cancel_at_period_end = ${stripeSubscription.cancel_at_period_end},
        canceled_at = ${stripeSubscription.canceled_at ? new Date(stripeSubscription.canceled_at * 1000) : null},
        status = ${stripeSubscription.status},
        updated_at = NOW()
      WHERE stripe_subscription_id = ${subscription.stripeSubscriptionId}`
        );

        console.log('[sync-subscription] Updated subscription period data:', {
            userId,
            stripeSubscriptionId: subscription.stripeSubscriptionId,
            currentPeriodStart,
            currentPeriodEnd,
            cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        });

        return NextResponse.json({
            success: true,
            message: 'Subscription synced successfully',
            data: {
                currentPeriodStart,
                currentPeriodEnd,
                cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
                status: stripeSubscription.status,
            }
        });

    } catch (error) {
        console.error('[sync-subscription] Error:', error);
        return NextResponse.json({
            message: 'Failed to sync subscription',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
