/**
 * Database Information & Schema Verification Script
 * 
 * This script connects to the database specified by DATABASE_URL and:
 * 1. Prints database connection info (masked credentials)
 * 2. Verifies expected columns exist (e.g., scope_sections on proposals)
 * 3. Can be run as a pre-deploy check or debugging aid
 * 
 * Usage:
 *   npx tsx scripts/db-info.ts
 *   npm run db:check
 */

import pg from "pg";

const { Pool } = pg;

// Mask sensitive parts of DATABASE_URL for logging
function maskDatabaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Mask password but show user/host/db for debugging
    const masked = `${parsed.protocol}//${parsed.username}:****@${parsed.host}${parsed.pathname}`;
    return masked;
  } catch {
    // If URL parsing fails, just show first/last chars
    if (url.length > 20) {
      return url.substring(0, 10) + "****" + url.substring(url.length - 10);
    }
    return "****";
  }
}

// Extract Supabase project ref from URL if present
function getSupabaseProjectRef(url: string): string | null {
  try {
    const parsed = new URL(url);
    // Supabase URLs are like: db.<project-ref>.supabase.co
    const hostParts = parsed.host.split(".");
    if (hostParts.length >= 3 && parsed.host.includes("supabase")) {
      return hostParts[1]; // The project ref
    }
    return null;
  } catch {
    return null;
  }
}

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

interface ExpectedColumn {
  table: string;
  column: string;
  expectedType?: string;
}

// Columns that MUST exist for the app to function
const EXPECTED_COLUMNS: ExpectedColumn[] = [
  { table: "proposals", column: "scope_sections", expectedType: "jsonb" },
  { table: "proposals", column: "scope" },
  { table: "proposals", column: "options" },
  { table: "proposals", column: "line_items" },
];

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL is not set!");
    console.error("   Please set DATABASE_URL in your environment.");
    process.exit(1);
  }

  console.log("=".repeat(60));
  console.log("Database Information & Schema Verification");
  console.log("=".repeat(60));
  console.log();

  // Print masked URL info
  console.log("📌 Connection Info:");
  console.log(`   URL (masked): ${maskDatabaseUrl(databaseUrl)}`);
  
  const projectRef = getSupabaseProjectRef(databaseUrl);
  if (projectRef) {
    console.log(`   Supabase Project: ${projectRef}`);
  }
  console.log();

  // Connect to database
  // NOTE: For Supabase/Neon we enable SSL. In development/test we allow
  // `rejectUnauthorized: false` for convenience, but in all other
  // environments we use secure SSL with certificate verification.
  // Do not run this script against production databases from untrusted networks.
  const isManagedHostedDb =
    databaseUrl.includes("supabase.com") || databaseUrl.includes("neon.tech");
  const isDevLikeEnv =
    process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";

  // SECURITY NOTE: For maximum security, set DB_SSL_CA env var with
  // your database's CA certificate to enable proper certificate validation.
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: isManagedHostedDb
      ? {
          rejectUnauthorized: process.env.DB_SSL_CA ? true : isDevLikeEnv ? false : true,
          ca: process.env.DB_SSL_CA || undefined,
        }
      : false,
    connectionTimeoutMillis: 10000,
  });

  try {
    // Get basic database info
    console.log("📊 Database Details:");
    
    const dbInfoResult = await pool.query(`
      SELECT 
        current_database() as database,
        current_schema() as schema,
        inet_server_addr() as server_ip,
        inet_server_port() as server_port,
        version() as version
    `);
    
    const dbInfo = dbInfoResult.rows[0];
    console.log(`   Database: ${dbInfo.database}`);
    console.log(`   Schema: ${dbInfo.schema}`);
    console.log(`   Server: ${dbInfo.server_ip || "N/A"}:${dbInfo.server_port || "N/A"}`);
    console.log(`   Version: ${dbInfo.version?.split(",")[0] || "N/A"}`);
    console.log();

    // Check expected columns
    console.log("🔍 Schema Verification:");
    let allColumnsExist = true;

    for (const { table, column, expectedType } of EXPECTED_COLUMNS) {
      const columnResult = await pool.query<ColumnInfo>(
        `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = $1 
          AND column_name = $2
        `,
        [table, column]
      );

      if (columnResult.rows.length === 0) {
        console.log(`   ❌ ${table}.${column} - MISSING!`);
        allColumnsExist = false;
      } else {
        const col = columnResult.rows[0];
        const typeMatch = !expectedType || col.data_type === expectedType;
        const status = typeMatch ? "✅" : "⚠️";
        console.log(
          `   ${status} ${table}.${column} - ${col.data_type}, nullable=${col.is_nullable}, default=${col.column_default || "none"}`
        );
        if (!typeMatch) {
          console.log(`      Expected type: ${expectedType}`);
        }
      }
    }
    console.log();

    // Show all proposals columns for debugging
    console.log("📋 All columns in public.proposals:");
    const allColumnsResult = await pool.query<ColumnInfo>(
      `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'proposals'
      ORDER BY ordinal_position
      `
    );
    
    for (const col of allColumnsResult.rows) {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable=${col.is_nullable})`);
    }
    console.log();

    // Summary
    console.log("=".repeat(60));
    if (allColumnsExist) {
      console.log("✅ All expected columns exist. Schema is up to date.");
    } else {
      console.log("❌ Some columns are MISSING! Run migrations:");
      console.log("   npm run db:migrate");
    }
    console.log("=".repeat(60));

    process.exit(allColumnsExist ? 0 : 1);
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
