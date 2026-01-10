// Re-export from canonical lib/db.ts - this file exists for backwards compatibility
// with imports from '@/lib/services/db'. New code should import directly from '@/lib/db'.
export { db } from "@/lib/db";

// Note: pool is not exported from lib/db.ts - if needed, it should be added there
// For now, re-export from server/db.ts for backwards compatibility
export { pool } from "../../server/db";
