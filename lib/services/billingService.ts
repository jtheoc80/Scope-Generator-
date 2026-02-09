/**
 * Billing Service - Canonical billing operations with idempotency
 * 
 * This service is the ONLY place that should modify billing state.
 * All operations are idempotent using Stripe event IDs.
 */

import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import type Stripe from 'stripe';
import { getStripeClient } from './stripeClient';
import {
  isActiveSubscriptionStatus,
  calculateBillingStatus,
  type SubscriptionStatus,
  type PlanType,
  type BillingStatus,
  type Subscription,
  type WebhookEvent,
  type InsertWebhookEvent,
} from '@/shared/billing-schema';

// ==========================================
// Billing Types (imported from shared schema)
// ==========================================


export class BillingService {
  // ==========================================
  // Webhook Event Idempotency
  // ==========================================

  /**
   * Check if a webhook event has already been processed
   */
  async isEventProcessed(eventId: string): Promise<boolean> {
    const result = await db.execute(
      sql`SELECT id FROM webhook_events WHERE event_id = ${eventId} LIMIT 1`
    );
    return result.rows.length > 0;
  }

  /**
   * Record that a webhook event has been processed
   */
  async recordWebhookEvent(event: InsertWebhookEvent): Promise<WebhookEvent | null> {
    const result = await db.execute(
      sql`
        INSERT INTO webhook_events (event_id, event_type, processing_result, stripe_customer_id, stripe_subscription_id, user_id, error_message, raw_payload)
        VALUES (${event.eventId}, ${event.eventType}, ${event.processingResult || 'success'}, ${event.stripeCustomerId || null}, ${event.stripeSubscriptionId || null}, ${event.userId || null}, ${event.errorMessage || null}, ${event.rawPayload || null})
        ON CONFLICT (event_id) DO NOTHING
        RETURNING *
      `
    );
    return result.rows[0] as WebhookEvent | null;
  }

  /**
   * Mark an event as failed
   */
  async markEventFailed(eventId: string, errorMessage: string): Promise<void> {
    await db.execute(
      sql`UPDATE webhook_events SET processing_result = 'failed', error_message = ${errorMessage} WHERE event_id = ${eventId}`
    );
  }

  // ==========================================
  /**
   * Convert snake_case row from database to camelCase Subscription object
   */
  private mapRowToSubscription(row: Record<string, unknown>): Subscription {
    return {
      id: row.id as number,
      userId: row.user_id as string,
      stripeCustomerId: row.stripe_customer_id as string,
      stripeSubscriptionId: row.stripe_subscription_id as string | null,
      stripePriceId: row.stripe_price_id as string | null,
      status: row.status as string,
      plan: row.plan as string,
      currentPeriodStart: row.current_period_start ? new Date(row.current_period_start as string) : null,
      currentPeriodEnd: row.current_period_end ? new Date(row.current_period_end as string) : null,
      trialStart: row.trial_start ? new Date(row.trial_start as string) : null,
      trialEnd: row.trial_end ? new Date(row.trial_end as string) : null,
      cancelAtPeriodEnd: row.cancel_at_period_end as boolean,
      canceledAt: row.canceled_at ? new Date(row.canceled_at as string) : null,
      lastWebhookEventId: row.last_webhook_event_id as string | null,
      lastUpdatedByEvent: row.last_updated_by_event as string | null,
      createdAt: row.created_at ? new Date(row.created_at as string) : null,
      updatedAt: row.updated_at ? new Date(row.updated_at as string) : null,
    };
  }

  /**
   * Get subscription by user ID
   * Prioritizes active subscriptions, then orders by most recently updated
   */
  async getSubscriptionByUserId(userId: string): Promise<Subscription | null> {
    try {
      const result = await db.execute(
        sql`SELECT * FROM subscriptions 
          WHERE user_id = ${userId} 
          ORDER BY 
            CASE status 
              WHEN 'active' THEN 1 
              WHEN 'trialing' THEN 2 
              WHEN 'past_due' THEN 3 
              ELSE 4 
            END,
            updated_at DESC NULLS LAST
          LIMIT 1`
      );
      if (!result.rows[0]) return null;
      return this.mapRowToSubscription(result.rows[0] as Record<string, unknown>);
    } catch (error: any) {
      // Handle case where subscriptions table doesn't exist yet
      if (error.message?.includes('relation "subscriptions" does not exist') ||
        error.message?.includes('Failed query')) {
        console.warn('[BillingService] subscriptions table not found - returning null');
        return null;
      }
      throw error;
    }
  }

