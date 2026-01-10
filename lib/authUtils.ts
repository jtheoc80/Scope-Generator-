import { isTestAuthMode } from "./test-auth";

export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}

/**
 * Check if Clerk authentication is fully configured.
 * Both the publishable key and secret key are required for Clerk to function properly.
 */
export function isClerkConfigured(): boolean {
  // In E2E "test auth mode" we intentionally bypass Clerk to keep tests deterministic.
  if (isTestAuthMode()) return false;

  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.CLERK_SECRET_KEY
  );
}
