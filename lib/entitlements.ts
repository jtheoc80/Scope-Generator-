/**
 * Entitlements - Server-side Single Source of Truth
 * 
 * This module provides the canonical entitlement checks for subscription-based features.
 * All entitlement logic should go through these functions.
 * 
 * DEV/STAGING OVERRIDE:
 * In non-production environments, you can enable Crew access for testing via:
 * - DEV_CREW_EMAILS: comma-separated list of emails that get Crew access
 * - DEV_FORCE_CREW: set to "true" to give all authenticated users Crew access
 * 
 * These overrides are COMPLETELY DISABLED in production (NODE_ENV === 'production').
 */

export interface EntitlementContext {
  userId: string;
  email?: string | null;
  subscriptionPlan?: string | null;
}

export interface CrewEntitlementResult {
  hasCrewAccess: boolean;
  isDevOverride: boolean;
  reason: 'subscription' | 'dev_email_allowlist' | 'dev_force_flag' | 'none';
}

/**
 * Check if we're in a production environment
 * This is the guard that ensures dev overrides never leak to production
 */
function isProductionEnvironment(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Parse the DEV_CREW_EMAILS environment variable
 * Returns a Set of lowercase emails for efficient lookup
 */
function getDevCrewEmailAllowlist(): Set<string> {
  const emailsRaw = process.env.DEV_CREW_EMAILS || '';
  if (!emailsRaw.trim()) {
    return new Set();
  }
  
  return new Set(
    emailsRaw
      .split(',')
      .map(email => email.trim().toLowerCase())
      .filter(email => email.length > 0 && email.includes('@'))
  );
}

/**
 * Check if the DEV_FORCE_CREW flag is enabled
 */
function isDevForceCrewEnabled(): boolean {
  return process.env.DEV_FORCE_CREW === 'true';
}

/**
 * Check if a user email is in the dev allowlist
 */
function isEmailInDevAllowlist(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowlist = getDevCrewEmailAllowlist();
  return allowlist.has(email.toLowerCase());
}

/**
 * Check if a user has Crew subscription
 */
function hasCrewSubscription(subscriptionPlan: string | null | undefined): boolean {
  return subscriptionPlan === 'crew';
}

/**
 * Main entitlement check for Crew access
 * 
 * This is the SINGLE SOURCE OF TRUTH for determining if a user has Crew access.
 * 
 * Logic:
 * 1. If user has 'crew' subscription plan → hasCrewAccess = true
 * 2. If NOT in production AND user email is in DEV_CREW_EMAILS → hasCrewAccess = true (override)
 * 3. If NOT in production AND DEV_FORCE_CREW=true → hasCrewAccess = true (override)
 * 4. Otherwise → hasCrewAccess = false
 * 
 * @param context - The entitlement context containing user info
 * @returns CrewEntitlementResult with access status and reason
 */
export function checkCrewEntitlement(context: EntitlementContext): CrewEntitlementResult {
  // Check 1: Real subscription
  if (hasCrewSubscription(context.subscriptionPlan)) {
    return {
      hasCrewAccess: true,
      isDevOverride: false,
      reason: 'subscription',
    };
  }

  // Dev overrides are COMPLETELY DISABLED in production
  if (isProductionEnvironment()) {
    return {
      hasCrewAccess: false,
      isDevOverride: false,
      reason: 'none',
    };
  }

  // Check 2: Email allowlist (dev/staging only)
  if (isEmailInDevAllowlist(context.email)) {
    return {
      hasCrewAccess: true,
      isDevOverride: true,
      reason: 'dev_email_allowlist',
    };
  }

  // Check 3: Force flag (dev/staging only)
  if (isDevForceCrewEnabled()) {
    return {
      hasCrewAccess: true,
      isDevOverride: true,
      reason: 'dev_force_flag',
    };
  }

  // No access
  return {
    hasCrewAccess: false,
    isDevOverride: false,
    reason: 'none',
  };
}

/**
 * Quick check for Crew access (returns boolean only)
 * Use this for simple guard checks where you don't need the full result
 */
export function hasCrewAccess(context: EntitlementContext): boolean {
  return checkCrewEntitlement(context).hasCrewAccess;
}

/**
 * Check if the current user's Crew access is via dev override
 * Useful for displaying dev badges in UI
 */
export function isCrewDevOverride(context: EntitlementContext): boolean {
  const result = checkCrewEntitlement(context);
  return result.hasCrewAccess && result.isDevOverride;
}

/**
 * Get a human-readable description of the entitlement override
 * For displaying in dev badges
 */
export function getDevOverrideDescription(result: CrewEntitlementResult): string | null {
  if (!result.isDevOverride) return null;
  
  switch (result.reason) {
    case 'dev_email_allowlist':
      return 'Dev: Email Allowlist';
    case 'dev_force_flag':
      return 'Dev: Force Flag';
    default:
      return null;
  }
}
