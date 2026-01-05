/**
 * Billing Schema - Single Source of Truth for Subscription/Payment Status
 * 
 * This schema provides:
 * - subscriptions: Canonical billing status per user
 * - webhook_events: Idempotency tracking for Stripe webhooks
 * 
 * UI should ONLY read from these tables, never from cached guesses.
 */

import { sql } from 'drizzle-orm';
import {
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./schema";

// ==========================================
// Billing Subscriptions Table
// ==========================================

/**
 * Subscription statuses matching Stripe's subscription lifecycle
 */
export const subscriptionStatuses = [
  'trialing',
  'active', 
  'past_due',
  'canceled',
  'unpaid',
  'incomplete',
  'incomplete_expired',
  'paused',
] as const;

export type SubscriptionStatus = typeof subscriptionStatuses[number];

/**
 * Plan types available in the system
 */
export const planTypes = ['free', 'starter', 'pro', 'crew'] as const;
export type PlanType = typeof planTypes[number];

/**
 * Subscriptions table - Single source of truth for billing status
 * 
 * Key invariants:
 * - One active subscription per user (enforced by unique constraint on userId where status is active)
 * - All billing status checks should query this table
 * - Updated exclusively via webhook handlers (idempotently)
 */
export const subscriptions = pgTable("subscriptions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  
  // User reference
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Stripe identifiers
  stripeCustomerId: varchar("stripe_customer_id").notNull(),
  stripeSubscriptionId: varchar("stripe_subscription_id").unique(),
  stripePriceId: varchar("stripe_price_id"),
  
  // Subscription status
  status: varchar("status", { length: 30 }).notNull().default("active"),
  plan: varchar("plan", { length: 20 }).notNull().default("pro"),
  
  // Billing period
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  
  // Trial info
  trialStart: timestamp("trial_start"),
  trialEnd: timestamp("trial_end"),
  
  // Cancellation
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  canceledAt: timestamp("canceled_at"),
  
  // Metadata for debugging
  lastWebhookEventId: varchar("last_webhook_event_id"),
  lastUpdatedByEvent: varchar("last_updated_by_event", { length: 50 }),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdx: index("idx_subscriptions_user").on(table.userId),
  stripeCustomerIdx: index("idx_subscriptions_stripe_customer").on(table.stripeCustomerId),
  stripeSubscriptionIdx: index("idx_subscriptions_stripe_subscription").on(table.stripeSubscriptionId),
  statusIdx: index("idx_subscriptions_status").on(table.status),
}));

// ==========================================
// Webhook Events Table (Idempotency)
// ==========================================

/**
 * Webhook Events table - Tracks processed Stripe events for idempotency
 * 
 * Before processing any webhook, check if event_id exists.
 * This prevents duplicate processing when Stripe retries webhooks.
 */
export const webhookEvents = pgTable("webhook_events", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  
  // Stripe event identifier (e.g., "evt_1234567890")
  eventId: varchar("event_id", { length: 255 }).notNull().unique(),
  
  // Event type (e.g., "checkout.session.completed")
  eventType: varchar("event_type", { length: 100 }).notNull(),
  
  // Processing status
  processedAt: timestamp("processed_at").defaultNow(),
  processingResult: varchar("processing_result", { length: 20 }).notNull().default("success"), // success, failed, skipped
  
  // Related data for debugging
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  userId: varchar("user_id"),
  
  // Error info if processing failed
  errorMessage: text("error_message"),
  
  // Raw payload for replay/debugging (optional, can be null to save space)
  rawPayload: text("raw_payload"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  eventIdIdx: index("idx_webhook_events_event_id").on(table.eventId),
  eventTypeIdx: index("idx_webhook_events_type").on(table.eventType),
  createdAtIdx: index("idx_webhook_events_created").on(table.createdAt),
}));

// ==========================================
// One-time Purchases / Credits Table
// ==========================================

