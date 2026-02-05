-- Add line_items column for multi-service proposals
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS line_items JSONB;

-- Add is_multi_service flag
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS is_multi_service BOOLEAN DEFAULT FALSE NOT NULL;
