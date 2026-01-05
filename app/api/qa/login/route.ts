import { NextRequest, NextResponse } from "next/server";
import { createQASessionCookieValue, qaSessionCookieName } from "@/lib/services/qaSession";

/**
 * QA Login (cookie-based) - enables deterministic E2E without external auth.
 *
 * SECURITY:
 * - Requires QA_TEST_SECRET
 * - Only intended for non-production environments
 */
export async function POST(request: NextRequest) {
  // Guard: Never in production
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { userId, secret, expiresInSeconds } = body as {
      userId?: string;
      secret?: string;
      expiresInSeconds?: number;
    };

    const qaSecret = process.env.QA_TEST_SECRET;
    if (!qaSecret || secret !== qaSecret) {
      return NextResponse.json({ error: "Invalid QA secret" }, { status: 401 });
    }

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Force EMAIL_MODE=test for deterministic behavior in QA runs.
    // (This does not mutate process.env; it just validates expected config.)
    if (process.env.EMAIL_MODE !== "test") {
      return NextResponse.json(
        { error: "EMAIL_MODE=test is required for QA login" },
        { status: 400 },
      );
    }

    const ttlSeconds =
      typeof expiresInSeconds === "number" && Number.isFinite(expiresInSeconds)
        ? Math.max(60, expiresInSeconds)
        : 60 * 60;
    const expiresAtMs = Date.now() + ttlSeconds * 1000;
    const cookieValue = createQASessionCookieValue(userId, expiresAtMs);

    const res = NextResponse.json({ success: true, userId });
    res.cookies.set({
      name: qaSessionCookieName,
      value: cookieValue,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ttlSeconds,
    });
    return res;
  } catch (error) {
    console.error("[QA] login failed:", error);
    return NextResponse.json({ error: "Failed to login" }, { status: 500 });
  }
}