  /**
   * Get subscription by Stripe customer ID
   */
  async getSubscriptionByCustomerId(customerId: string): Promise<Subscription | null> {
    const result = await db.execute(
      sql`SELECT * FROM subscriptions WHERE stripe_customer_id = ${customerId} ORDER BY created_at DESC LIMIT 1`
    );
    if (!result.rows[0]) return null;
    return this.mapRowToSubscription(result.rows[0] as Record<string, unknown>);
  }

  /**
   * Get subscription by Stripe subscription ID
   */
  async getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | null> {
    try {
      const result = await db.execute(
        sql`SELECT * FROM subscriptions WHERE stripe_subscription_id = ${stripeSubscriptionId} LIMIT 1`
      );
      if (!result.rows[0]) return null;
      return this.mapRowToSubscription(result.rows[0] as Record<string, unknown>);
    } catch (error: any) {
      // Handle case where subscriptions table doesn't exist yet
      if (error.message?.includes('relation "subscriptions" does not exist') ||
        error.message?.includes('Failed query')) {
        console.warn('[BillingService] subscriptions table not found in getSubscriptionByStripeId - returning null');
        return null;
      }
      throw error;
    }
  }

  /**
   * Create or update subscription from Stripe data (idempotent)
   * This is called by webhook handlers
   */
  async upsertSubscription(
    data: {
      userId: string;
      stripeCustomerId: string;
      stripeSubscriptionId: string;
      stripePriceId?: string;
      status: string;
      plan: string;
      currentPeriodStart?: Date;
      currentPeriodEnd?: Date;
      trialStart?: Date;
      trialEnd?: Date;
      cancelAtPeriodEnd?: boolean;
      canceledAt?: Date | null;
    },
    eventId: string,
    eventType: string
  ): Promise<Subscription | null> {
    try {
      // Try to find existing subscription
      const existing = await this.getSubscriptionByStripeId(data.stripeSubscriptionId);

      if (existing) {
        // Update existing subscription
        const result = await db.execute(
          sql`
            UPDATE subscriptions SET
              status = ${data.status},
              plan = ${data.plan},
              stripe_price_id = ${data.stripePriceId || null},
              current_period_start = ${data.currentPeriodStart || null},
              current_period_end = ${data.currentPeriodEnd || null},
              trial_start = ${data.trialStart || null},
              trial_end = ${data.trialEnd || null},
              cancel_at_period_end = ${data.cancelAtPeriodEnd ?? false},
              canceled_at = ${data.canceledAt || null},
              last_webhook_event_id = ${eventId},
              last_updated_by_event = ${eventType},
              updated_at = NOW()
            WHERE stripe_subscription_id = ${data.stripeSubscriptionId}
            RETURNING *
          `
        );
        if (!result.rows[0]) return null;
        return this.mapRowToSubscription(result.rows[0] as Record<string, unknown>);
      } else {
        // Create new subscription
        const result = await db.execute(
          sql`
            INSERT INTO subscriptions (
              user_id, stripe_customer_id, stripe_subscription_id, stripe_price_id,
              status, plan, current_period_start, current_period_end,
              trial_start, trial_end, cancel_at_period_end, canceled_at,
              last_webhook_event_id, last_updated_by_event
            ) VALUES (
              ${data.userId}, ${data.stripeCustomerId}, ${data.stripeSubscriptionId}, ${data.stripePriceId || null},
              ${data.status}, ${data.plan}, ${data.currentPeriodStart || null}, ${data.currentPeriodEnd || null},
              ${data.trialStart || null}, ${data.trialEnd || null}, ${data.cancelAtPeriodEnd ?? false}, ${data.canceledAt || null},
              ${eventId}, ${eventType}
            )
            RETURNING *
          `
        );
        if (!result.rows[0]) return null;
        return this.mapRowToSubscription(result.rows[0] as Record<string, unknown>);
      }
    } catch (error: any) {
      // Handle case where subscriptions table doesn't exist yet
      if (error.message?.includes('relation "subscriptions" does not exist') ||
        error.message?.includes('Failed query')) {
        console.warn('[BillingService] subscriptions table not found in upsertSubscription - skipping subscription record');
        return null;
      }
      throw error;
    }
  }

