import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/services/storage';
import { qaGuard } from '@/lib/services/qaGuard';
import { logger } from '@/lib/logger';

/**
 * QA Payment Simulation - For E2E tests to simulate successful payments.
 * 
 * This endpoint mimics what the Stripe webhook would do when a payment succeeds.
 * 
 * SECURITY: Only available with valid QA_TEST_SECRET and NOT in production.
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, userId, productType, secret } = body;

    // Use centralized QA guard with special production flag for payment simulation
    const guard = qaGuard(request, secret, {
      allowInProduction: true,
      productionEnvVar: 'QA_ALLOW_PAYMENT_SIMULATION',
    });
    if (!guard.allowed) return guard.error!;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    logger.info('Simulating payment success', { sessionId });

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
    logger.error('Error in QA simulate-payment', error as Error);
    return NextResponse.json(
      { error: 'Failed to simulate payment' },
      { status: 500 }
    );
  }
}
