/**
 * Test Auth Token Security
 * 
 * Provides cryptographically signed session tokens for test authentication.
 * Uses HMAC-SHA256 to prevent token forgery.
 * 
 * SECURITY: Only used for test auth mode (AUTH_MODE=test).
 */

import { createHmac, timingSafeEqual, randomBytes } from 'crypto';

export interface TestSessionData {
  userId: string;
  email: string;
  createdAt: number;
  expiresAt: number;
}

// Random secret generated at startup for environments without TEST_AUTH_SECRET
let generatedSecret: string | null = null;

/**
 * Get the secret key for signing tokens.
 * Uses a dedicated test auth secret or generates a random one at startup.
 * 
 * SECURITY NOTE: In production-like test environments, always set TEST_AUTH_SECRET
 * to ensure tokens remain valid across server restarts.
 */
function getTestAuthSecret(): string {
  const secret = process.env.TEST_AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  
  if (secret) {
    return secret;
  }
  
  // Generate a random secret at startup if none is configured
  // This is more secure than a hardcoded default but tokens won't survive restarts
  if (!generatedSecret) {
    generatedSecret = randomBytes(32).toString('hex');
    console.warn('[TEST-AUTH] No TEST_AUTH_SECRET found, generated random secret. Tokens will not survive server restarts.');
  }
  
  return generatedSecret as string;
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
    // Wrap base64 decoding in try-catch to handle invalid base64 securely
    let providedBuffer: Buffer;
    try {
      providedBuffer = Buffer.from(providedSignature, 'base64');
    } catch {
      console.error('[TEST-AUTH] Invalid signature encoding');
      return null;
    }
    
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
    let dataString: string;
    let parsedData: unknown;
    
    try {
      dataString = Buffer.from(encodedData, 'base64').toString('utf-8');
    } catch {
      console.error('[TEST-AUTH] Invalid data encoding');
      return null;
    }
    
    try {
      parsedData = JSON.parse(dataString);
    } catch {
      console.error('[TEST-AUTH] Invalid JSON in token data');
      return null;
    }
    
    // Validate the parsed data structure
    if (!isValidSessionData(parsedData)) {
      console.error('[TEST-AUTH] Invalid session data structure');
      return null;
    }
    
    const sessionData = parsedData as TestSessionData;
    
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

/**
 * Runtime type guard to validate session data structure
 */
function isValidSessionData(data: unknown): data is TestSessionData {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  
  const obj = data as Record<string, unknown>;
  
  return (
    typeof obj.userId === 'string' &&
    typeof obj.email === 'string' &&
    typeof obj.createdAt === 'number' &&
    typeof obj.expiresAt === 'number'
  );
}