  /**
   * Cancel subscription (mark as canceled)
   */
  async cancelSubscription(
    stripeSubscriptionId: string,
    eventId: string,
    canceledAt: Date = new Date()
  ): Promise<Subscription | null> {
    const result = await db.execute(
      sql`
        UPDATE subscriptions SET
          status = 'canceled',
          canceled_at = ${canceledAt},
          last_webhook_event_id = ${eventId},
          last_updated_by_event = 'customer.subscription.deleted',
          updated_at = NOW()
        WHERE stripe_subscription_id = ${stripeSubscriptionId}
        RETURNING *
      `
    );
    return (result.rows[0] as Subscription) || null;
  }

  // ==========================================
  // Credit Transactions
  // ==========================================

  /**
   * Record a credit purchase (idempotent by checkout session ID)
   */
  async recordCreditPurchase(
    data: {
      userId: string;
      stripeCheckoutSessionId: string;
      stripePaymentIntentId?: string;
      productType: string;
      creditsAdded: number;
      amountPaid: number;
      expiresAt?: Date;
    }
  ): Promise<{ transaction: any; alreadyProcessed: boolean }> {
    // Check if already processed
    const existingResult = await db.execute(
      sql`SELECT * FROM credit_transactions WHERE stripe_checkout_session_id = ${data.stripeCheckoutSessionId} LIMIT 1`
    );

    if (existingResult.rows.length > 0) {
      return { transaction: existingResult.rows[0], alreadyProcessed: true };
    }

    // Create transaction
    const result = await db.execute(
      sql`
        INSERT INTO credit_transactions (
          user_id, stripe_checkout_session_id, stripe_payment_intent_id,
          product_type, credits_added, amount_paid, status, expires_at
        ) VALUES (
          ${data.userId}, ${data.stripeCheckoutSessionId}, ${data.stripePaymentIntentId || null},
          ${data.productType}, ${data.creditsAdded}, ${data.amountPaid}, 'completed', ${data.expiresAt || null}
        )
        RETURNING *
      `
    );

    return { transaction: result.rows[0], alreadyProcessed: false };
  }

  // ==========================================
  // Billing Status
  // ==========================================

  /**
   * Get complete billing status for a user
   * This is what UI components should call
   */
  async getBillingStatus(userId: string): Promise<BillingStatus> {
    // Get subscription
    const subscription = await this.getSubscriptionByUserId(userId);

    // Get user credits
    const userResult = await db.execute(
      sql`SELECT proposal_credits, credits_expire_at, trial_ends_at FROM users WHERE id = ${userId} LIMIT 1`
    );

    const user = userResult.rows[0] as { proposal_credits?: number; credits_expire_at?: Date; trial_ends_at?: Date } | undefined;

    return calculateBillingStatus(subscription, {
      proposalCredits: user?.proposal_credits,
      creditsExpireAt: user?.credits_expire_at,
      trialEndsAt: user?.trial_ends_at,
    });
  }

  /**
   * Check if user has access to premium features
   * Quick check for gating
   */
  async hasAccess(userId: string): Promise<boolean> {
    const status = await this.getBillingStatus(userId);
    return status.canAccessPremiumFeatures;
  }

  // ==========================================
  // Webhook Handlers (Idempotent)
  // ==========================================

