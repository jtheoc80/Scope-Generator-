import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const isSupabaseHostedPostgres = process.env.DATABASE_URL.includes(".supabase.co");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Supabase Postgres requires SSL (including in local dev).
  ssl: isSupabaseHostedPostgres ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(pool, { schema });
