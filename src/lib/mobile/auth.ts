import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { jsonError } from "./observability";

export type MobileAuthResult =
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse };

/**
 * Mobile auth supports two modes:
 * - Production/web: Clerk cookie-based session via `auth()`.
 * - Companion app/dev: `x-mobile-api-key` + `x-mobile-user-id` (server-side API key).
 */
export async function requireMobileAuth(request: NextRequest, requestId: string): Promise<MobileAuthResult> {
  const mode = (process.env.MOBILE_API_AUTH || "clerk").toLowerCase();

  const apiKey = request.headers.get("x-mobile-api-key");
  const expected = process.env.MOBILE_API_KEY;

  if (apiKey && expected && apiKey === expected) {
    const userId = request.headers.get("x-mobile-user-id");
    if (!userId) {
      return {
        ok: false,
        response: jsonError(requestId, 401, "UNAUTHORIZED", "Missing x-mobile-user-id"),
      };
    }
    return { ok: true, userId };
  }

  if (mode === "none") {
    // Dev mode: allow requests without Clerk, but still require a userId to scope DB writes.
    const userId = request.headers.get("x-mobile-user-id");
    if (!userId) {
      return {
        ok: false,
        response: jsonError(requestId, 401, "UNAUTHORIZED", "Missing x-mobile-user-id (MOBILE_API_AUTH=none)"),
      };
    }
    return { ok: true, userId };
  }

  // Default: Clerk
  const { userId } = await auth();
  if (!userId) {
    return {
      ok: false,
      response: jsonError(requestId, 401, "UNAUTHORIZED", "Unauthorized"),
    };
  }

  return { ok: true, userId };
}
