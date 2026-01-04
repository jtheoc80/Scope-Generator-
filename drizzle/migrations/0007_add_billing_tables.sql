-- Migration: Add Billing Tables for Single Source of Truth
-- Description: Creates subscriptions, webhook_events, and credit_transactions tables
-- This provides a canonical billing status that UI should read from

-- ==========================================
-- Subscriptions table - Single source of truth for billing status
-- ==========================================
CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "stripe_customer_id" varchar NOT NULL,
  "stripe_subscription_id" varchar UNIQUE,
  "stripe_price_id" varchar,
  "status" varchar(30) NOT NULL DEFAULT 'active',
  "plan" varchar(20) NOT NULL DEFAULT 'pro',
  "current_period_start" timestamp,
  "current_period_end" timestamp,
  "trial_start" timestamp,
  "trial_end" timestamp,
  "cancel_at_period_end" boolean NOT NULL DEFAULT false,
  "canceled_at" timestamp,
  "last_webhook_event_id" varchar,
  "last_updated_by_event" varchar(50),
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Indexes for subscriptions
CREATE INDEX IF NOT EXISTS "idx_subscriptions_user" ON "subscriptions" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_subscriptions_stripe_customer" ON "subscriptions" ("stripe_customer_id");
CREATE INDEX IF NOT EXISTS "idx_subscriptions_stripe_subscription" ON "subscriptions" ("stripe_subscription_id");
CREATE INDEX IF NOT EXISTS "idx_subscriptions_status" ON "subscriptions" ("status");

-- ==========================================
-- Webhook Events table - Idempotency tracking for Stripe webhooks
-- ==========================================
CREATE TABLE IF NOT EXISTS "webhook_events" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "event_id" varchar(255) NOT NULL UNIQUE,
  "event_type" varchar(100) NOT NULL,
  "processed_at" timestamp DEFAULT now(),
  "processing_result" varchar(20) NOT NULL DEFAULT 'success',
  "stripe_customer_id" varchar,
  "stripe_subscription_id" varchar,
  "user_id" varchar,
  "error_message" text,
  "raw_payload" text,
  "created_at" timestamp DEFAULT now()
);

-- Indexes for webhook_events
CREATE INDEX IF NOT EXISTS "idx_webhook_events_event_id" ON "webhook_events" ("event_id");
CREATE INDEX IF NOT EXISTS "idx_webhook_events_type" ON "webhook_events" ("event_type");
CREATE INDEX IF NOT EXISTS "idx_webhook_events_created" ON "webhook_events" ("created_at");

-- ==========================================
-- Credit Transactions table - One-time credit purchases
-- ==========================================
CREATE TABLE IF NOT EXISTS "credit_transactions" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "stripe_payment_intent_id" varchar,
  "stripe_checkout_session_id" varchar,
  "product_type" varchar(30) NOT NULL,
  "credits_added" integer NOT NULL,
  "amount_paid" integer NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'completed',
  "created_at" timestamp DEFAULT now(),
  "expires_at" timestamp
);

-- Indexes for credit_transactions
CREATE INDEX IF NOT EXISTS "idx_credit_transactions_user" ON "credit_transactions" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_credit_transactions_session" ON "credit_transactions" ("stripe_checkout_session_id");

-- ==========================================
-- Migrate existing subscription data from users table (if any)
-- ==========================================
INSERT INTO "subscriptions" ("user_id", "stripe_customer_id", "stripe_subscription_id", "status", "plan")
SELECT 
  "id" as "user_id",
  "stripe_customer_id",
  "stripe_subscription_id",
  CASE WHEN "is_pro" = true THEN 'active' ELSE 'canceled' END as "status",
  COALESCE("subscription_plan", 'pro') as "plan"
FROM "users"
WHERE "stripe_customer_id" IS NOT NULL 
  AND "stripe_subscription_id" IS NOT NULL
ON CONFLICT ("stripe_subscription_id") DO NOTHING;
