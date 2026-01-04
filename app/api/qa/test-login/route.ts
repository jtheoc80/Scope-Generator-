import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { storage } from '@/lib/services/storage';
import { createSignedToken, verifySignedToken } from '@/lib/test-auth-token';

/**
 * QA Test Login - For E2E tests to authenticate without Clerk.
 * 
 * SECURITY: Only available when AUTH_MODE=test.
 * This endpoint sets a test session cookie that can be used for testing
 * protected routes without requiring real authentication.
 * 
 * MUST NOT be available in production.
 */

export async function POST(request: NextRequest) {
  // Guard: Only available in test auth mode
  if (!isTestAuthMode()) {
    return NextResponse.json(
      { error: 'Test login only available when AUTH_MODE=test' },
      { status: 403 }
    );
  }

  // Additional guard: Never in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Test login not available in production' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // For test mode, we accept any valid-looking credentials
    // In a more sophisticated setup, you could maintain a test user database
    
    // Generate a test user ID based on email
    const userId = `test_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;

    // Ensure test user exists in database
    let user = await storage.getUser(userId);
    if (!user) {
      user = await storage.upsertUser({
        id: userId,
        email,
        firstName: 'Test',
        lastName: 'User',
        profileImageUrl: null,
      });
      
      // Give test users some credits
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 6);
      await storage.addProposalCredits(userId, 10, expiresAt);
    }

    // Create cryptographically signed test session token
    const sessionData = {
      userId,
      email,
      createdAt: Date.now(),
      expiresAt: Date.now() + (TEST_SESSION_MAX_AGE * 1000),
    };
    
    const sessionToken = createSignedToken(sessionData);

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set(TEST_SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: TEST_SESSION_MAX_AGE,
      path: '/',
    });

    console.log(`[QA] Test login successful for: ${email} (${userId})`);

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
      },
    });
  } catch (error) {
    console.error('Error in QA test-login:', error);
    return NextResponse.json(
      { error: 'Test login failed' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check current test session status
 */
export async function GET() {
  if (!isTestAuthMode()) {
    return NextResponse.json(
      { error: 'Test auth only available when AUTH_MODE=test' },
      { status: 403 }
    );
  }

  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(TEST_SESSION_COOKIE);
    const sessionData = validateTestSession(sessionCookie?.value);

    if (!sessionData) {
      return NextResponse.json({ authenticated: false });
    }

    // Verify the cryptographically signed token
    const sessionData = verifySignedToken(sessionCookie.value);

    if (!sessionData) {
      return NextResponse.json({ authenticated: false, reason: 'invalid_token' });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: sessionData.userId,
        email: sessionData.email,
      },
    });
  } catch (error) {
    console.error('Error checking test session:', error);
    return NextResponse.json({ authenticated: false, error: 'invalid_session' });
  }
}

/**
 * DELETE endpoint to clear test session (logout)
 */
export async function DELETE() {
  if (!isTestAuthMode()) {
    return NextResponse.json(
      { error: 'Test auth only available when AUTH_MODE=test' },
      { status: 403 }
    );
  }

  const cookieStore = await cookies();
  cookieStore.delete(TEST_SESSION_COOKIE);

  return NextResponse.json({ success: true, message: 'Logged out' });
}
