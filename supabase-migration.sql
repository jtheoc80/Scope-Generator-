-- ============================================
-- ScopeGen Database Migration Script
-- Run this in Supabase SQL Editor
-- ============================================

-- Sessions table (for authentication sessions)
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions (expire);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email VARCHAR UNIQUE,
  first_name VARCHAR,
  last_name VARCHAR,
  profile_image_url VARCHAR,
  is_pro BOOLEAN NOT NULL DEFAULT false,
  subscription_plan VARCHAR(20),
  stripe_customer_id VARCHAR,
  stripe_subscription_id VARCHAR,
  proposal_credits INTEGER NOT NULL DEFAULT 0,
  credits_expire_at TIMESTAMP,
  processed_sessions TEXT[] DEFAULT '{}',
  company_name VARCHAR,
  company_address TEXT,
  company_phone VARCHAR,
  company_logo TEXT,
  license_number VARCHAR,
  price_multiplier INTEGER NOT NULL DEFAULT 100,
  trade_multipliers JSONB DEFAULT '{}',
  selected_trades TEXT[] DEFAULT '{}',
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  phone VARCHAR,
  business_size VARCHAR,
  referral_source VARCHAR,
  primary_trade VARCHAR,
  years_in_business INTEGER,
  user_stripe_secret_key TEXT,
  user_stripe_enabled BOOLEAN NOT NULL DEFAULT false,
  email_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  sms_notifications_enabled BOOLEAN NOT NULL DEFAULT false,
  market_pricing_lookups INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Proposals table
CREATE TABLE IF NOT EXISTS proposals (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_name VARCHAR NOT NULL,
  address TEXT NOT NULL,
  trade_id VARCHAR NOT NULL,
  job_type_id VARCHAR NOT NULL,
  job_type_name VARCHAR NOT NULL,
  job_size INTEGER NOT NULL DEFAULT 2,
  scope TEXT[] NOT NULL,
  options JSONB NOT NULL DEFAULT '{}',
  price_low INTEGER NOT NULL,
  price_high INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  is_unlocked BOOLEAN NOT NULL DEFAULT false,
  public_token VARCHAR UNIQUE,
  accepted_at TIMESTAMP,
  accepted_by_name VARCHAR,
  accepted_by_email VARCHAR,
  signature TEXT,
  contractor_signature TEXT,
  contractor_signed_at TIMESTAMP,
  payment_link_id VARCHAR,
  payment_link_url TEXT,
  deposit_percentage INTEGER,
  deposit_amount INTEGER,
  payment_status VARCHAR(20) DEFAULT 'none',
  paid_amount INTEGER DEFAULT 0,
  stripe_payment_intent_id VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "proposals_user_id_idx" ON proposals (user_id);
CREATE INDEX IF NOT EXISTS "proposals_public_token_idx" ON proposals (public_token);

-- Companies table (for Crew plan team workspaces)
CREATE TABLE IF NOT EXISTS companies (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR NOT NULL,
  owner_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR,
  seat_limit INTEGER NOT NULL DEFAULT 3,
  extra_seats INTEGER NOT NULL DEFAULT 0,
  address TEXT,
  phone VARCHAR,
  logo TEXT,
  license_number VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "companies_owner_id_idx" ON companies (owner_id);

-- Company members table
CREATE TABLE IF NOT EXISTS company_members (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'member',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "company_members_company_id_idx" ON company_members (company_id);
CREATE INDEX IF NOT EXISTS "company_members_user_id_idx" ON company_members (user_id);

-- Invites table (for team invitations)
CREATE TABLE IF NOT EXISTS invites (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email VARCHAR NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'member',
  token VARCHAR NOT NULL UNIQUE,
  invited_by VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "invites_token_idx" ON invites (token);
CREATE INDEX IF NOT EXISTS "invites_company_id_idx" ON invites (company_id);

-- Cancellation feedback table
CREATE TABLE IF NOT EXISTS cancellation_feedback (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason VARCHAR(100) NOT NULL,
  details TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Proposal views tracking table
CREATE TABLE IF NOT EXISTS proposal_views (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  proposal_id INTEGER NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  viewer_ip VARCHAR,
  user_agent TEXT,
  duration INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "proposal_views_proposal_id_idx" ON proposal_views (proposal_id);

-- ============================================
-- Enable Row Level Security (RLS) - Optional but recommended
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE cancellation_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for service role access (your backend)
-- These allow your backend to access all data

CREATE POLICY "Service role can access all users" ON users
  FOR ALL USING (true);

CREATE POLICY "Service role can access all proposals" ON proposals
  FOR ALL USING (true);

CREATE POLICY "Service role can access all companies" ON companies
  FOR ALL USING (true);

CREATE POLICY "Service role can access all company_members" ON company_members
  FOR ALL USING (true);

CREATE POLICY "Service role can access all invites" ON invites
  FOR ALL USING (true);

CREATE POLICY "Service role can access all cancellation_feedback" ON cancellation_feedback
  FOR ALL USING (true);

CREATE POLICY "Service role can access all proposal_views" ON proposal_views
  FOR ALL USING (true);

CREATE POLICY "Service role can access all sessions" ON sessions
  FOR ALL USING (true);

-- ============================================
-- Grant permissions
-- ============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant all privileges on all tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- ============================================
-- Done! Your database is ready.
-- ============================================
