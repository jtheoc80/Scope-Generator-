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

  const { userId } = await auth();
  if (!userId) {
    return {
      ok: false,
      response: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }

  return { ok: true, userId };
}
