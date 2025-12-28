-- Migration: Add Photo Upload Sessions table for QR code "Upload from Phone" feature
-- Description: Creates a table to store temporary sessions for phone-based photo uploads
-- Security: Stores only token hashes (SHA-256), not raw tokens. Sessions expire after 20 minutes.

-- ==========================================
-- Photo Upload Sessions table
-- ==========================================
CREATE TABLE IF NOT EXISTS "photo_upload_sessions" (
  "id" varchar(36) PRIMARY KEY, -- UUID
  "job_id" integer NOT NULL REFERENCES "mobile_jobs"("id") ON DELETE CASCADE,
  "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token_hash" text NOT NULL, -- SHA-256 hash of the raw token
  "expires_at" timestamptz NOT NULL,
  "created_at" timestamptz DEFAULT now()
);

-- Indexes for photo_upload_sessions
CREATE INDEX IF NOT EXISTS "idx_photo_upload_sessions_job" ON "photo_upload_sessions" ("job_id");
CREATE INDEX IF NOT EXISTS "idx_photo_upload_sessions_user" ON "photo_upload_sessions" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_photo_upload_sessions_expires" ON "photo_upload_sessions" ("expires_at");

-- ==========================================
-- Row Level Security (RLS) Policies
-- ==========================================

-- Enable RLS on the table
ALTER TABLE "photo_upload_sessions" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own sessions
CREATE POLICY "Users can view own sessions" 
  ON "photo_upload_sessions" 
  FOR SELECT 
  USING (user_id = auth.uid()::text);

-- Policy: Users can only insert sessions for their own user_id
CREATE POLICY "Users can create own sessions" 
  ON "photo_upload_sessions" 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid()::text);

-- Policy: Users can only update their own sessions
CREATE POLICY "Users can update own sessions" 
  ON "photo_upload_sessions" 
  FOR UPDATE 
  USING (user_id = auth.uid()::text);

-- Policy: Users can only delete their own sessions
CREATE POLICY "Users can delete own sessions" 
  ON "photo_upload_sessions" 
  FOR DELETE 
  USING (user_id = auth.uid()::text);

-- Note: The API routes handle session validation via token hash,
-- not through RLS, because phone uploads don't have auth.uid().
-- The server verifies the token hash before allowing uploads.

-- ==========================================
-- Cleanup: Optional scheduled job to delete expired sessions
-- ==========================================
-- Run this periodically to clean up expired sessions:
-- DELETE FROM "photo_upload_sessions" WHERE "expires_at" < NOW();
