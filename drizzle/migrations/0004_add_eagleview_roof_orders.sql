-- Migration: Add EagleView Roof Orders table for roofing measurements integration
-- Description: Creates table to track EagleView measurement orders for roofing jobs

-- ==========================================
-- EagleView Roof Orders table
-- ==========================================
CREATE TABLE IF NOT EXISTS "eagleview_roof_orders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "job_id" varchar NOT NULL,                              -- Link to internal job record (from mobile job flow)
  "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "address" text NOT NULL,                                -- Full address string
  "status" varchar(50) NOT NULL DEFAULT 'created',        -- created|queued|processing|completed|failed
  "eagleview_order_id" varchar(100) UNIQUE,               -- EagleView's order ID
  "eagleview_report_id" varchar(100),                     -- EagleView's report ID (when ready)
  "report_url" text,                                      -- URL to the EagleView report (when completed)
  "payload_json" jsonb,                                   -- Raw report data / event payload subset
  "roofing_measurements" jsonb,                           -- Normalized roofing measurements
  "error_message" text,                                   -- Error details if status is 'failed'
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Indexes for eagleview_roof_orders
CREATE INDEX IF NOT EXISTS "idx_eagleview_roof_orders_job_id" ON "eagleview_roof_orders" ("job_id");
CREATE INDEX IF NOT EXISTS "idx_eagleview_roof_orders_user_id" ON "eagleview_roof_orders" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_eagleview_roof_orders_status" ON "eagleview_roof_orders" ("status");
CREATE INDEX IF NOT EXISTS "idx_eagleview_roof_orders_ev_order_id" ON "eagleview_roof_orders" ("eagleview_order_id");
CREATE INDEX IF NOT EXISTS "idx_eagleview_roof_orders_created_at" ON "eagleview_roof_orders" ("created_at");

-- Add trigger to update updated_at on row changes
CREATE OR REPLACE FUNCTION update_eagleview_roof_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS eagleview_roof_orders_updated_at_trigger ON "eagleview_roof_orders";
CREATE TRIGGER eagleview_roof_orders_updated_at_trigger
  BEFORE UPDATE ON "eagleview_roof_orders"
  FOR EACH ROW
  EXECUTE FUNCTION update_eagleview_roof_orders_updated_at();
