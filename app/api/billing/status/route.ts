import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { billingService } from '@/lib/services/billingService';

/**
 * Billing Status API
 * 
 * Returns the canonical billing status for the authenticated user.
 * This is the ONLY endpoint UI should use to determine access.
 * 
 * Response includes:
 * - hasActiveSubscription: boolean
 * - canAccessPremiumFeatures: boolean
 * - plan: 'free' | 'starter' | 'pro' | 'crew'
 * - status: subscription status
 * - currentPeriodEnd: when billing period ends
 * - availableCredits: one-time purchase credits
 * - isTrialing: whether user is in trial
 */

export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          authenticated: false,
        },
        { status: 401 }
      );
    }

    const billingStatus = await billingService.getBillingStatus(userId);

    // Add timestamp for cache-busting and debugging
    return NextResponse.json({
      ...billingStatus,
      userId,
      fetchedAt: new Date().toISOString(),
      // Include test mode indicator for debugging
      testMode: process.env.PAYMENTS_MODE === 'test',
    }, {
      // Prevent caching of billing status
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Billing status error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch billing status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Force refresh billing status from Stripe (if subscription exists)
 * This can be called after checkout to ensure status is current
 */
export async function POST(_request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // If in test mode, just return current status
    if (process.env.PAYMENTS_MODE === 'test') {
      const billingStatus = await billingService.getBillingStatus(userId);
      return NextResponse.json({
        ...billingStatus,
        userId,
        refreshed: true,
        testMode: true,
        fetchedAt: new Date().toISOString(),
      });
    }

    // In normal mode, we could optionally refresh from Stripe
    // For now, just return the DB status since webhooks keep it in sync
    const billingStatus = await billingService.getBillingStatus(userId);

    return NextResponse.json({
      ...billingStatus,
      userId,
      refreshed: true,
      fetchedAt: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Billing status refresh error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh billing status' },
      { status: 500 }
    );
  }
}
