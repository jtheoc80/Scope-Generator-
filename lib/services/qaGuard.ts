/**
 * QA Endpoint Guard Utility
 * 
 * Provides consistent security checks for QA/test endpoints.
 * All QA endpoints should use this guard to ensure proper access control.
 */
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export interface QAGuardOptions {
  /** Allow in production with explicit env flag (default: false) */
  allowInProduction?: boolean;
  /** The env var to check for production access (default: QA_ALLOW_TEST_ENDPOINTS) */
  productionEnvVar?: string;
  /** Rate limit per minute (default: 60) */
  rateLimit?: number;
}

export interface QAGuardResult {
  allowed: boolean;
  error?: NextResponse;
}

// Simple in-memory rate limiting for QA endpoints
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

/**
 * Guards QA endpoints with multiple security checks:
 * 1. Environment check (blocks production unless explicitly allowed)
 * 2. Secret validation (requires QA_TEST_SECRET)
 * 3. Basic rate limiting
 * 
 * @example
 * ```ts
 * export async function POST(request: NextRequest) {
 *   const body = await request.json();
 *   const guard = qaGuard(request, body.secret);
 *   if (!guard.allowed) return guard.error!;
 *   // ... rest of handler
 * }
 * ```
 */
export function qaGuard(
  request: NextRequest,
  providedSecret: string | undefined,
  options: QAGuardOptions = {}
): QAGuardResult {
  const {
    allowInProduction = false,
    productionEnvVar = 'QA_ALLOW_TEST_ENDPOINTS',
    rateLimit = 60,
  } = options;

  // 1. Environment check
  const isProduction = process.env.NODE_ENV === 'production';
  const hasProductionFlag = process.env[productionEnvVar] === 'true';
  
  if (isProduction && !allowInProduction) {
    logger.warn('QA endpoint blocked in production', { 
      path: request.nextUrl.pathname,
      hasFlag: hasProductionFlag 
    });
    return {
      allowed: false,
      error: NextResponse.json(
        { error: 'QA endpoints are not available in production' },
        { status: 403 }
      ),
    };
  }

  if (isProduction && allowInProduction && !hasProductionFlag) {
    logger.warn('QA endpoint blocked - missing production flag', { 
      path: request.nextUrl.pathname,
      envVar: productionEnvVar 
    });
    return {
      allowed: false,
      error: NextResponse.json(
        { error: `Set ${productionEnvVar}=true to enable this endpoint in production` },
        { status: 403 }
      ),
    };
  }

  // 2. Secret validation
  const qaSecret = process.env.QA_TEST_SECRET;
  if (!qaSecret) {
    logger.error('QA_TEST_SECRET not configured');
    return {
      allowed: false,
      error: NextResponse.json(
        { error: 'QA endpoints not configured - missing QA_TEST_SECRET' },
        { status: 500 }
      ),
    };
  }

  if (providedSecret !== qaSecret) {
    logger.warn('QA endpoint - invalid secret', { 
      path: request.nextUrl.pathname,
      ip: request.headers.get('x-forwarded-for')?.split(',')[0] 
    });
    return {
      allowed: false,
      error: NextResponse.json(
        { error: 'Invalid QA secret' },
        { status: 401 }
      ),
    };
  }

  // 3. Rate limiting
  const clientKey = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  
  const existing = rateLimitMap.get(clientKey);
  if (existing && existing.resetAt > now) {
    if (existing.count >= rateLimit) {
      logger.warn('QA endpoint rate limited', { clientKey, count: existing.count });
      return {
        allowed: false,
        error: NextResponse.json(
          { error: 'Rate limit exceeded. Please wait before retrying.' },
          { status: 429 }
        ),
      };
    }
    existing.count++;
  } else {
    rateLimitMap.set(clientKey, { count: 1, resetAt: now + windowMs });
  }

  // Clean up old entries periodically
  if (rateLimitMap.size > 1000) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (value.resetAt < now) {
        rateLimitMap.delete(key);
      }
    }
  }

  return { allowed: true };
}

/**
 * Check if we're in test auth mode
 */
export function isQAMode(): boolean {
  return process.env.AUTH_MODE === 'test' || process.env.NEXT_PUBLIC_AUTH_MODE === 'test';
}
