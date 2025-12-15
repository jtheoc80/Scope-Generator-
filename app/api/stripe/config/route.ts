import { NextResponse } from 'next/server';
import { getStripePublishableKey, isStripeConfigured } from '@/lib/services/stripeClient';

export async function GET() {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { message: 'Stripe is not configured' },
        { status: 503 }
      );
    }
    
    const publishableKey = getStripePublishableKey();
    return NextResponse.json({ publishableKey });
  } catch (error) {
    console.error('Error getting Stripe config:', error);
    return NextResponse.json(
      { message: 'Failed to get Stripe configuration' },
      { status: 500 }
    );
  }
}
