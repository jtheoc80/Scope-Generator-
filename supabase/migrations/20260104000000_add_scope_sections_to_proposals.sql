-- Migration: Add scope_sections column to proposals table
-- Bug fix: Resolves Postgres error 42703 "column 'scope_sections' of relation 'proposals' does not exist"
-- 
-- Context: The Drizzle schema includes this column but it was missing from the actual database.
-- This migration ensures the database schema matches the application code expectations.
--
-- The scope_sections column stores structured scope sections (grouped for display)
-- as JSONB arrays like: [{ "title": "Demolition", "items": ["Remove existing tile", ...] }, ...]

ALTER TABLE public.proposals
ADD COLUMN IF NOT EXISTS scope_sections jsonb DEFAULT NULL;

-- Note: The column is nullable because:
-- 1. Existing proposals don't have this data
-- 2. Not all proposals use structured scope sections (legacy/desktop proposals use flat scope array)

COMMENT ON COLUMN public.proposals.scope_sections IS 
  'Optional structured scope sections for grouped display. Format: [{ title: string, items: string[] }]';
