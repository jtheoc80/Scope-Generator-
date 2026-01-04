-- Migration: Ensure scope_sections column exists with NOT NULL constraint
-- Description: This migration ensures the scope_sections column exists on proposals
-- and sets a default of empty array. This fixes schema drift where the column
-- may have been added without proper constraints.
--
-- This migration is idempotent - safe to run multiple times.

-- Step 1: Add column if it doesn't exist (idempotent)
ALTER TABLE "proposals"
ADD COLUMN IF NOT EXISTS "scope_sections" jsonb;

-- Step 2: Update any existing NULL values to empty array
UPDATE "proposals" 
SET "scope_sections" = '[]'::jsonb 
WHERE "scope_sections" IS NULL;

-- Step 3: Set default for future inserts
ALTER TABLE "proposals" 
ALTER COLUMN "scope_sections" SET DEFAULT '[]'::jsonb;

-- Step 4: Add NOT NULL constraint (requires all existing values to be non-null)
-- Note: This is safe because we just set all NULLs to []
ALTER TABLE "proposals"
ALTER COLUMN "scope_sections" SET NOT NULL;

-- Verification (will fail if something went wrong)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'proposals' 
      AND column_name = 'scope_sections'
      AND is_nullable = 'NO'
  ) THEN
    RAISE EXCEPTION 'scope_sections column verification failed';
  END IF;
END $$;