  /**
   * Handle checkout.session.completed event
   * 
   * CRITICAL: This webhook is the SINGLE source of truth for:
   * - Adding credits in PRODUCTION
   * - Activating subscriptions
   * 
   * Idempotency is handled via webhook_events table (checked at start).
   * Do NOT rely on credit_transactions for idempotency - verify-session may
   * have already recorded a transaction, but credits should still be added here.
   */
  async handleCheckoutCompleted(
    session: Stripe.Checkout.Session,
    eventId: string,
    rawPayload?: string
  ): Promise<{ success: boolean; message: string }> {
    // Check idempotency via webhook_events table
    // This is the PRIMARY idempotency check - if this event was processed, skip everything
    if (await this.isEventProcessed(eventId)) {
      console.log('[webhook] Event already processed, skipping', { eventId, sessionId: session.id });
      return { success: true, message: 'Event already processed' };
    }

    const userId = session.metadata?.userId || session.client_reference_id;
    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;
    const productType = session.metadata?.productType;
    const planType = session.metadata?.planType;

    console.log('[webhook] Processing checkout.session.completed', {
      eventId,
      sessionId: session.id,
      userId,
      customerId,
      productType,
      planType,
      subscriptionId,
    });

    if (!userId) {
      await this.recordWebhookEvent({
        eventId,
        eventType: 'checkout.session.completed',
        stripeCustomerId: customerId,
        processingResult: 'failed',
        errorMessage: 'No userId in session metadata',
        rawPayload,
      });
      return { success: false, message: 'No userId in session metadata' };
    }

    try {
      // Handle one-time payments (credits)
      if (productType && ['starter', 'single', 'pack'].includes(productType)) {
        const credits = parseInt(session.metadata?.credits || '0');
        if (credits > 0) {
          const expiresAt = productType === 'pack'
            ? new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000)
            : null;

          // Record credit transaction for audit trail
          // NOTE: This may already exist if verify-session ran first - that's OK!
          // We use webhook_events for idempotency, not credit_transactions
          await this.recordCreditPurchase({
            userId,
            stripeCheckoutSessionId: session.id,
            stripePaymentIntentId: session.payment_intent as string,
            productType,
            creditsAdded: credits,
            amountPaid: session.amount_total || 0,
            expiresAt: expiresAt || undefined,
          });

          // ALWAYS add credits in production via webhook
          // In development, verify-session handles this (webhooks may not be configured)
          const isProduction = process.env.NODE_ENV === 'production';

          if (isProduction) {
            // Webhook is the source of truth in production - add credits now
            // Idempotency is guaranteed by webhook_events check at the top
            await db.execute(
              sql`
                UPDATE users 
                SET 
                  proposal_credits = proposal_credits + ${credits},
                  credits_expire_at = CASE 
                    WHEN ${expiresAt}::timestamp IS NOT NULL AND (credits_expire_at IS NULL OR ${expiresAt}::timestamp > credits_expire_at)
                    THEN ${expiresAt}::timestamp
                    ELSE credits_expire_at
                  END,
                  updated_at = NOW()
                WHERE id = ${userId}
              `
            );
            console.log('[webhook] Credits added via webhook (production mode)', { 
              userId, 
              sessionId: session.id, 
              credits,
              expiresAt 
            });
          } else {
            console.log('[webhook] Development mode - skipping credit addition (verify-session handles this)', {
              userId,
              sessionId: session.id,
              credits
            });
          }
        }
      }

      // Handle subscription creation
      // CRITICAL: checkout.session.completed is the AUTHORITATIVE event for subscription purchases.
      // It MUST always grant initial credits. Idempotency is handled by webhook_events check at the top.
      // 
      // NOTE: We do NOT use isNewSubscription check here because:
      // - customer.subscription.created webhook often fires BEFORE checkout.session.completed
      // - That creates the subscription record first
      // - Then checkout.session.completed sees isNewSubscription=false and skips credits
      // - This is a bug! checkout.session.completed IS the purchase confirmation.
      if (planType && subscriptionId) {
        console.log('[webhook] Processing subscription purchase (checkout.session.completed)', {
          userId,
          planType,
          subscriptionId,
          customerId,
          eventId,
        });

        // Fetch full subscription from Stripe to get period data
        let stripeSubscription: Stripe.Subscription | null = null;
        try {
          const stripe = getStripeClient();
          stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
          console.log('[webhook] Fetched subscription from Stripe', {
            status: stripeSubscription.status,
            currentPeriodStart: stripeSubscription.current_period_start,
            currentPeriodEnd: stripeSubscription.current_period_end,
          });
        } catch (error) {
          console.warn('[webhook] Could not fetch subscription from Stripe:', error);
        }

        // Upsert subscription record (may already exist from customer.subscription.created)
        await this.upsertSubscription(
          {
            userId,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            status: stripeSubscription?.status || 'active',
            plan: planType,
            currentPeriodStart: stripeSubscription?.current_period_start
              ? new Date(stripeSubscription.current_period_start * 1000)
              : undefined,
            currentPeriodEnd: stripeSubscription?.current_period_end
              ? new Date(stripeSubscription.current_period_end * 1000)
              : undefined,
            cancelAtPeriodEnd: stripeSubscription?.cancel_at_period_end || false,
            canceledAt: stripeSubscription?.canceled_at
              ? new Date(stripeSubscription.canceled_at * 1000)
              : null,
          },
          eventId,
          'checkout.session.completed'
        );

        // Grant initial credits based on plan type
        // Pro = 15 credits/month, Crew = 50 credits/month
        const creditsToGrant = planType === 'crew' ? 50 : 15;
        const isProduction = process.env.NODE_ENV === 'production';

        if (isProduction) {
          // PRODUCTION: checkout.session.completed is the source of truth for initial credits
          // Idempotency is guaranteed by isEventProcessed() check at the start of this function
          await db.execute(
            sql`
              UPDATE users 
              SET 
                proposal_credits = proposal_credits + ${creditsToGrant},
                stripe_customer_id = ${customerId}, 
                stripe_subscription_id = ${subscriptionId}, 
                is_pro = true, 
                subscription_plan = ${planType}, 
                updated_at = NOW() 
              WHERE id = ${userId}
            `
          );
          console.log(`[webhook] ✅ Granted ${creditsToGrant} credits for ${planType} subscription (checkout.session.completed)`, { 
            userId, 
            sessionId: session.id, 
            subscriptionId,
            creditsToGrant,
            eventId,
          });
        } else {
          // DEVELOPMENT: Just update subscription info, verify-session handles credits
          await db.execute(
            sql`UPDATE users SET stripe_customer_id = ${customerId}, stripe_subscription_id = ${subscriptionId}, is_pro = true, subscription_plan = ${planType}, updated_at = NOW() WHERE id = ${userId}`
          );
          console.log(`[webhook] Development mode - subscription info updated, verify-session handles credits`, { 
            userId, 
            sessionId: session.id, 
            subscriptionId 
          });
        }
      }

      // Record successful processing
      await this.recordWebhookEvent({
        eventId,
        eventType: 'checkout.session.completed',
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        userId,
        processingResult: 'success',
        rawPayload,
      });

      return { success: true, message: 'Checkout completed successfully' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.recordWebhookEvent({
        eventId,
        eventType: 'checkout.session.completed',
        stripeCustomerId: customerId,
        userId,
        processingResult: 'failed',
        errorMessage,
        rawPayload,
      });
      throw error;
    }
  }

