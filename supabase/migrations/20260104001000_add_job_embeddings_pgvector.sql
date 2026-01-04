-- Migration: Add pgvector + job_embeddings for similar-job scope suggestions
-- Purpose:
-- - Fix runtime error 42P01: relation "job_embeddings" does not exist
-- - Enable similarity-based scope suggestions (pgvector)

-- Supabase convention: pg extensions live in the `extensions` schema.
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Job-level embedding (aggregated from photo embeddings)
CREATE TABLE IF NOT EXISTS public.job_embeddings (
  job_id integer PRIMARY KEY REFERENCES public.mobile_jobs(id) ON DELETE CASCADE,
  embedding vector(1536) NOT NULL,
  model text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- ANN index for fast cosine similarity search
-- Note: ivfflat benefits from ANALYZE after large loads.
CREATE INDEX IF NOT EXISTS idx_job_embeddings_embedding_ivfflat
  ON public.job_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- RLS: restrict read access to job owner (matches other mobile_* policies)
ALTER TABLE public.job_embeddings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'job_embeddings'
      AND policyname = 'Users can view own job embeddings'
  ) THEN
    CREATE POLICY "Users can view own job embeddings"
      ON public.job_embeddings
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.mobile_jobs j
          WHERE j.id = job_embeddings.job_id
            AND j.user_id = auth.uid()::text
        )
      );
  END IF;
END $$;

