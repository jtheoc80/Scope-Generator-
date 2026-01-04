CREATE TABLE IF NOT EXISTS "email_outbox" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "mode" varchar(20) NOT NULL DEFAULT 'test',
  "to" varchar(255) NOT NULL,
  "from" text,
  "subject" text NOT NULL,
  "text_body" text,
  "html_body" text,
  "proposal_id" integer REFERENCES "proposals"("id") ON DELETE SET NULL,
  "run_id" varchar(80),
  "attachments" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "created_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_email_outbox_proposal" ON "email_outbox" ("proposal_id");
CREATE INDEX IF NOT EXISTS "idx_email_outbox_to" ON "email_outbox" ("to");
CREATE INDEX IF NOT EXISTS "idx_email_outbox_created_at" ON "email_outbox" ("created_at");