  /**
   * Handle customer.subscription.updated event
   * 
   * This handles subscription renewals, plan changes, cancellations, etc.
   * The subscription object should have metadata set via subscription_data.metadata
   * when the checkout session was created.
   */
  async handleSubscriptionUpdated(
    subscription: Stripe.Subscription,
    eventId: string,
    rawPayload?: string
  ): Promise<{ success: boolean; message: string }> {
    // Check idempotency
    if (await this.isEventProcessed(eventId)) {
      console.log('[webhook] Subscription update event already processed', { eventId, subscriptionId: subscription.id });
      return { success: true, message: 'Event already processed' };
    }

    const customerId = subscription.customer as string;
    // CRITICAL: userId should be in subscription.metadata (set via subscription_data.metadata)
    const userId = subscription.metadata?.userId;
    const metadataPlanType = subscription.metadata?.planType;

    console.log('[webhook] Processing subscription.updated', {
      eventId,
      subscriptionId: subscription.id,
      customerId,
      userIdFromMetadata: userId,
      planTypeFromMetadata: metadataPlanType,
      status: subscription.status,
    });

    // Find user by metadata or customer ID
    let targetUserId: string | undefined = userId;
    if (!targetUserId) {
      console.log('[webhook] No userId in subscription metadata, looking up by customer ID');
      const userResult = await db.execute(
        sql`SELECT id FROM users WHERE stripe_customer_id = ${customerId} LIMIT 1`
      );
      targetUserId = userResult.rows[0]?.id as string | undefined;
      if (targetUserId) {
        console.log('[webhook] Found user by customer ID', { targetUserId, customerId });
      }
    }

    // If still no user, try looking up by subscription ID
    if (!targetUserId) {
      console.log('[webhook] No user found by customer ID, looking up by subscription ID');
      const userResult = await db.execute(
        sql`SELECT id FROM users WHERE stripe_subscription_id = ${subscription.id} LIMIT 1`
      );
      targetUserId = userResult.rows[0]?.id as string | undefined;
      if (targetUserId) {
        console.log('[webhook] Found user by subscription ID', { targetUserId, subscriptionId: subscription.id });
      }
    }

    if (!targetUserId) {
      console.error('[webhook] Could not find user for subscription update', {
        customerId,
        subscriptionId: subscription.id,
        metadata: subscription.metadata,
      });
      await this.recordWebhookEvent({
        eventId,
        eventType: 'customer.subscription.updated',
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        processingResult: 'failed',
        errorMessage: 'Could not find user for subscription',
        rawPayload,
      });
      return { success: false, message: 'Could not find user for subscription' };
    }

    try {
      const isActive = isActiveSubscriptionStatus(subscription.status);
      // Use metadata planType if available, otherwise try to infer from existing subscription
      let planType = metadataPlanType;
      if (!planType) {
        // Try to get from existing subscription record
        const existingSub = await this.getSubscriptionByStripeId(subscription.id);
        planType = existingSub?.plan || 'pro';
        console.log('[webhook] No planType in metadata, using existing or default', { planType });
      }

      // Get existing subscription to detect renewals and plan changes
      const existingSubscription = await this.getSubscriptionByStripeId(subscription.id);
      const newPeriodStart = subscription.current_period_start
        ? new Date(subscription.current_period_start * 1000)
        : undefined;

      // Detect if this is a renewal (new billing period started)
      const isRenewal = existingSubscription &&
        newPeriodStart &&
        existingSubscription.currentPeriodStart &&
        newPeriodStart.getTime() > existingSubscription.currentPeriodStart.getTime();

      // Detect plan upgrade/downgrade
      const oldPlan = existingSubscription?.plan as string | undefined;
      const isPlanChange = oldPlan && oldPlan !== planType;
      const isUpgrade = isPlanChange && (
        (oldPlan === 'pro' && planType === 'crew') ||
        (oldPlan === 'free' && (planType === 'pro' || planType === 'crew'))
      );
      const isDowngrade = isPlanChange && (
        (oldPlan === 'crew' && planType === 'pro') ||
        (oldPlan === 'crew' && planType === 'free') ||
        (oldPlan === 'pro' && planType === 'free')
      );

      // Update subscription record
      await this.upsertSubscription(
        {
          userId: targetUserId,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
          status: subscription.status,
          plan: planType,
          currentPeriodStart: newPeriodStart,
          currentPeriodEnd: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000)
            : undefined,
          trialStart: subscription.trial_start
            ? new Date(subscription.trial_start * 1000)
            : undefined,
          trialEnd: subscription.trial_end
            ? new Date(subscription.trial_end * 1000)
            : undefined,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          canceledAt: subscription.canceled_at
            ? new Date(subscription.canceled_at * 1000)
            : null,
        },
        eventId,
        'customer.subscription.updated'
      );

      // CRITICAL: Always sync user flags from subscription status (source of truth)
      // subscriptions.status is PRIMARY, user.is_pro is derived
      const shouldHaveProAccess = isActive || subscription.status === 'past_due' || subscription.status === 'trialing';

      // Handle credit grants based on scenario
      if (isActive && isRenewal) {
        // Monthly renewal: Grant new month's credits
        const creditsToGrant = planType === 'crew' ? 50 : 15;
        await db.execute(
          sql`
            UPDATE users 
            SET 
              proposal_credits = proposal_credits + ${creditsToGrant},
              is_pro = ${shouldHaveProAccess}, 
              subscription_plan = ${shouldHaveProAccess ? planType : null}, 
              updated_at = NOW() 
            WHERE id = ${targetUserId}
          `
        );
        console.log(`[webhook] Granted ${creditsToGrant} credits for ${planType} subscription renewal`, {
          userId: targetUserId,
          subscriptionId: subscription.id
        });
      } else if (isActive && isUpgrade) {
        // Plan upgrade: Grant prorated credits or full month (business decision)
        // For now: Grant full month credits on upgrade
        const creditsToGrant = planType === 'crew' ? 50 : 15;
        await db.execute(
          sql`
            UPDATE users 
            SET 
              proposal_credits = proposal_credits + ${creditsToGrant},
              is_pro = ${shouldHaveProAccess}, 
              subscription_plan = ${shouldHaveProAccess ? planType : null}, 
              updated_at = NOW() 
            WHERE id = ${targetUserId}
          `
        );
        console.log(`[webhook] Granted ${creditsToGrant} credits for upgrade from ${oldPlan} to ${planType}`, {
          userId: targetUserId,
          subscriptionId: subscription.id
        });
      } else if (isActive && isDowngrade) {
        // Plan downgrade: Keep existing credits, just update plan
        // Note: User keeps their current credits (no refund, no reset)
        await db.execute(
          sql`UPDATE users SET is_pro = ${shouldHaveProAccess}, subscription_plan = ${shouldHaveProAccess ? planType : null}, updated_at = NOW() WHERE id = ${targetUserId}`
        );
        console.log(`[webhook] Plan downgraded from ${oldPlan} to ${planType} - credits retained`, {
          userId: targetUserId,
          subscriptionId: subscription.id
        });
      } else {
        // Status update only (no renewal, no plan change)
        // Update user flags to match subscription status
        // Note: past_due subscriptions still grant access (grace period handled in billing status)
        await db.execute(
          sql`UPDATE users SET is_pro = ${shouldHaveProAccess}, subscription_plan = ${shouldHaveProAccess ? planType : null}, updated_at = NOW() WHERE id = ${targetUserId}`
        );

        if (subscription.status === 'past_due') {
          console.log(`[webhook] Subscription marked as past_due - user retains access during grace period`, {
            userId: targetUserId,
            subscriptionId: subscription.id,
            currentPeriodEnd: subscription.current_period_end
          });
        }
      }

      await this.recordWebhookEvent({
        eventId,
        eventType: 'customer.subscription.updated',
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        userId: targetUserId,
        processingResult: 'success',
        rawPayload,
      });

      return { success: true, message: 'Subscription updated successfully' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.recordWebhookEvent({
        eventId,
        eventType: 'customer.subscription.updated',
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        userId: targetUserId,
        processingResult: 'failed',
        errorMessage,
        rawPayload,
      });
      throw error;
    }
  }

