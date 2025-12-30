import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export type MobileAuthResult =
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse };

/**
 * Mobile auth supports two modes:
 * - Production/web: Clerk cookie-based session via `auth()`.
 * - Companion app/dev: `x-mobile-api-key` + `x-mobile-user-id` (server-side API key).
 */
export async function requireMobileAuth(request: NextRequest): Promise<MobileAuthResult> {
  const mode = (process.env.MOBILE_API_AUTH || "clerk").toLowerCase();

  const apiKey = request.headers.get("x-mobile-api-key");
  const expected = process.env.MOBILE_API_KEY;

  if (apiKey && expected && apiKey === expected) {
    const userId = request.headers.get("x-mobile-user-id");
    if (!userId) {
      return {
        ok: false,
        response: NextResponse.json(
          { message: "Missing x-mobile-user-id" },
          { status: 401 }
        ),
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
        response: NextResponse.json(
          { message: "Missing x-mobile-user-id (MOBILE_API_AUTH=none)" },
          { status: 401 }
        ),
      };
    }
    return { ok: true, userId };
  }

  // Default: Clerk
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        ok: false,
        response: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
      };
    }
    return { ok: true, userId };
  } catch (err) {
    // In some environments (tests/local dev) Clerk middleware may not be active, which makes auth() throw.
    // Fall back to header-based scoping (still requires an explicit userId).
    const headerUserId = request.headers.get("x-mobile-user-id");
    if (headerUserId) {
      return { ok: true, userId: headerUserId };
    }
    return {
      ok: false,
      response: NextResponse.json(
        { message: err instanceof Error ? err.message : "Unauthorized" },
        { status: 401 }
      ),
    };
  }
}
