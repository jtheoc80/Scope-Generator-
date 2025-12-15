import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { stripeService } from '@/lib/services/stripeService';
import { storage } from '@/lib/services/storage';
import { isStripeConfigured } from '@/lib/services/stripeClient';

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { message: 'Stripe is not configured' },
        { status: 503 }
      );
    }

    // Verify authentication
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await storage.getUser(userId);
    
    if (!user?.stripeCustomerId) {
      return NextResponse.json(
        { message: 'No Stripe customer found' },
        { status: 400 }
      );
    }

    const origin = request.headers.get('origin') || 'http://localhost:3000';
    
    const session = await stripeService.createCustomerPortalSession(
      user.stripeCustomerId,
      `${origin}/dashboard`
    );

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return NextResponse.json(
      { message: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
