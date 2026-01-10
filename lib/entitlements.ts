/**
 * Entitlement System - Server-side helpers for access control
 * 
 * This module provides utilities for checking user entitlements
 * and protecting routes/resources based on subscription status,
 * role, and explicit entitlements.
 */

import { type User, type Entitlement, availableEntitlements } from "@shared/schema";

/**
 * Check if a user has a specific entitlement
 */
export function userHasEntitlement(user: User | null | undefined, entitlement: Entitlement): boolean {
  if (!user) return false;
  return user.entitlements?.includes(entitlement) ?? false;
}

/**
 * Check if a user has the admin role
 */
export function userIsAdmin(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.role === 'admin';
}

/**
 * Check if a user has crew access through any means:
 * 1. Crew subscription
 * 2. Explicit CREW_ACCESS entitlement (manual grant)
 */
export function userHasCrewAccess(user: User | null | undefined): boolean {
  if (!user) return false;
  
  // Check subscription
  if (user.subscriptionPlan === 'crew') return true;
  
  // Check explicit entitlement
  if (user.entitlements?.includes('CREW_ACCESS')) return true;
  
  return false;
}

/**
 * Check if a user has access to the Crew Payout feature
 * Requires either:
 * 1. Crew subscription + CREW_PAYOUT entitlement, OR
 * 2. Admin role
 */
export function userHasCrewPayoutAccess(user: User | null | undefined): boolean {
  if (!user) return false;
  
  // Admins always have access
  if (user.role === 'admin') return true;
  
  // Check for crew access + CREW_PAYOUT entitlement
  if (userHasCrewAccess(user) && user.entitlements?.includes('CREW_PAYOUT')) {
    return true;
  }
  
  return false;
}

/**
 * Check if user can access admin features
 */
export function userCanAccessAdmin(user: User | null | undefined): boolean {
  if (!user) return false;
  
  // Must be admin role
  if (user.role !== 'admin') return false;
  
  // Optionally check for specific admin entitlement
  if (user.entitlements?.includes('ADMIN_USERS')) return true;
  
  // Admin role alone is sufficient
  return true;
}

/**
 * Get a summary of user access for the client
 * (Safe to send to client - no sensitive data)
 */
export function getUserAccessSummary(user: User | null | undefined): {
  isAuthenticated: boolean;
  isAdmin: boolean;
  hasCrewAccess: boolean;
  hasCrewPayoutAccess: boolean;
  subscriptionPlan: string | null;
  entitlements: string[];
} {
  if (!user) {
    return {
      isAuthenticated: false,
      isAdmin: false,
      hasCrewAccess: false,
      hasCrewPayoutAccess: false,
      subscriptionPlan: null,
      entitlements: [],
    };
  }
  
  return {
    isAuthenticated: true,
    isAdmin: userIsAdmin(user),
    hasCrewAccess: userHasCrewAccess(user),
    hasCrewPayoutAccess: userHasCrewPayoutAccess(user),
    subscriptionPlan: user.subscriptionPlan,
    entitlements: user.entitlements ?? [],
  };
}

/**
 * Validate that an entitlement string is a valid entitlement
 */
export function isValidEntitlement(entitlement: string): entitlement is Entitlement {
  return (availableEntitlements as readonly string[]).includes(entitlement);
}

/**
 * Get all available entitlements with descriptions
 */
export function getEntitlementDescriptions(): Record<Entitlement, string> {
  return {
    'CREW_ACCESS': 'Access to Crew dashboard and team features',
    'CREW_PAYOUT': 'Access to Crew Payout functionality',
    'ADMIN_USERS': 'Access to user administration panel',
    'SEARCH_CONSOLE': 'Access to Google Search Console integration',
  };
}

/**
 * Access denial reasons
 */
export type AccessDeniedReason = 
  | 'NOT_AUTHENTICATED'
  | 'NOT_CREW_SUBSCRIBER'
  | 'MISSING_ENTITLEMENT'
  | 'NOT_ADMIN';

/**
 * Check result type for detailed access checking
 */
export interface AccessCheckResult {
  allowed: boolean;
  reason?: AccessDeniedReason;
  missingRequirement?: string;
}

/**
 * Detailed access check for Crew Payout
 */
export function checkCrewPayoutAccess(user: User | null | undefined): AccessCheckResult {
  if (!user) {
    return { allowed: false, reason: 'NOT_AUTHENTICATED' };
  }
  
  // Admins always have access
  if (user.role === 'admin') {
    return { allowed: true };
  }
  
  // Check for crew access
  if (!userHasCrewAccess(user)) {
    return { 
      allowed: false, 
      reason: 'NOT_CREW_SUBSCRIBER',
      missingRequirement: 'Crew subscription or CREW_ACCESS entitlement',
    };
  }
  
  // Check for CREW_PAYOUT entitlement
  if (!user.entitlements?.includes('CREW_PAYOUT')) {
    return { 
      allowed: false, 
      reason: 'MISSING_ENTITLEMENT',
      missingRequirement: 'CREW_PAYOUT entitlement',
    };
  }
  
  return { allowed: true };
}

/**
 * Detailed access check for Admin features
 */
export function checkAdminAccess(user: User | null | undefined): AccessCheckResult {
  if (!user) {
    return { allowed: false, reason: 'NOT_AUTHENTICATED' };
  }
  
  if (user.role !== 'admin') {
    return { 
      allowed: false, 
      reason: 'NOT_ADMIN',
      missingRequirement: 'Admin role',
    };
  }
  
  return { allowed: true };
}
