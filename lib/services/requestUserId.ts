import type { NextRequest } from "next/server";
import { auth as clerkAuth } from "@clerk/nextjs/server";
import { getQAUserIdFromRequest } from "@/lib/services/qaSession";

/**
 * Best-effort userId resolution:
 * - Prefer Clerk auth when configured
 * - Fall back to QA cookie auth only when EMAIL_MODE=test
 */
export async function getRequestUserId(request: NextRequest): Promise<string | null> {
  // Clerk auth (preferred in real environments)
  try {
    const { userId } = await clerkAuth();
    if (userId) return userId;
  } catch {
    // Clerk not configured or not available in this environment
  }

  // QA cookie auth (test-only)
  return getQAUserIdFromRequest(request);
}