  /**
   * Handle customer.subscription.deleted event
   * 
   * This is called when a subscription is fully canceled (not just cancel_at_period_end).
   * We need to:
   * 1. Mark subscription as canceled
   * 2. Remove pro access from user
   */
  async handleSubscriptionDeleted(
    subscription: Stripe.Subscription,
    eventId: string,
    rawPayload?: string
  ): Promise<{ success: boolean; message: string }> {
    // Check idempotency
    if (await this.isEventProcessed(eventId)) {
      console.log('[webhook] Subscription deleted event already processed', { eventId, subscriptionId: subscription.id });
      return { success: true, message: 'Event already processed' };
    }

    const customerId = subscription.customer as string;
    const metadataUserId = subscription.metadata?.userId;

    console.log('[webhook] Processing subscription.deleted', {
      eventId,
      subscriptionId: subscription.id,
      customerId,
      userIdFromMetadata: metadataUserId,
    });

    try {
      // Find user - try multiple methods (need userId before upserting)
      let userId: string | undefined = metadataUserId;
      
      if (!userId) {
        // Try by customer ID
        const userResult = await db.execute(
          sql`SELECT id FROM users WHERE stripe_customer_id = ${customerId} LIMIT 1`
        );
        userId = userResult.rows[0]?.id as string | undefined;
      }

      if (!userId) {
        // Try by subscription ID
        const userResult = await db.execute(
          sql`SELECT id FROM users WHERE stripe_subscription_id = ${subscription.id} LIMIT 1`
        );
        userId = userResult.rows[0]?.id as string | undefined;
      }

      if (!userId) {
        // Try from existing subscription record
        const existingSub = await this.getSubscriptionByStripeId(subscription.id);
        userId = existingSub?.userId;
      }

      // Get existing subscription to preserve period data if not in Stripe object
      const existingSubscription = await this.getSubscriptionByStripeId(subscription.id);

      // Use upsertSubscription to properly update ALL fields including period dates
      // This preserves current_period_start and current_period_end which are needed
      // to show when the subscription access ends
      await this.upsertSubscription(
        {
          userId: userId || existingSubscription?.userId || '',
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
          status: 'canceled',
          plan: existingSubscription?.plan || subscription.metadata?.planType || 'pro',
          // Preserve period dates from Stripe subscription, or fall back to existing record
          currentPeriodStart: subscription.current_period_start
            ? new Date(subscription.current_period_start * 1000)
            : existingSubscription?.currentPeriodStart ?? undefined,
          currentPeriodEnd: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000)
            : existingSubscription?.currentPeriodEnd ?? undefined,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          canceledAt: subscription.canceled_at
            ? new Date(subscription.canceled_at * 1000)
            : new Date(),
        },
        eventId,
        'customer.subscription.deleted'
      );

      if (userId) {
        await db.execute(
          sql`UPDATE users SET is_pro = false, subscription_plan = NULL, stripe_subscription_id = NULL, updated_at = NOW() WHERE id = ${userId}`
        );
        console.log('[webhook] User pro access revoked', { userId, subscriptionId: subscription.id });
      } else {
        console.warn('[webhook] Could not find user to revoke pro access', { 
          customerId, 
          subscriptionId: subscription.id 
        });
      }

      await this.recordWebhookEvent({
        eventId,
        eventType: 'customer.subscription.deleted',
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        userId,
        processingResult: 'success',
        rawPayload,
      });

      return { success: true, message: 'Subscription deleted successfully' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.recordWebhookEvent({
        eventId,
        eventType: 'customer.subscription.deleted',
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        processingResult: 'failed',
        errorMessage,
        rawPayload,
      });
      throw error;
    }
  }

