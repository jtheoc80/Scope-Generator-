/**
 * Test Auth Token Security
 * 
 * Provides cryptographically signed session tokens for test authentication.
 * Uses HMAC-SHA256 to prevent token forgery.
 * 
 * SECURITY: Only used for test auth mode (AUTH_MODE=test).
 */

import { createHmac, timingSafeEqual } from 'crypto';

export interface TestSessionData {
  userId: string;
  email: string;
  createdAt: number;
  expiresAt: number;
}

/**
 * Get the secret key for signing tokens.
 * Uses a dedicated test auth secret or falls back to a default for development.
 * 
 * SECURITY NOTE: In production-like test environments, always set TEST_AUTH_SECRET.
 */
function getTestAuthSecret(): string {
  const secret = process.env.TEST_AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  
  if (!secret) {
    // Fallback for local development only
    console.warn('[TEST-AUTH] No TEST_AUTH_SECRET found, using default. Set TEST_AUTH_SECRET for production-like testing.');
    return 'test-auth-default-secret-change-in-production';
  }
  
  return secret;
}

/**
 * Create a cryptographically signed session token.
 * 
 * Format: base64(sessionData).hmac-signature
 * 
 * @param sessionData - The session data to encode
 * @returns Signed token string
 */
export function createSignedToken(sessionData: TestSessionData): string {
  const secret = getTestAuthSecret();
  
  // Encode the session data
  const dataString = JSON.stringify(sessionData);
  const encodedData = Buffer.from(dataString).toString('base64');
  
  // Create HMAC signature
  const hmac = createHmac('sha256', secret);
  hmac.update(encodedData);
  const signature = hmac.digest('base64');
  
  // Combine data and signature
  return `${encodedData}.${signature}`;
}

/**
 * Verify and decode a signed session token.
 * 
 * @param token - The signed token to verify
 * @returns Decoded session data if valid, null if invalid or expired
 */
export function verifySignedToken(token: string): TestSessionData | null {
  try {
    const secret = getTestAuthSecret();
    
    // Split token into data and signature
    const parts = token.split('.');
    if (parts.length !== 2) {
      console.error('[TEST-AUTH] Invalid token format: missing signature');
      return null;
    }
    
    const [encodedData, providedSignature] = parts;
    
    // Verify the signature
    const hmac = createHmac('sha256', secret);
    hmac.update(encodedData);
    const expectedSignature = hmac.digest('base64');
    
    // Use timing-safe comparison to prevent timing attacks
    const providedBuffer = Buffer.from(providedSignature, 'base64');
    const expectedBuffer = Buffer.from(expectedSignature, 'base64');
    
    if (providedBuffer.length !== expectedBuffer.length) {
      console.error('[TEST-AUTH] Invalid signature: length mismatch');
      return null;
    }
    
    if (!timingSafeEqual(providedBuffer, expectedBuffer)) {
      console.error('[TEST-AUTH] Invalid signature: verification failed');
      return null;
    }
    
    // Decode the session data
    const dataString = Buffer.from(encodedData, 'base64').toString('utf-8');
    const sessionData = JSON.parse(dataString) as TestSessionData;
    
    // Check expiration
    if (sessionData.expiresAt < Date.now()) {
      console.error('[TEST-AUTH] Token expired');
      return null;
    }
    
    return sessionData;
  } catch (error) {
    console.error('[TEST-AUTH] Error verifying token:', error);
    return null;
  }
}
