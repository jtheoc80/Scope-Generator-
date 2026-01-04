import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { storage } from '@/lib/services/storage';
import { createSignedToken } from '@/lib/test-auth-token';

/**
 * QA Test Sign Up - For E2E tests to create accounts without Clerk.
 * 
 * SECURITY: Only available when AUTH_MODE=test.
 * This endpoint creates a test user and sets a session cookie.
 * 
 * MUST NOT be available in production.
 */

export async function POST(request: NextRequest) {
  // Guard: Only available in test auth mode
  if (!isTestAuthMode()) {
    return NextResponse.json(
      { error: 'Test signup only available when AUTH_MODE=test' },
      { status: 403 }
    );
  }

  // Additional guard: Never in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Test signup not available in production' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { email, password, firstName, lastName } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Basic email validation
    if (!email.includes('@') || !email.includes('.')) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Generate a unique user ID
    const userId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create user in database
    await storage.upsertUser({
      id: userId,
      email,
      firstName: firstName || 'Test',
      lastName: lastName || 'User',
      profileImageUrl: null,
    });

    // Give new users some credits for testing
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 6);
    await storage.addProposalCredits(userId, 10, expiresAt);

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

    console.log(`[QA] Test signup successful for: ${email} (${userId})`);

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
        firstName: firstName || 'Test',
        lastName: lastName || 'User',
      },
    });
  } catch (error) {
    console.error('Error in QA test-signup:', error);
    return NextResponse.json(
      { error: 'Test signup failed' },
      { status: 500 }
    );
  }
}
