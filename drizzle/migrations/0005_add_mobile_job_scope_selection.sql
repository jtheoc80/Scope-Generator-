-- Migration: Add mobile_jobs.scope_selection JSONB
-- Description: Persists trade-specific ScopeScan state (e.g., Driveway measurements/toggles/packages)

ALTER TABLE "mobile_jobs"
ADD COLUMN IF NOT EXISTS "scope_selection" jsonb NOT NULL DEFAULT '{}'::jsonb;

