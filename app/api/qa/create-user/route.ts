import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/services/storage';
import { qaGuard } from '@/lib/services/qaGuard';
import { logger } from '@/lib/logger';

/**
 * QA User Creation - For E2E tests to create test users quickly.
 * 
 * SECURITY: Only available with valid QA_TEST_SECRET and NOT in production.
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, firstName, lastName, secret } = body;

    // Use centralized QA guard for consistent security
    const guard = qaGuard(request, secret);
    if (!guard.allowed) return guard.error!;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Generate a unique user ID for the test user
    const userId = `qa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create user in our database
    await storage.upsertUser({
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

    logger.info('Created test user', { email, userId });

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
    logger.error('Error in QA create-user', error as Error);
    return NextResponse.json(
      { error: 'Failed to create test user' },
      { status: 500 }
    );
  }
}
