import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/services/storage';

/**
 * QA User Creation - For E2E tests to create test users quickly.
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
    const { email, firstName, lastName, password, secret } = body;

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

    // Generate a unique user ID for the test user
    const userId = `qa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create user in our database
    const user = await storage.upsertUser({
      id: userId,
      email,
      firstName: firstName || 'QA',
      lastName: lastName || 'Test',
      profileImageUrl: null,
    });

    // Give them some credits for testing
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 6);
    await storage.addProposalCredits(userId, 5, expiresAt);

    console.log(`[QA] Created test user: ${email} (${userId})`);

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
        firstName,
        lastName,
      },
    });
  } catch (error) {
    console.error('Error in QA create-user:', error);
    return NextResponse.json(
      { error: 'Failed to create test user' },
      { status: 500 }
    );
  }
}
