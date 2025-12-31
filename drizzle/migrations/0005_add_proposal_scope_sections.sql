-- Migration: Add structured scope sections to proposals
-- Description: Adds optional JSONB column to store grouped scope sections for proposal rendering.

ALTER TABLE "proposals"
ADD COLUMN IF NOT EXISTS "scope_sections" jsonb;

