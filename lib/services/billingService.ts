/**
 * Billing Service - Canonical billing operations with idempotency
 * 
 * This service is the ONLY place that should modify billing state.
 * All operations are idempotent using Stripe event IDs.
 */

import { db } from './db';
import { sql } from 'drizzle-orm';
import type Stripe from 'stripe';

// ==========================================
// Inline Types (to avoid circular imports)
// ==========================================

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' | 'incomplete_expired' | 'paused' | 'none';
export type PlanType = 'free' | 'starter' | 'pro' | 'crew';

export interface BillingStatus {
  hasActiveSubscription: boolean;
  canAccessPremiumFeatures: boolean;
  plan: PlanType;
  status: SubscriptionStatus;
  currentPeriodEnd: Date | null;
  isTrialing: boolean;
  trialEndsAt: Date | null;
  availableCredits: number;
  creditsExpireAt: Date | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
}

export interface Subscription {
  id: number;
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  status: string;
  plan: string;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  trialStart: Date | null;
  trialEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  lastWebhookEventId: string | null;
  lastUpdatedByEvent: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface WebhookEvent {
  id: number;
  eventId: string;
  eventType: string;
  processedAt: Date | null;
  processingResult: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  userId: string | null;
  errorMessage: string | null;
  rawPayload: string | null;
  createdAt: Date | null;
}

export interface InsertWebhookEvent {
  eventId: string;
  eventType: string;
  processingResult?: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  userId?: string | null;
  errorMessage?: string | null;
  rawPayload?: string | null;
}

function isActiveSubscriptionStatus(status: SubscriptionStatus | string): boolean {
  return status === 'active' || status === 'trialing';
}

function calculateBillingStatus(
  subscription: Subscription | null,
  user: { proposalCredits?: number; creditsExpireAt?: Date | null; trialEndsAt?: Date | null }
): BillingStatus {
  const now = new Date();
  
  const creditsExpired = user.creditsExpireAt && new Date(user.creditsExpireAt) < now;
  const availableCredits = creditsExpired ? 0 : (user.proposalCredits || 0);
  
  const isInTrial = user.trialEndsAt && new Date(user.trialEndsAt) > now;
  
  const status = (subscription?.status || 'none') as SubscriptionStatus;
  const hasActiveSubscription = isActiveSubscriptionStatus(status);
  
  const canAccessPremiumFeatures = hasActiveSubscription || availableCredits > 0 || !!isInTrial;
  
  return {
    hasActiveSubscription,
    canAccessPremiumFeatures,
    plan: (subscription?.plan as PlanType) || 'free',
    status,
    currentPeriodEnd: subscription?.currentPeriodEnd || null,
    isTrialing: status === 'trialing',
    trialEndsAt: user.trialEndsAt ? new Date(user.trialEndsAt) : null,
    availableCredits,
    creditsExpireAt: user.creditsExpireAt ? new Date(user.creditsExpireAt) : null,
    cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd || false,
    stripeCustomerId: subscription?.stripeCustomerId || null,
  };
}

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
  // Subscription Operations
  // ==========================================

  /**
   * Get subscription by user ID
   */
  async getSubscriptionByUserId(userId: string): Promise<Subscription | null> {
    const result = await db.execute(
      sql`SELECT * FROM subscriptions WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 1`
    );
    return (result.rows[0] as Subscription) || null;
  }

  /**
   * Get subscription by Stripe customer ID
   */
  async getSubscriptionByCustomerId(customerId: string): Promise<Subscription | null> {
    const result = await db.execute(
      sql`SELECT * FROM subscriptions WHERE stripe_customer_id = ${customerId} ORDER BY created_at DESC LIMIT 1`
    );
    return (result.rows[0] as Subscription) || null;
  }

