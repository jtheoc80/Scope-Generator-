import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getStripeClient, getStripeWebhookSecret } from '@/lib/services/stripeClient';
import { billingService } from '@/lib/services/billingService';
import { storage } from '@/lib/services/storage';
import Stripe from 'stripe';

// Disable body parsing for webhooks (needed for signature verification)
export const dynamic = 'force-dynamic';

/**
 * Stripe Webhook Handler
 * 
 * Key features:
 * - Signature verification for security
 * - Idempotent processing using event IDs
 * - Updates canonical billing table
 * - Backward compatibility with user fields
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('STRIPE WEBHOOK: Missing stripe-signature header');
      return NextResponse.json(
        { message: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    let webhookSecret: string;
    try {
      webhookSecret = getStripeWebhookSecret();
    } catch {
      console.error('STRIPE WEBHOOK: STRIPE_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { message: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    const stripe = getStripeClient();
    let event: Stripe.Event;

    // Verify webhook signature
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('STRIPE WEBHOOK: Signature verification failed:', err.message);
      return NextResponse.json(
        { message: `Webhook signature verification failed: ${err.message}` },
        { status: 400 }
      );
    }

    console.log(`STRIPE WEBHOOK: Processing event ${event.type} (${event.id})`);

    // Check idempotency - skip if already processed
    const alreadyProcessed = await billingService.isEventProcessed(event.id);
    if (alreadyProcessed) {
      console.log(`STRIPE WEBHOOK: Event ${event.id} already processed, skipping`);
      return NextResponse.json({ received: true, skipped: true });
    }

    // Handle the event with error handling to ensure failed events are recorded
    let result: { success: boolean; message: string };

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          result = await billingService.handleCheckoutCompleted(session, event.id);
          break;
        }

        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          result = await billingService.handleSubscriptionUpdated(subscription, event.id);
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          result = await billingService.handleSubscriptionDeleted(subscription, event.id);
          break;
        }

        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          result = await handlePaymentSucceeded(paymentIntent, event.id);
          break;
        }

        case 'invoice.paid': {
          // Handle subscription renewals
          const invoice = event.data.object as Stripe.Invoice;
          result = await handleInvoicePaid(invoice, event.id);
          break;
        }

        case 'invoice.payment_failed': {
          // Handle failed payments
          const invoice = event.data.object as Stripe.Invoice;
          result = await handleInvoicePaymentFailed(invoice, event.id);
          break;
        }

        default:
          console.log(`STRIPE WEBHOOK: Unhandled event type: ${event.type}`);
          result = { success: true, message: `Unhandled event type: ${event.type}` };
      }

      console.log(`STRIPE WEBHOOK: ${event.type} result:`, result);
      return NextResponse.json({ received: true, ...result });
    } catch (handlerError) {
      // Record failed event to prevent infinite retries
      const errorMessage = handlerError instanceof Error ? handlerError.message : 'Unknown handler error';
      console.error(`STRIPE WEBHOOK: Handler failed for ${event.type} (${event.id}):`, errorMessage);
      
      // Extract customer/subscription IDs from event data for better tracking
      let customerId: string | undefined;
      let subscriptionId: string | undefined;
      
      if ('customer' in event.data.object) {
        customerId = event.data.object.customer as string;
      }
      if ('subscription' in event.data.object) {
        subscriptionId = event.data.object.subscription as string;
      }
      
      // Record the failed event to ensure idempotency
      try {
        await billingService.recordWebhookEvent({
          eventId: event.id,
          eventType: event.type,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          processingResult: 'failed',
          errorMessage,
          rawPayload: JSON.stringify(event),
        });
      } catch (recordError) {
        console.error('STRIPE WEBHOOK: Failed to record failed event:', recordError);
      }
      
      // Re-throw to trigger outer error handler
      throw handlerError;
    }
  } catch (error) {
    console.error('STRIPE WEBHOOK: Handler error:', error);
    return NextResponse.json(
      { message: 'Webhook handler failed', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Handle payment_intent.succeeded for proposal deposits
 */
async function handlePaymentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
  eventId: string
): Promise<{ success: boolean; message: string }> {
  // Check if already processed
  if (await billingService.isEventProcessed(eventId)) {
    return { success: true, message: 'Event already processed' };
  }

  // Handle proposal deposit payments
  const proposalId = paymentIntent.metadata?.proposalId;
  
  if (proposalId && paymentIntent.metadata?.type === 'proposal_deposit') {
    await storage.updateProposalPaymentStatus(parseInt(proposalId), {
      paidAmount: paymentIntent.amount_received,
      paymentStatus: 'paid',
      stripePaymentIntentId: paymentIntent.id,
    });
    
    console.log(`STRIPE WEBHOOK: Payment received for proposal ${proposalId}`);
    return { success: true, message: `Payment received for proposal ${proposalId}` };
  }

  return { success: true, message: 'Payment intent acknowledged' };
}

/**
 * Handle invoice.paid for subscription renewals
 */
async function handleInvoicePaid(
  invoice: Stripe.Invoice,
  eventId: string
): Promise<{ success: boolean; message: string }> {
  // Check if already processed
  if (await billingService.isEventProcessed(eventId)) {
    return { success: true, message: 'Event already processed' };
  }

  const subscriptionId = invoice.subscription as string;
  
  if (subscriptionId) {
    // Subscription renewal - fetch and update subscription details
    try {
      const stripe = getStripeClient();
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      await billingService.handleSubscriptionUpdated(subscription, eventId);
      return { success: true, message: 'Subscription renewed successfully' };
    } catch (error) {
      console.error('STRIPE WEBHOOK: Error handling invoice.paid:', error);
      return { success: false, message: 'Failed to update subscription' };
    }
  }

  return { success: true, message: 'Invoice paid acknowledged' };
}

/**
 * Handle invoice.payment_failed
 */
async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  eventId: string
): Promise<{ success: boolean; message: string }> {
  // Check if already processed
  if (await billingService.isEventProcessed(eventId)) {
    return { success: true, message: 'Event already processed' };
  }

  const subscriptionId = invoice.subscription as string;
  const customerId = invoice.customer as string;

  console.warn(`STRIPE WEBHOOK: Payment failed for customer ${customerId}, subscription ${subscriptionId}`);

  // The subscription status will be updated via customer.subscription.updated event
  // Just log for now
  return { success: true, message: 'Payment failure logged' };
}
