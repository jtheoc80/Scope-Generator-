import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Lazy initialization to defer DATABASE_URL check until runtime.
// This allows Next.js builds to succeed without requiring the env var at build time.
let _pool: Pool | null = null;
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getPool(): Pool {
  if (!_pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Please add it to your environment variables."
      );
    }
    
    // Configure pool with SSL for Supabase/Neon compatibility
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Enable SSL for production databases (Supabase, Neon)
      ssl: process.env.DATABASE_URL.includes('supabase.com') || 
           process.env.DATABASE_URL.includes('neon.tech') ||
           process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
    });
  }
  return _pool;
}

function getDb() {
  if (!_db) {
    _db = drizzle(getPool(), { schema });
  }
  return _db;
}

// Export a proxy that lazily initializes the database connection on first access
export const db: ReturnType<typeof drizzle<typeof schema>> = new Proxy(
  {} as ReturnType<typeof drizzle<typeof schema>>,
  {
    get(_target, prop: string | symbol) {
      const instance = getDb();
      const value = instance[prop as keyof typeof instance];
      // Bind methods to the instance to preserve `this` context
      if (typeof value === 'function') {
        return value.bind(instance);
      }
      return value;
    },
  }
);
