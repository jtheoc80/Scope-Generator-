import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// Create pool only if DATABASE_URL is available
// This allows the build to succeed without DATABASE_URL
let pool: pg.Pool | undefined;
let db: ReturnType<typeof drizzle<typeof schema>> | undefined;

function initializeDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }
  
  if (!pool) {
    // Configure pool with SSL for Supabase/Neon compatibility
    pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      // Enable SSL for production databases (Supabase, Neon)
      ssl: process.env.DATABASE_URL.includes('supabase.com') || 
           process.env.DATABASE_URL.includes('neon.tech') ||
           process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
    });
  }
  
  if (!db) {
    db = drizzle(pool, { schema });
  }
  
  return { pool, db };
}

// Create a proxy that initializes on first access
const dbProxy = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(target, prop, receiver) {
    const { db: database } = initializeDb();
    const value = (database as any)[prop];
    if (typeof value === 'function') {
      return value.bind(database);
    }
    return value;
  }
});

const poolProxy = new Proxy({} as pg.Pool, {
  get(target, prop, receiver) {
    const { pool: poolInstance } = initializeDb();
    const value = (poolInstance as any)[prop];
    if (typeof value === 'function') {
      return value.bind(poolInstance);
    }
    return value;
  }
});

export { poolProxy as pool, dbProxy as db };
