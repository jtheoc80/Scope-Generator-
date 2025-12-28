-- Migration: Similar Job Retrieval (Phase 1) using pgvector
-- Description:
-- - Stores S3 photos + photo/job embeddings in Postgres (Supabase) using pgvector
-- - Adds ANN index for fast similarity search
-- - Adds RPC `match_jobs(query_embedding, k)` for cosine similarity
-- - Adds tables for scope snapshots + user edits + outcomes flywheel

-- ==========================================
-- Extensions
-- ==========================================
CREATE EXTENSION IF NOT EXISTS vector;

-- ==========================================
-- Tables
-- ==========================================

-- Photos stored in S3 (one row per uploaded photo)
CREATE TABLE IF NOT EXISTS "photos" (
  "id" bigserial PRIMARY KEY,
  "job_id" integer NOT NULL REFERENCES "mobile_jobs"("id") ON DELETE CASCADE,
  "s3_key" text NOT NULL,
  "created_at" timestamptz DEFAULT now()
);

-- Photo-level embeddings (one row per photo per model)
CREATE TABLE IF NOT EXISTS "photo_embeddings" (
  "photo_id" bigint NOT NULL REFERENCES "photos"("id") ON DELETE CASCADE,
  "job_id" integer NOT NULL REFERENCES "mobile_jobs"("id") ON DELETE CASCADE,
  "embedding" vector(1536) NOT NULL,
  "model" text NOT NULL,
  "created_at" timestamptz DEFAULT now(),
  PRIMARY KEY ("photo_id", "model")
);

-- Job-level embedding (aggregated from photo embeddings)
CREATE TABLE IF NOT EXISTS "job_embeddings" (
  "job_id" integer PRIMARY KEY REFERENCES "mobile_jobs"("id") ON DELETE CASCADE,
  "embedding" vector(1536) NOT NULL,
  "model" text NOT NULL,
  "updated_at" timestamptz DEFAULT now()
);

-- Final scope line items (snapshot per job)
CREATE TABLE IF NOT EXISTS "scope_line_items" (
  "id" bigserial PRIMARY KEY,
  "job_id" integer NOT NULL REFERENCES "mobile_jobs"("id") ON DELETE CASCADE,
  "source" text NOT NULL, -- e.g. 'ai', 'user', 'sent', 'final'
  "item_code" text NOT NULL, -- stable identifier for dedupe (hash/sku)
  "description" text NOT NULL,
  "qty" numeric,
  "unit" text,
  "price" numeric,
  "created_at" timestamptz DEFAULT now()
);

-- User edits to scope (for flywheel dataset)
CREATE TABLE IF NOT EXISTS "scope_edits" (
  "id" bigserial PRIMARY KEY,
  "job_id" integer NOT NULL REFERENCES "mobile_jobs"("id") ON DELETE CASCADE,
  "action" text NOT NULL, -- add/remove/edit
  "item_code" text,
  "before_json" jsonb,
  "after_json" jsonb,
  "created_at" timestamptz DEFAULT now()
);

-- Outcome tracking (for weighting/learning)
CREATE TABLE IF NOT EXISTS "job_outcomes" (
  "job_id" integer PRIMARY KEY REFERENCES "mobile_jobs"("id") ON DELETE CASCADE,
  "status" text NOT NULL DEFAULT 'created', -- created/sent/accepted/won/lost
  "final_price" numeric,
  "sent_at" timestamptz,
  "accepted_at" timestamptz,
  "won_at" timestamptz,
  "lost_at" timestamptz,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

-- Minimal async queue to compute embeddings without blocking the UI
CREATE TABLE IF NOT EXISTS "job_embedding_jobs" (
  "id" bigserial PRIMARY KEY,
  "job_id" integer NOT NULL REFERENCES "mobile_jobs"("id") ON DELETE CASCADE,
  "status" text NOT NULL DEFAULT 'pending', -- pending/processing/done/failed
  "attempts" integer NOT NULL DEFAULT 0,
  "next_attempt_at" timestamptz,
  "locked_by" text,
  "locked_at" timestamptz,
  "started_at" timestamptz,
  "finished_at" timestamptz,
  "error" text,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

-- ==========================================
-- Indexes
-- ==========================================
CREATE INDEX IF NOT EXISTS "idx_photos_job" ON "photos" ("job_id");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_photos_job_s3_key" ON "photos" ("job_id", "s3_key");

CREATE INDEX IF NOT EXISTS "idx_photo_embeddings_job" ON "photo_embeddings" ("job_id");
CREATE INDEX IF NOT EXISTS "idx_scope_line_items_job" ON "scope_line_items" ("job_id");
CREATE INDEX IF NOT EXISTS "idx_scope_line_items_code" ON "scope_line_items" ("item_code");
CREATE INDEX IF NOT EXISTS "idx_scope_edits_job" ON "scope_edits" ("job_id");
CREATE INDEX IF NOT EXISTS "idx_job_embedding_jobs_status_next" ON "job_embedding_jobs" ("status", "next_attempt_at");

-- ANN index for fast cosine similarity search
-- Note: ivfflat requires `ANALYZE job_embeddings;` after data loads for best recall.
CREATE INDEX IF NOT EXISTS "idx_job_embeddings_embedding_ivfflat"
  ON "job_embeddings"
  USING ivfflat ("embedding" vector_cosine_ops)
  WITH (lists = 100);

-- ==========================================
-- Row Level Security (RLS) Policies
-- ==========================================
-- These policies assume mobile_jobs.user_id maps to auth.uid()::text (consistent with existing migrations).

ALTER TABLE "photos" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own photos"
  ON "photos"
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM "mobile_jobs" j
    WHERE j.id = photos.job_id AND j.user_id = auth.uid()::text
  ));