  /**
   * Get subscription by Stripe subscription ID
   */
  async getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | null> {
    const result = await db.execute(
      sql`SELECT * FROM subscriptions WHERE stripe_subscription_id = ${stripeSubscriptionId} LIMIT 1`
    );
    return (result.rows[0] as Subscription) || null;
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
  ): Promise<Subscription> {
    // Try to find existing subscription
    let existing = await this.getSubscriptionByStripeId(data.stripeSubscriptionId);
    
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
      return result.rows[0] as Subscription;
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
      return result.rows[0] as Subscription;
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
   */
  async handleCheckoutCompleted(
    session: Stripe.Checkout.Session,
    eventId: string
  ): Promise<{ success: boolean; message: string }> {
    // Check idempotency
    if (await this.isEventProcessed(eventId)) {
      return { success: true, message: 'Event already processed' };
    }

    const userId = session.metadata?.userId || session.client_reference_id;
    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;
    const productType = session.metadata?.productType;
    const planType = session.metadata?.planType;

    if (!userId) {
      await this.recordWebhookEvent({
        eventId,
        eventType: 'checkout.session.completed',
        stripeCustomerId: customerId,
        processingResult: 'failed',
        errorMessage: 'No userId in session metadata',
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
          
          // Record credit transaction
          await this.recordCreditPurchase({
            userId,
            stripeCheckoutSessionId: session.id,
            stripePaymentIntentId: session.payment_intent as string,
            productType,
            creditsAdded: credits,
            amountPaid: session.amount_total || 0,
            expiresAt: expiresAt || undefined,
          });
          
          // Also update user's credit balance (for quick access)
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
        }
      }

      // Handle subscription creation
      if (planType && subscriptionId) {
        await this.upsertSubscription(
          {
            userId,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            status: 'active',
            plan: planType,
          },
          eventId,
          'checkout.session.completed'
        );
        
        // Also update user's isPro flag (for backward compatibility)
        await db.execute(
          sql`UPDATE users SET stripe_customer_id = ${customerId}, stripe_subscription_id = ${subscriptionId}, is_pro = true, subscription_plan = ${planType}, updated_at = NOW() WHERE id = ${userId}`
        );
      }

      // Record successful processing
      await this.recordWebhookEvent({
        eventId,
        eventType: 'checkout.session.completed',
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        userId,
        processingResult: 'success',
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
      });
      throw error;
    }
  }

  /**
   * Handle customer.subscription.updated event
   */
  async handleSubscriptionUpdated(
    subscription: Stripe.Subscription,
    eventId: string
  ): Promise<{ success: boolean; message: string }> {
    // Check idempotency
    if (await this.isEventProcessed(eventId)) {
      return { success: true, message: 'Event already processed' };
    }

    const customerId = subscription.customer as string;
    const userId = subscription.metadata?.userId;
    
    // Find user by metadata or customer ID
    let targetUserId = userId;
    if (!targetUserId) {
      const userResult = await db.execute(
        sql`SELECT id FROM users WHERE stripe_customer_id = ${customerId} LIMIT 1`
      );
      targetUserId = userResult.rows[0]?.id as string | undefined;
    }

    if (!targetUserId) {
      await this.recordWebhookEvent({
        eventId,
        eventType: 'customer.subscription.updated',
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        processingResult: 'failed',
        errorMessage: 'Could not find user for subscription',
      });
      return { success: false, message: 'Could not find user for subscription' };
    }

    try {
      const isActive = isActiveSubscriptionStatus(subscription.status);
      const planType = subscription.metadata?.planType || 'pro';

      // Update subscription record
      await this.upsertSubscription(
        {
          userId: targetUserId,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
          status: subscription.status,
          plan: planType,
          currentPeriodStart: subscription.current_period_start 
            ? new Date(subscription.current_period_start * 1000) 
            : undefined,
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

      // Update user's isPro flag (backward compatibility)
      await db.execute(
        sql`UPDATE users SET is_pro = ${isActive}, subscription_plan = ${isActive ? planType : null}, updated_at = NOW() WHERE id = ${targetUserId}`
      );

      await this.recordWebhookEvent({
        eventId,
        eventType: 'customer.subscription.updated',
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        userId: targetUserId,
        processingResult: 'success',
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
      });
      throw error;
    }
  }

  /**
   * Handle customer.subscription.deleted event
   */
  async handleSubscriptionDeleted(
    subscription: Stripe.Subscription,
    eventId: string
  ): Promise<{ success: boolean; message: string }> {
    // Check idempotency
    if (await this.isEventProcessed(eventId)) {
      return { success: true, message: 'Event already processed' };
    }

    const customerId = subscription.customer as string;

    try {
      // Cancel subscription
      await this.cancelSubscription(subscription.id, eventId);

      // Find user and update isPro flag
      const userResult = await db.execute(
        sql`SELECT id FROM users WHERE stripe_customer_id = ${customerId} LIMIT 1`
      );
      const userId = userResult.rows[0]?.id as string | undefined;

      if (userId) {
        await db.execute(
          sql`UPDATE users SET is_pro = false, subscription_plan = NULL, stripe_subscription_id = NULL, updated_at = NOW() WHERE id = ${userId}`
        );
      }

      await this.recordWebhookEvent({
        eventId,
        eventType: 'customer.subscription.deleted',
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        userId,
        processingResult: 'success',
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
