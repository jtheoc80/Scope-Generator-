import crypto from "crypto";
import type { NextRequest } from "next/server";

const QA_COOKIE_NAME = "qa_session";

function getSecret(): string | null {
  const secret = process.env.QA_TEST_SECRET;
  if (!secret) return null;
  return secret;
}

function hmac(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export function createQASessionCookieValue(userId: string, expiresAtMs: number): string {
  const secret = getSecret();
  if (!secret) {
    throw new Error("QA_TEST_SECRET is required to create QA session");
  }

  const payload = `${userId}:${expiresAtMs}`;
  const sig = hmac(payload, secret);
  return `${userId}.${expiresAtMs}.${sig}`;
}

export function getQAUserIdFromRequest(request: NextRequest): string | null {
  if (process.env.EMAIL_MODE !== "test") return null;

  const secret = getSecret();
  if (!secret) return null;

  const raw = request.cookies.get(QA_COOKIE_NAME)?.value;
  if (!raw) return null;

  const parts = raw.split(".");
  if (parts.length !== 3) return null;

  const [userId, expiresAtRaw, sig] = parts;
  const expiresAtMs = Number(expiresAtRaw);
  if (!userId || !Number.isFinite(expiresAtMs) || !sig) return null;

  if (Date.now() > expiresAtMs) return null;

  const payload = `${userId}:${expiresAtMs}`;
  const expected = hmac(payload, secret);

  // Constant-time compare
  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;

  return userId;
}

export const qaSessionCookieName = QA_COOKIE_NAME;

