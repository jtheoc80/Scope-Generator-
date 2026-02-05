-- Credit Ledger Table
-- Provides full audit trail for all credit changes (grants, deductions, refunds)
-- This is critical for debugging, disputes, and financial reconciliation

CREATE TABLE IF NOT EXISTS credit_ledger (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Transaction details
  change_amount INTEGER NOT NULL, -- Positive for grants, negative for deductions
  balance_after INTEGER NOT NULL, -- Credit balance after this transaction
  source VARCHAR(50) NOT NULL, -- 'subscription', 'pack', 'manual', 'refund', 'deduction', 'expiration'
  reference_id VARCHAR(255), -- Stripe subscription ID, transaction ID, proposal ID, etc.
  reference_type VARCHAR(50), -- 'subscription', 'checkout_session', 'proposal', 'admin', etc.
  
  -- Metadata
  description TEXT, -- Human-readable description
  metadata JSONB, -- Additional context (plan type, renewal period, etc.)
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_credit_ledger_user ON credit_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_created ON credit_ledger(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_reference ON credit_ledger(reference_id, reference_type);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_source ON credit_ledger(source);

-- Add comment
COMMENT ON TABLE credit_ledger IS 'Full audit trail of all credit changes for financial reconciliation and debugging';