  // ==========================================
  // Test Mode Support
  // ==========================================

  /**
   * Activate billing for a test user (ONLY in test mode)
   * This simulates a successful checkout without hitting Stripe
   */
  async activateTestBilling(
    userId: string,
    plan: 'pro' | 'crew' = 'pro'
  ): Promise<{ success: boolean; message: string }> {
    // Guard: Only allow in test mode
    if (process.env.PAYMENTS_MODE !== 'test') {
      return { success: false, message: 'Test billing only available in PAYMENTS_MODE=test' };
    }

    const testCustomerId = `cus_test_${userId}`;
    const testSubscriptionId = `sub_test_${userId}_${Date.now()}`;
    const testEventId = `evt_test_${Date.now()}`;
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Create subscription record
    await this.upsertSubscription(
      {
        userId,
        stripeCustomerId: testCustomerId,
        stripeSubscriptionId: testSubscriptionId,
        status: 'active',
        plan,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
      testEventId,
      'test.billing.activated'
    );

    // Update user flags
    await db.execute(
      sql`UPDATE users SET stripe_customer_id = ${testCustomerId}, stripe_subscription_id = ${testSubscriptionId}, is_pro = true, subscription_plan = ${plan}, updated_at = NOW() WHERE id = ${userId}`
    );

    return { success: true, message: `Test ${plan} subscription activated` };
  }

  /**
   * Deactivate test billing
   */
  async deactivateTestBilling(userId: string): Promise<{ success: boolean; message: string }> {
    // Guard: Only allow in test mode
    if (process.env.PAYMENTS_MODE !== 'test') {
      return { success: false, message: 'Test billing only available in PAYMENTS_MODE=test' };
    }

    // Find and cancel subscription
    const subscription = await this.getSubscriptionByUserId(userId);
    if (subscription?.stripeSubscriptionId?.startsWith('sub_test_')) {
      await db.execute(
        sql`UPDATE subscriptions SET status = 'canceled', canceled_at = NOW(), updated_at = NOW() WHERE id = ${subscription.id}`
      );
    }

    // Update user flags
    await db.execute(
      sql`UPDATE users SET is_pro = false, subscription_plan = NULL, stripe_subscription_id = NULL, updated_at = NOW() WHERE id = ${userId}`
    );

    return { success: true, message: 'Test billing deactivated' };
  }
}

export const billingService = new BillingService();
