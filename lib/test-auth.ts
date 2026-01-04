/**
 * Test Authentication Utilities
 * 
 * Shared constants and utilities for test authentication mode.
 * Used by QA test endpoints and middleware during E2E testing.
 * 
 * SECURITY: Only used when AUTH_MODE=test
 */

export const TEST_SESSION_COOKIE = 'qa_test_session';
export const TEST_SESSION_MAX_AGE = 3600; // 1 hour

export interface TestSessionData {
  userId: string;
  email: string;
  createdAt: number;
  expiresAt: number;
}

/**
 * Check if the application is running in test auth mode
 */
export function isTestAuthMode(): boolean {
  return process.env.AUTH_MODE === 'test' || process.env.NEXT_PUBLIC_AUTH_MODE === 'test';
}

/**
 * Validate and decode a test session cookie value
 * Returns null if the session is invalid or expired
 */
export function validateTestSession(cookieValue: string | undefined): TestSessionData | null {
  if (!cookieValue) {
    return null;
  }

  try {
    const sessionData = JSON.parse(
      Buffer.from(cookieValue, 'base64').toString('utf-8')
    ) as TestSessionData;

    // Check if session is expired
    if (sessionData.expiresAt < Date.now()) {
      return null;
    }

    // Validate required fields
    if (!sessionData.userId || !sessionData.email) {
      return null;
    }

    return sessionData;
  } catch (error) {
    console.error('Error validating test session:', error);
    return null;
  }
}
