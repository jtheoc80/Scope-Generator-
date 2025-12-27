-- Migration: Add Customer & Address Memory tables for Job Setup
-- Description: Creates tables for saved customers, addresses, and job setup preferences

-- ==========================================
-- Saved Customers table
-- ==========================================
CREATE TABLE IF NOT EXISTS "saved_customers" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "phone" varchar(50),
  "email" varchar(255),
  "notes" text,
  "created_at" timestamp DEFAULT now(),
  "last_used_at" timestamp DEFAULT now()
);

-- Indexes for saved_customers
CREATE INDEX IF NOT EXISTS "idx_saved_customers_user" ON "saved_customers" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_saved_customers_user_last_used" ON "saved_customers" ("user_id", "last_used_at");

-- ==========================================
-- Saved Addresses table
-- ==========================================
CREATE TABLE IF NOT EXISTS "saved_addresses" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "customer_id" integer REFERENCES "saved_customers"("id") ON DELETE SET NULL,
  "formatted" text NOT NULL,
  "street" varchar(255),
  "city" varchar(100),
  "state" varchar(50),
  "zip" varchar(20),
  "place_id" varchar(255),
  "lat" varchar(20),
  "lng" varchar(20),
  "created_at" timestamp DEFAULT now(),
  "last_used_at" timestamp DEFAULT now()
);

-- Indexes for saved_addresses
CREATE INDEX IF NOT EXISTS "idx_saved_addresses_user" ON "saved_addresses" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_saved_addresses_user_last_used" ON "saved_addresses" ("user_id", "last_used_at");
CREATE INDEX IF NOT EXISTS "idx_saved_addresses_customer" ON "saved_addresses" ("customer_id");
CREATE INDEX IF NOT EXISTS "idx_saved_addresses_place_id" ON "saved_addresses" ("user_id", "place_id");

-- ==========================================
-- Job Setup Preferences table
-- ==========================================
CREATE TABLE IF NOT EXISTS "job_setup_preferences" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "user_id" varchar NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "last_job_type" varchar(50),
  "last_customer_id" integer REFERENCES "saved_customers"("id") ON DELETE SET NULL,
  "last_address_id" integer REFERENCES "saved_addresses"("id") ON DELETE SET NULL,
  "recent_job_types" text[] DEFAULT '{}',
  "updated_at" timestamp DEFAULT now()
);

-- Index for job_setup_preferences
CREATE INDEX IF NOT EXISTS "idx_job_setup_prefs_user" ON "job_setup_preferences" ("user_id");
