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
const DEV_CREW_EMAIL_ALLOWLIST: Set<string> = (() => {
  const emailsRaw = process.env.DEV_CREW_EMAILS || '';
  if (!emailsRaw.trim()) {
    return new Set<string>();
  }

  return new Set<string>(
    emailsRaw
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter((email) => email.length > 0 && email.includes('@')),
  );
})();

function getDevCrewEmailAllowlist(): Set<string> {
  return DEV_CREW_EMAIL_ALLOWLIST;
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

// ==========================================
// Entitlement System for Admin Management
// ==========================================

/**
 * Valid entitlement values that can be granted to users
 */
export const VALID_ENTITLEMENTS = [
  'CREW_ACCESS',      // Access to Crew dashboard
  'CREW_PAYOUT',      // Access to Crew Payout features
  'ADMIN_USERS',      // Access to admin user management
  'SEARCH_CONSOLE',   // Access to Search Console features
] as const;

export type Entitlement = typeof VALID_ENTITLEMENTS[number];

/**
 * Check if a string is a valid entitlement
 */
export function isValidEntitlement(value: string): value is Entitlement {
  return VALID_ENTITLEMENTS.includes(value as Entitlement);
}

/**
 * User type for entitlement checks (matches schema)
 */
interface UserForEntitlements {
  id: string;
  email?: string | null;
  subscriptionPlan?: string | null;
  entitlements?: string[] | null;
  role?: string | null;
}

/**
 * Check if a user has Crew access (subscription OR entitlement OR dev override)
 */
export function userHasCrewAccess(user: UserForEntitlements): boolean {
  // Check subscription
  if (user.subscriptionPlan === 'crew') {
    return true;
  }
  
  // Check entitlements array
  if (user.entitlements?.includes('CREW_ACCESS')) {
    return true;
  }
  
  // Check dev override (non-production only)
  if (!isProductionEnvironment()) {
    if (isEmailInDevAllowlist(user.email)) {
      return true;
    }
    if (isDevForceCrewEnabled()) {
      return true;
    }
  }
  
  return false;
}

/**
 * Result of crew payout access check
 */
export interface CrewPayoutAccessResult {
  allowed: boolean;
  reason?: 'NOT_CREW_SUBSCRIBER' | 'MISSING_ENTITLEMENT' | 'NOT_AUTHENTICATED';
  missingRequirement?: string;
}

/**
 * Check if a user has access to Crew Payout features
 * Requires BOTH Crew access AND the CREW_PAYOUT entitlement (or subscription)
 */
export function checkCrewPayoutAccess(user: UserForEntitlements | null): CrewPayoutAccessResult {
  if (!user) {
    return {
      allowed: false,
      reason: 'NOT_AUTHENTICATED',
    };
  }
  
  // First check if user has Crew access at all
  if (!userHasCrewAccess(user)) {
    return {
      allowed: false,
      reason: 'NOT_CREW_SUBSCRIBER',
      missingRequirement: 'Crew subscription or CREW_ACCESS entitlement',
    };
  }
  
  // Crew subscribers automatically get payout access
  if (user.subscriptionPlan === 'crew') {
    return { allowed: true };
  }
  
  // For entitlement-based access, also need CREW_PAYOUT
  if (user.entitlements?.includes('CREW_PAYOUT')) {
    return { allowed: true };
  }
  
  // Has CREW_ACCESS but not CREW_PAYOUT
  return {
    allowed: false,
    reason: 'MISSING_ENTITLEMENT',
    missingRequirement: 'CREW_PAYOUT entitlement',
  };
}

/**
 * Access summary for a user (returned to client for UI decisions)
 */
export interface UserAccessSummary {
  hasCrewAccess: boolean;
  hasCrewPayoutAccess: boolean;
  hasAdminAccess: boolean;
  hasSearchConsoleAccess: boolean;
  subscriptionPlan: string | null;
  entitlements: string[];
  isDevOverride: boolean;
}

/**
 * Get a summary of what a user has access to
 */
export function getUserAccessSummary(user: UserForEntitlements | null): UserAccessSummary {
  if (!user) {
    return {
      hasCrewAccess: false,
      hasCrewPayoutAccess: false,
      hasAdminAccess: false,
      hasSearchConsoleAccess: false,
      subscriptionPlan: null,
      entitlements: [],
      isDevOverride: false,
    };
  }
  
  const entitlements = user.entitlements ?? [];
  const hasCrewAccess = userHasCrewAccess(user);
  const crewPayoutResult = checkCrewPayoutAccess(user);
  
  // Check if access is via dev override
  let isDevOverride = false;
  if (hasCrewAccess && user.subscriptionPlan !== 'crew' && !entitlements.includes('CREW_ACCESS')) {
    isDevOverride = true;
  }
  
  return {
    hasCrewAccess,
    hasCrewPayoutAccess: crewPayoutResult.allowed,
    hasAdminAccess: user.role === 'admin' || entitlements.includes('ADMIN_USERS'),
    hasSearchConsoleAccess: hasCrewAccess || entitlements.includes('SEARCH_CONSOLE'),
    subscriptionPlan: user.subscriptionPlan ?? null,
    entitlements,
    isDevOverride,
  };
}
