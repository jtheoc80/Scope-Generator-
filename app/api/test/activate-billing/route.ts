import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { billingService } from '@/lib/services/billingService';

/**
 * Test Billing Activation Endpoint
 * 
 * SECURITY: Only available when PAYMENTS_MODE=test
 * Used by E2E tests to deterministically activate/deactivate billing
 * without hitting Stripe.
 * 
 * This endpoint is guarded by:
 * 1. PAYMENTS_MODE=test environment variable
 * 2. Not being in production (unless QA_ALLOW_TEST_ENDPOINTS is set)
 * 3. Valid authentication
 */

export async function POST(request: NextRequest) {
  // Guard 1: Check PAYMENTS_MODE
  if (process.env.PAYMENTS_MODE !== 'test') {
    return NextResponse.json(
      { error: 'Test billing endpoints only available in PAYMENTS_MODE=test' },
      { status: 403 }
    );
  }

  // Guard 2: Block in production unless explicitly allowed
  if (process.env.NODE_ENV === 'production' && !process.env.QA_ALLOW_TEST_ENDPOINTS) {
    return NextResponse.json(
      { error: 'Test endpoints not available in production' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { action, userId, plan = 'pro' } = body;

    // Allow specifying userId for QA scenarios, otherwise use authenticated user
    let targetUserId = userId;
    
    if (!targetUserId) {
      const { userId: authUserId } = await auth();
      targetUserId = authUserId;
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'User ID required (either from auth or request body)' },
        { status: 400 }
      );
    }

    // Validate plan
    const validPlans = ['pro', 'crew'];
    if (!validPlans.includes(plan)) {
      return NextResponse.json(
        { error: `Invalid plan. Must be one of: ${validPlans.join(', ')}` },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'activate':
        result = await billingService.activateTestBilling(targetUserId, plan);
        break;
      
      case 'deactivate':
        result = await billingService.deactivateTestBilling(targetUserId);
        break;
      
      default:
        return NextResponse.json(
          { error: 'Action must be "activate" or "deactivate"' },
          { status: 400 }
        );
    }

    // Get current billing status after action
    const billingStatus = await billingService.getBillingStatus(targetUserId);

    return NextResponse.json({
      ...result,
      billingStatus,
      testMode: true,
    });
  } catch (error) {
    console.error('Test billing activation error:', error);
    return NextResponse.json(
      { error: 'Failed to process test billing action', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET - Check current billing status for test user
 */
export async function GET(_request: NextRequest) {
  // Guard: Check PAYMENTS_MODE
  if (process.env.PAYMENTS_MODE !== 'test') {
    return NextResponse.json(
      { error: 'Test billing endpoints only available in PAYMENTS_MODE=test' },
      { status: 403 }
    );
  }

  // Guard: Block in production unless explicitly allowed
  if (process.env.NODE_ENV === 'production' && !process.env.QA_ALLOW_TEST_ENDPOINTS) {
    return NextResponse.json(
      { error: 'Test endpoints not available in production' },
      { status: 403 }
    );
  }

  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const billingStatus = await billingService.getBillingStatus(userId);

    return NextResponse.json({
      billingStatus,
      testMode: true,
      paymentsMode: process.env.PAYMENTS_MODE,
    });
  } catch (error) {
    console.error('Test billing status error:', error);
    return NextResponse.json(
      { error: 'Failed to get billing status' },
      { status: 500 }
    );
  }
}
