import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/services/storage';

/**
 * QA Payment Simulation - For E2E tests to simulate successful payments.
 * 
 * This endpoint mimics what the Stripe webhook would do when a payment succeeds.
 * 
 * SECURITY: Only available with valid QA_TEST_SECRET and NOT in production.
 */

export async function POST(request: NextRequest) {
  // Guard: Never in production without explicit flag
  if (process.env.NODE_ENV === 'production' && !process.env.QA_ALLOW_PAYMENT_SIMULATION) {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { sessionId, userId, productType, secret } = body;

    // Validate secret
    const qaSecret = process.env.QA_TEST_SECRET;
    if (!qaSecret || secret !== qaSecret) {
      return NextResponse.json(
        { error: 'Invalid QA secret' },
        { status: 401 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    console.log(`[QA] Simulating payment success for session: ${sessionId}`);

    // Determine what to do based on product type or session metadata
    // This should match what the real webhook handler does

    let result = { success: false, message: 'Unknown product type' };

    // For subscription products (pro, crew)
    if (productType === 'pro' || productType === 'crew') {
      // Grant Pro status
      if (userId) {
        await storage.updateUserStripeInfo(userId, {
          isPro: true,
          subscriptionPlan: productType,
        });
        result = { success: true, message: `Granted ${productType} subscription` };
      }
    }
    // For one-time purchases (starter, pack)
    else if (productType === 'starter' || productType === 'single') {
      // Add 1 credit
      if (userId) {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 6);
        await storage.addProposalCredits(userId, 1, expiresAt);
        result = { success: true, message: 'Added 1 proposal credit' };
      }
    }
    else if (productType === 'pack') {
      // Add 10 credits
      if (userId) {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 6);
        await storage.addProposalCredits(userId, 10, expiresAt);
        result = { success: true, message: 'Added 10 proposal credits' };
      }
    }
    else {
      // Generic success - just log it
      result = { success: true, message: 'Payment simulation acknowledged' };
    }

    return NextResponse.json({
      ...result,
      sessionId,
      simulated: true,
    });
  } catch (error) {
    console.error('Error in QA simulate-payment:', error);
    return NextResponse.json(
      { error: 'Failed to simulate payment' },
      { status: 500 }
    );
  }
}
