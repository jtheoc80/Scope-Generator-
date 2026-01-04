/**
 * Development Startup Schema Check
 * 
 * This module can be imported during development server startup
 * to warn about missing columns before requests start failing.
 * 
 * Usage in a dev startup file or db.ts:
 *   import { checkSchemaOnStartup } from '@/scripts/check-schema';
 *   if (process.env.NODE_ENV === 'development') {
 *     checkSchemaOnStartup();
 *   }
 */

import pg from "pg";

const { Pool } = pg;

interface ExpectedColumn {
  table: string;
  column: string;
}

// Critical columns that must exist
const CRITICAL_COLUMNS: ExpectedColumn[] = [
  { table: "proposals", column: "scope_sections" },
];

let hasChecked = false;

export async function checkSchemaOnStartup(): Promise<void> {
  // Only check once per process
  if (hasChecked) return;
  hasChecked = true;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn("⚠️  DATABASE_URL not set - skipping schema check");
    return;
  }

  const isSupabaseOrNeon =
    databaseUrl.includes("supabase.com") || databaseUrl.includes("neon.tech");
  const isDev = process.env.NODE_ENV === "development";

  const pool = new Pool({
    connectionString: databaseUrl,
    // For Supabase/Neon we sometimes need to relax SSL validation in development
    // because of how their certificates are presented. Never disable certificate
    // validation in production to avoid man-in-the-middle vulnerabilities.
    ssl: isSupabaseOrNeon
      ? isDev
        ? { rejectUnauthorized: false }
        : { rejectUnauthorized: true }
      : false,
    connectionTimeoutMillis: 5000,
  });

  try {
    const missingColumns: string[] = [];

    for (const { table, column } of CRITICAL_COLUMNS) {
      const result = await pool.query(
        `
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = $1 
          AND column_name = $2
        `,
        [table, column]
      );

      if (result.rows.length === 0) {
        missingColumns.push(`${table}.${column}`);
      }
    }

    if (missingColumns.length > 0) {
      console.warn("\n" + "=".repeat(60));
      console.warn("⚠️  SCHEMA WARNING: Missing database columns detected!");
      console.warn("=".repeat(60));
      console.warn("Missing columns:");
      missingColumns.forEach((col) => console.warn(`   - ${col}`));
      console.warn("\nRun migrations to fix:");
      console.warn("   npm run db:migrate");
      console.warn("=".repeat(60) + "\n");
    }
  } catch (error) {
    // Don't crash the app on schema check failure
    console.warn("⚠️  Schema check failed:", error instanceof Error ? error.message : error);
  } finally {
    await pool.end();
  }
}
