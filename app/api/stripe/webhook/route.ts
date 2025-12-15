import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getStripeClient, getStripeWebhookSecret } from '@/lib/services/stripeClient';
import { storage } from '@/lib/services/storage';
import Stripe from 'stripe';

// Disable body parsing for webhooks (needed for signature verification)
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { message: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    let webhookSecret: string;
    try {
      webhookSecret = getStripeWebhookSecret();
    } catch {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { message: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    const stripe = getStripeClient();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { message: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSucceeded(paymentIntent);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { message: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const productType = session.metadata?.productType;
  const planType = session.metadata?.planType;
  
  if (!userId) {
    console.error('No userId in session metadata');
    return;
  }

  // Handle one-time payments (credits)
  if (productType && ['starter', 'single', 'pack'].includes(productType)) {
    const credits = parseInt(session.metadata?.credits || '0');
    if (credits > 0) {
      const expiresAt = productType === 'pack' 
        ? new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000)
        : null;
      
      await storage.addProposalCredits(userId, credits, expiresAt, session.id);
      console.log(`Added ${credits} credits for user ${userId}`);
    }
  }

  // Handle subscription creation
  if (planType && session.subscription) {
    await storage.updateUserStripeInfo(userId, {
      stripeSubscriptionId: session.subscription as string,
      isPro: true,
      subscriptionPlan: planType,
    });
    console.log(`Updated subscription for user ${userId} to ${planType}`);
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  const customerId = subscription.customer as string;
  
  // Try to find user by metadata or customer ID
  let user;
  if (userId) {
    user = await storage.getUser(userId);
  }
  if (!user && customerId) {
    user = await storage.getUserByStripeCustomerId(customerId);
  }
  
  if (!user) {
    console.error('Could not find user for subscription:', subscription.id);
    return;
  }

  const isActive = subscription.status === 'active' || subscription.status === 'trialing';
  const planType = subscription.metadata?.planType || 'pro';
  
  await storage.updateUserStripeInfo(user.id, {
    stripeSubscriptionId: subscription.id,
    isPro: isActive,
    subscriptionPlan: isActive ? planType : null,
  });
  
  console.log(`Updated subscription status for user ${user.id}: ${subscription.status}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const user = await storage.getUserByStripeCustomerId(customerId);
  
  if (!user) {
    console.error('Could not find user for deleted subscription:', subscription.id);
    return;
  }
  
  await storage.updateUserStripeInfo(user.id, {
    stripeSubscriptionId: null,
    isPro: false,
    subscriptionPlan: null,
  });
  
  console.log(`Subscription cancelled for user ${user.id}`);
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  // Handle proposal deposit payments
  const proposalId = paymentIntent.metadata?.proposalId;
  
  if (proposalId && paymentIntent.metadata?.type === 'proposal_deposit') {
    await storage.updateProposalPaymentStatus(parseInt(proposalId), {
      paidAmount: paymentIntent.amount_received,
      paymentStatus: 'paid',
      stripePaymentIntentId: paymentIntent.id,
    });
    console.log(`Payment received for proposal ${proposalId}`);
  }
}
