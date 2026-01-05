-- Add storage + derivative fields for proposal photos
-- Supports a robust: upload -> persist -> refresh-safe render pipeline

ALTER TABLE proposal_photos
  ADD COLUMN IF NOT EXISTS storage_key text,
  ADD COLUMN IF NOT EXISTS thumb_key text,
  ADD COLUMN IF NOT EXISTS medium_key text,
  ADD COLUMN IF NOT EXISTS thumb_url text,
  ADD COLUMN IF NOT EXISTS medium_url text;

