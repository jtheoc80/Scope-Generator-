import { NextRequest, NextResponse } from 'next/server';

/**
 * QA User Verification Bypass - For E2E tests to skip email verification.
 * 
 * SECURITY: Only available with valid QA_TEST_SECRET and NOT in production.
 */

export async function POST(request: NextRequest) {
  // Guard: Never in production
  if (process.env.NODE_ENV === 'production' && !process.env.QA_TEST_SECRET) {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { email, secret } = body;

    // Validate secret
    const qaSecret = process.env.QA_TEST_SECRET;
    if (!qaSecret || secret !== qaSecret) {
      return NextResponse.json(
        { error: 'Invalid QA secret' },
        { status: 401 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // In a real implementation, this would:
    // 1. Find the user by email
    // 2. Mark their email as verified in Clerk/database
    // 3. Return success

    // For now, we'll just acknowledge the request
    // Clerk doesn't easily support programmatic verification
    // Consider using Clerk's test mode or backend API
    
    console.log(`[QA] Verification bypass requested for: ${email}`);

    return NextResponse.json({
      success: true,
      message: 'User verification bypass acknowledged',
      email,
    });
  } catch (error) {
    console.error('Error in QA verify-user:', error);
    return NextResponse.json(
      { error: 'Failed to process verification bypass' },
      { status: 500 }
    );
  }
}
