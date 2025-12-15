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
        { message: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to environment variables.' },
        { status: 503 }
      );
    }

    // Verify authentication
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { message: 'Please log in first to purchase a plan.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { productType } = body;

    // Validate product type
    const validOneTimeTypes = ['starter', 'single', 'pack'];
    const validSubscriptionTypes = ['pro', 'crew'];
    const allValidTypes = [...validOneTimeTypes, ...validSubscriptionTypes];

    if (!productType || !allValidTypes.includes(productType)) {
      return NextResponse.json(
        { message: 'Valid product type is required (starter, pro, crew, single, or pack)' },
        { status: 400 }
      );
    }

    // Get or create user
    let user = await storage.getUser(userId);
    
    if (!user) {
      // Create user if they don't exist
      user = await storage.upsertUser({
        id: userId,
        email: null,
        firstName: null,
        lastName: null,
        profileImageUrl: null,
      });
    }

    // Create or get Stripe customer
    let customerId = user?.stripeCustomerId;
    if (!customerId) {
      const customer = await stripeService.createCustomer(user?.email || '', userId);
      await storage.updateUserStripeInfo(userId, { stripeCustomerId: customer.id });
      customerId = customer.id;
    }

    // Build URLs
    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const successUrl = `${origin}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/dashboard?canceled=true`;

    // Create checkout session
    let session;
    if (validSubscriptionTypes.includes(productType)) {
      session = await stripeService.createSubscriptionCheckoutSession(
        customerId,
        productType as 'pro' | 'crew',
        successUrl,
        cancelUrl,
        userId
      );
    } else {
      session = await stripeService.createOneTimeCheckoutSession(
        customerId,
        productType as 'starter' | 'single' | 'pack',
        successUrl,
        cancelUrl,
        userId
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { message: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
