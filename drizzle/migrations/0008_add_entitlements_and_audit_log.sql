-- Migration: Add entitlements system and audit log
-- This migration adds role-based access control and audit logging for entitlement changes

-- Add role column to users table (for admin access)
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user';

-- Add entitlements array column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS entitlements TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Create audit_log table for tracking entitlement changes
CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  actor_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  actor_email VARCHAR(255),
  target_user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_user_email VARCHAR(255),
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_value VARCHAR(100),
  previous_value VARCHAR(255),
  new_value VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for audit_log table
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_target ON audit_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);

-- Add comment explaining the entitlements system
COMMENT ON COLUMN users.role IS 'Platform admin role: user | admin';
COMMENT ON COLUMN users.entitlements IS 'Array of entitlements: CREW_ACCESS, CREW_PAYOUT, ADMIN_USERS, SEARCH_CONSOLE';
COMMENT ON TABLE audit_log IS 'Audit trail for entitlement and role changes';
