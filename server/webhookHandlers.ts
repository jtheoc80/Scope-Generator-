import Stripe from 'stripe';
import { getStripeSync, getUncachableStripeClient } from './stripeClient';
import { storage } from './storage';
import { sendPurchaseNotification } from './emailService';

const ADMIN_NOTIFICATION_EMAIL = process.env.ADMIN_EMAIL || '';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string, uuid: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature, uuid);

    const event = JSON.parse(payload.toString()) as Stripe.Event;
    await WebhookHandlers.handleEvent(event);
  }

  static async handleEvent(event: Stripe.Event): Promise<void> {
    console.log(`Processing Stripe event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await WebhookHandlers.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.updated':
        await WebhookHandlers.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await WebhookHandlers.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      default:
        break;
    }
  }

  static async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    // Check if this is a proposal payment (from payment link)
    if (session.payment_link) {
      await WebhookHandlers.handlePaymentLinkCompleted(session);
      return;
    }

    const userId = session.client_reference_id;
    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;
    const planType = session.metadata?.planType as 'pro' | 'crew' | undefined;

    if (!userId) {
      console.error('No user ID in checkout session');
      return;
    }

    console.log(`Activating Pro for user ${userId}, customer ${customerId}, subscription ${subscriptionId}, plan: ${planType}`);

    await storage.updateUserStripeInfo(userId, {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      isPro: true,
      subscriptionPlan: planType || 'pro',
    });

    // Send email notification to admin about the new purchase
    if (ADMIN_NOTIFICATION_EMAIL) {
      try {
        const stripe = await getUncachableStripeClient();
        
        // Fetch customer and subscription details
        const [customer, subscription] = await Promise.all([
          stripe.customers.retrieve(customerId),
          stripe.subscriptions.retrieve(subscriptionId)
        ]);

        const customerData = customer as Stripe.Customer;
        const planName = subscription.items.data[0]?.price?.nickname || 'ScopeGen Pro';
        const amount = subscription.items.data[0]?.price?.unit_amount || 0;

        const result = await sendPurchaseNotification(ADMIN_NOTIFICATION_EMAIL, {
          customerEmail: customerData.email || 'unknown',
          customerName: customerData.name || undefined,
          planName,
          amount,
          subscriptionId,
        });

        if (result.success) {
          console.log(`Purchase notification sent to ${ADMIN_NOTIFICATION_EMAIL}`);
        } else {
          console.error('Failed to send purchase notification:', result.error);
        }
      } catch (error) {
        console.error('Error sending purchase notification:', error);
      }
    }
  }

  static async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const customerId = subscription.customer as string;
    const subscriptionId = subscription.id;
    const isActive = ['active', 'trialing'].includes(subscription.status);

    const user = await storage.getUserByStripeCustomerId(customerId);
    if (!user) {
      console.error(`No user found for customer ${customerId}`);
      return;
    }

    console.log(`Updating subscription for user ${user.id}, active: ${isActive}`);

    await storage.updateUserStripeInfo(user.id, {
      stripeSubscriptionId: subscriptionId,
      isPro: isActive,
    });
  }

  static async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const customerId = subscription.customer as string;

    const user = await storage.getUserByStripeCustomerId(customerId);
    if (!user) {
      console.error(`No user found for customer ${customerId}`);
      return;
    }

    console.log(`Deactivating Pro for user ${user.id}`);

    await storage.updateUserStripeInfo(user.id, {
      stripeSubscriptionId: null,
      isPro: false,
      subscriptionPlan: null,
    });
  }

  static async handlePaymentLinkCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const paymentLinkId = session.payment_link as string;
    const amountTotal = session.amount_total || 0;
    const paymentIntentId = session.payment_intent as string;

    console.log(`Processing payment link completion: ${paymentLinkId}, amount: ${amountTotal}`);

    // Find the proposal with this payment link
    const proposal = await storage.getProposalByPaymentLinkId(paymentLinkId);
    if (!proposal) {
      console.error(`No proposal found for payment link ${paymentLinkId}`);
      return;
    }

    // Idempotency check: if this payment intent was already processed, skip
    if (proposal.stripePaymentIntentId === paymentIntentId) {
      console.log(`Payment intent ${paymentIntentId} already processed for proposal ${proposal.id}, skipping`);
      return;
    }

    console.log(`Updating payment status for proposal ${proposal.id}`);

    // Calculate new paid amount
    const newPaidAmount = (proposal.paidAmount || 0) + amountTotal;
    const depositAmount = proposal.depositAmount || 0;
    
    // Determine payment status
    let paymentStatus = 'partial';
    if (newPaidAmount >= depositAmount) {
      paymentStatus = 'paid';
    }

    // Update the proposal
    await storage.updateProposalPaymentStatus(proposal.id, {
      paidAmount: newPaidAmount,
      paymentStatus,
      stripePaymentIntentId: paymentIntentId,
    });

    console.log(`Payment recorded for proposal ${proposal.id}: ${paymentStatus}, paid: ${newPaidAmount}`);
  }
}
