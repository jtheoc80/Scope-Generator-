import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Please add it to your environment variables."
  );
}

// Configure pool with SSL for Supabase/Neon compatibility
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Enable SSL for production databases (Supabase, Neon)
  ssl: process.env.DATABASE_URL.includes('supabase.com') || 
       process.env.DATABASE_URL.includes('neon.tech') ||
       process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
});

export const db = drizzle(pool, { schema });
