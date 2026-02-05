import { createHmac, timingSafeEqual, randomBytes } from 'crypto';

// The cookie name for the cached user session
export const USER_SESSION_COOKIE = 'scope_user_session';
export const USER_SESSION_MAX_AGE = 60 * 60; // 1 hour cache

// Define the shape of the cached user data
// This matches the response structure of /api/auth/user
export interface UserSessionData {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
    isPro: boolean;
    subscriptionPlan: string | null;
    hasStripeKey: boolean;
    hasActiveAccess: boolean;
    isInTrial: boolean;
    trialDaysRemaining: number;
    cancelAtPeriodEnd?: boolean;
    currentPeriodEnd?: string | null;
    // Timestamps for cache validation
    cachedAt: number;
    expiresAt: number;
    // Allow index signature for other fields that might be passed through
    [key: string]: any;
}

// Lazy-loaded secret
let generatedSecret: string | null = null;

function getSessionSecret(): string {
    // Prefer CLERK_SECRET_KEY as it's guaranteed to be consistent across envs if Clerk is set up
    // Fallback to NEXTAUTH_SECRET or generate a temporary one
    const secret = process.env.CLERK_SECRET_KEY || process.env.NEXTAUTH_SECRET;

    if (secret) {
        return secret;
    }

    if (!generatedSecret) {
        generatedSecret = randomBytes(32).toString('hex');
        console.warn('[USER-SESSION] No stable secret found (CLERK_SECRET_KEY/NEXTAUTH_SECRET). Generated random secret.');
    }

    return generatedSecret as string;
}

/**
 * Create a cryptographically signed session token.
 * Format: base64(data).base64(signature)
 */
export function createSessionToken(data: Omit<UserSessionData, 'cachedAt' | 'expiresAt'>): string {
    const secret = getSessionSecret();

    const now = Date.now();
    const sessionData: UserSessionData = {
        ...(data as any),
        cachedAt: now,
        expiresAt: now + (USER_SESSION_MAX_AGE * 1000),
    };

    const dataString = JSON.stringify(sessionData);
    const encodedData = Buffer.from(dataString).toString('base64');

    const hmac = createHmac('sha256', secret);
    hmac.update(encodedData);
    const signature = hmac.digest('base64');

    return `${encodedData}.${signature}`;
}

/**
 * Verify and decode a session token.
 */
export function verifySessionToken(token: string): UserSessionData | null {
    try {
        if (!token) return null;

        const secret = getSessionSecret();
        const parts = token.split('.');

        if (parts.length !== 2) return null;

        const [encodedData, providedSignature] = parts;

        // Verify signature
        const hmac = createHmac('sha256', secret);
        hmac.update(encodedData);
        const expectedSignature = hmac.digest('base64');

        const providedBuffer = Buffer.from(providedSignature, 'base64');
        const expectedBuffer = Buffer.from(expectedSignature, 'base64');

        if (providedBuffer.length !== expectedBuffer.length) return null;
        if (!timingSafeEqual(providedBuffer, expectedBuffer)) return null;

        // Decode data
        const dataString = Buffer.from(encodedData, 'base64').toString('utf-8');
        const sessionData = JSON.parse(dataString) as UserSessionData;

        // Check expiration
        if (sessionData.expiresAt < Date.now()) {
            return null;
        }

        return sessionData;
    } catch (error) {
        // Silent failure for invalid cookies
        return null;
    }
}
