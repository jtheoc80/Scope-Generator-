-- Migration: Ensure job_embeddings.model exists
-- Purpose:
-- - Fix runtime error 42703: column "model" does not exist
-- - Keep job embedding records tagged with the embedding model

DO $$
BEGIN
  -- If the table doesn't exist, don't fail this migration (feature is optional).
  IF to_regclass('public.job_embeddings') IS NULL THEN
    RETURN;
  END IF;

  ALTER TABLE public.job_embeddings
    ADD COLUMN IF NOT EXISTS model text;

  ALTER TABLE public.job_embeddings
    ALTER COLUMN model SET DEFAULT 'text-embedding-3-small';

  UPDATE public.job_embeddings
  SET model = 'text-embedding-3-small'
  WHERE model IS NULL;

  ALTER TABLE public.job_embeddings
    ALTER COLUMN model SET NOT NULL;
END $$;