/**
 * Credit transactions - Tracks one-time credit purchases
 * Separate from subscriptions for clarity
 */
export const creditTransactions = pgTable("credit_transactions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Stripe identifiers
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  stripeCheckoutSessionId: varchar("stripe_checkout_session_id"),
  
  // Transaction details
  productType: varchar("product_type", { length: 30 }).notNull(), // 'starter', 'single', 'pack'
  creditsAdded: integer("credits_added").notNull(),
  amountPaid: integer("amount_paid").notNull(), // in cents
  
  // Status
  status: varchar("status", { length: 20 }).notNull().default("completed"), // pending, completed, refunded
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
}, (table) => ({
  userIdx: index("idx_credit_transactions_user").on(table.userId),
  sessionIdx: index("idx_credit_transactions_session").on(table.stripeCheckoutSessionId),
}));

// ==========================================
// Relations
// ==========================================

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

export const webhookEventsRelations = relations(webhookEvents, ({ one }) => ({
  user: one(users, {
    fields: [webhookEvents.userId],
    references: [users.id],
  }),
}));

export const creditTransactionsRelations = relations(creditTransactions, ({ one }) => ({
  user: one(users, {
    fields: [creditTransactions.userId],
    references: [users.id],
  }),
}));

// ==========================================
// Types
// ==========================================

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;
export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type InsertWebhookEvent = typeof webhookEvents.$inferInsert;
export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = typeof creditTransactions.$inferInsert;

// ==========================================
// Zod Schemas
// ==========================================

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: z.enum(subscriptionStatuses).optional(),
  plan: z.enum(planTypes).optional(),
});

export const selectSubscriptionSchema = createSelectSchema(subscriptions);

export const insertWebhookEventSchema = createInsertSchema(webhookEvents).omit({
  id: true,
  createdAt: true,
});

export const insertCreditTransactionSchema = createInsertSchema(creditTransactions).omit({
  id: true,
  createdAt: true,
});

// ==========================================
// Helper Types for Billing Status
// ==========================================

/**
 * Canonical billing status returned to UI
 * This is what components should use to determine access
 */
export interface BillingStatus {
  // Access flags
  hasActiveSubscription: boolean;
  canAccessPremiumFeatures: boolean;
  
  // Subscription details (if any)
  plan: PlanType;
  status: SubscriptionStatus | 'none';
  currentPeriodEnd: Date | null;
  
  // Trial info
  isTrialing: boolean;
  trialEndsAt: Date | null;
  
  // Credits (for one-time purchases)
  availableCredits: number;
  creditsExpireAt: Date | null;
  
  // Cancellation
  cancelAtPeriodEnd: boolean;
  
  // For debugging/display
  stripeCustomerId: string | null;
}

/**
 * Check if a subscription status grants access
 */
export function isActiveSubscriptionStatus(status: SubscriptionStatus | 'none'): boolean {
  return status === 'active' || status === 'trialing';
}

/**
 * Calculate billing status from subscription and user data
 */
export function calculateBillingStatus(
  subscription: Subscription | null,
  user: { proposalCredits?: number; creditsExpireAt?: Date | null; trialEndsAt?: Date | null }
): BillingStatus {
  const now = new Date();
  
  // Check credits
  const creditsExpired = user.creditsExpireAt && new Date(user.creditsExpireAt) < now;
  const availableCredits = creditsExpired ? 0 : (user.proposalCredits || 0);
  
  // Check trial
  const isInTrial = user.trialEndsAt && new Date(user.trialEndsAt) > now;
  
  // Determine status
  const status = subscription?.status as SubscriptionStatus || 'none';
  const hasActiveSubscription = isActiveSubscriptionStatus(status);
  
  // Can access premium if:
  // 1. Has active subscription
  // 2. Has available credits
  // 3. Is in trial period
  const canAccessPremiumFeatures = hasActiveSubscription || availableCredits > 0 || isInTrial;
  
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