CREATE POLICY "Users can insert photos for own jobs"
  ON "photos"
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM "mobile_jobs" j
    WHERE j.id = photos.job_id AND j.user_id = auth.uid()::text
  ));
CREATE POLICY "Users can delete photos for own jobs"
  ON "photos"
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM "mobile_jobs" j
    WHERE j.id = photos.job_id AND j.user_id = auth.uid()::text
  ));

ALTER TABLE "photo_embeddings" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own photo embeddings"
  ON "photo_embeddings"
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM "mobile_jobs" j
    WHERE j.id = photo_embeddings.job_id AND j.user_id = auth.uid()::text
  ));

ALTER TABLE "job_embeddings" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own job embeddings"
  ON "job_embeddings"
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM "mobile_jobs" j
    WHERE j.id = job_embeddings.job_id AND j.user_id = auth.uid()::text
  ));

ALTER TABLE "scope_line_items" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own scope line items"
  ON "scope_line_items"
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM "mobile_jobs" j
    WHERE j.id = scope_line_items.job_id AND j.user_id = auth.uid()::text
  ));
CREATE POLICY "Users can insert scope line items for own jobs"
  ON "scope_line_items"
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM "mobile_jobs" j
    WHERE j.id = scope_line_items.job_id AND j.user_id = auth.uid()::text
  ));

ALTER TABLE "scope_edits" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own scope edits"
  ON "scope_edits"
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM "mobile_jobs" j
    WHERE j.id = scope_edits.job_id AND j.user_id = auth.uid()::text
  ));
CREATE POLICY "Users can insert scope edits for own jobs"
  ON "scope_edits"
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM "mobile_jobs" j
    WHERE j.id = scope_edits.job_id AND j.user_id = auth.uid()::text
  ));

ALTER TABLE "job_outcomes" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own job outcomes"
  ON "job_outcomes"
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM "mobile_jobs" j
    WHERE j.id = job_outcomes.job_id AND j.user_id = auth.uid()::text
  ));
CREATE POLICY "Users can update own job outcomes"
  ON "job_outcomes"
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM "mobile_jobs" j
    WHERE j.id = job_outcomes.job_id AND j.user_id = auth.uid()::text
  ));
CREATE POLICY "Users can insert own job outcomes"
  ON "job_outcomes"
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM "mobile_jobs" j
    WHERE j.id = job_outcomes.job_id AND j.user_id = auth.uid()::text
  ));

ALTER TABLE "job_embedding_jobs" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own embedding jobs"
  ON "job_embedding_jobs"
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM "mobile_jobs" j
    WHERE j.id = job_embedding_jobs.job_id AND j.user_id = auth.uid()::text
  ));

-- ==========================================
-- Similarity Search RPC
-- ==========================================
-- Returns top K similar jobs for the caller (RLS-aware via mobile_jobs ownership).
CREATE OR REPLACE FUNCTION match_jobs(
  query_embedding vector(1536),
  k integer
)
RETURNS TABLE(job_id integer, similarity float)
LANGUAGE sql
STABLE
AS $$
  SELECT
    je.job_id,
    (1 - (je.embedding <=> query_embedding))::float AS similarity
  FROM job_embeddings je
  JOIN mobile_jobs j ON j.id = je.job_id
  WHERE j.user_id = auth.uid()::text
  ORDER BY je.embedding <=> query_embedding
  LIMIT GREATEST(1, LEAST(k, 50));
$$;

