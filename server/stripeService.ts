import { storage } from './storage';
import { getUncachableStripeClient, createStripeClientWithKey } from './stripeClient';
import { db } from './db';
import { sql } from 'drizzle-orm';

export class StripeService {
  async createCustomer(email: string, userId: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.customers.create({
      email,
      metadata: { userId },
    });
  }

  async createCheckoutSession(customerId: string, priceId: string, successUrl: string, cancelUrl: string, userId: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.checkout.sessions.create({
      customer: customerId,
      client_reference_id: userId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId },
    });
  }

  async createOneTimeCheckoutSession(
    customerId: string, 
    productType: 'starter' | 'single' | 'pack',
    successUrl: string, 
    cancelUrl: string, 
    userId: string
  ) {
    const stripe = await getUncachableStripeClient();
    
    // New pricing: Starter = $9 per proposal
    // Legacy support: single = $9, pack = $39 (10 credits)
    let priceData: { unit_amount: number; currency: string };
    let productName: string;
    let description: string;
    let credits: number;
    
    switch (productType) {
      case 'starter':
      case 'single':
        priceData = { unit_amount: 900, currency: 'usd' };
        productName = 'Starter - Single Proposal';
        description = 'Unlock 1 professional proposal';
        credits = 1;
        break;
      case 'pack':
        priceData = { unit_amount: 3900, currency: 'usd' };
        productName = 'Proposal Pack (10 Credits)';
        description = '10 proposal credits for active contractors';
        credits = 10;
        break;
    }
    
    return await stripe.checkout.sessions.create({
      customer: customerId || undefined,
      client_reference_id: userId,
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: priceData.currency,
          unit_amount: priceData.unit_amount,
          product_data: {
            name: productName,
            description: description,
          },
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { 
        userId,
        productType,
        credits: credits.toString(),
      },
    });
  }

  async createSubscriptionCheckoutSession(
    customerId: string,
    planType: 'pro' | 'crew',
    successUrl: string,
    cancelUrl: string,
    userId: string
  ) {
    const stripe = await getUncachableStripeClient();
    
    // Pro = $29/month (15 proposals), Crew = $79/month (50 proposals)
    let priceData: { unit_amount: number; currency: string };
    let productName: string;
    let description: string;
    let proposalsPerMonth: number;
    
    switch (planType) {
      case 'pro':
        priceData = { unit_amount: 2900, currency: 'usd' };
        productName = 'ScopeGen Pro';
        description = 'Up to 15 proposals per month - less than $2 each';
        proposalsPerMonth = 15;
        break;
      case 'crew':
        priceData = { unit_amount: 7900, currency: 'usd' };
        productName = 'ScopeGen Crew';
        description = 'Up to 50 proposals per month + team members';
        proposalsPerMonth = 50;
        break;
    }
    
    return await stripe.checkout.sessions.create({
      customer: customerId || undefined,
      client_reference_id: userId,
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: priceData.currency,
          unit_amount: priceData.unit_amount,
          recurring: {
            interval: 'month',
          },
          product_data: {
            name: productName,
            description: description,
          },
        },
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { 
        userId,
        planType,
        proposalsPerMonth: proposalsPerMonth.toString(),
      },
    });
  }

  async createCustomerPortalSession(customerId: string, returnUrl: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  async getProduct(productId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.products WHERE id = ${productId}`
    );
    return result.rows[0] || null;
  }

  async listProducts(active = true, limit = 20, offset = 0) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.products WHERE active = ${active} LIMIT ${limit} OFFSET ${offset}`
    );
    return result.rows;
  }

  async listProductsWithPrices(active = true, limit = 20, offset = 0) {
    const result = await db.execute(
      sql`
        WITH paginated_products AS (
          SELECT id, name, description, metadata, active
          FROM stripe.products
          WHERE active = ${active}
          ORDER BY id
          LIMIT ${limit} OFFSET ${offset}
        )
        SELECT 
          p.id as product_id,
          p.name as product_name,
          p.description as product_description,
          p.active as product_active,
          p.metadata as product_metadata,
          pr.id as price_id,
          pr.unit_amount,
          pr.currency,
          pr.recurring,
          pr.active as price_active,
          pr.metadata as price_metadata
        FROM paginated_products p
        LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
        ORDER BY p.id, pr.unit_amount
      `
    );
    return result.rows;
  }

  async getPrice(priceId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.prices WHERE id = ${priceId}`
    );
    return result.rows[0] || null;
  }

  async listPrices(active = true, limit = 20, offset = 0) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.prices WHERE active = ${active} LIMIT ${limit} OFFSET ${offset}`
    );
    return result.rows;
  }

  async getPricesForProduct(productId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.prices WHERE product = ${productId} AND active = true`
    );
    return result.rows;
  }

  async getSubscription(subscriptionId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.subscriptions WHERE id = ${subscriptionId}`
    );
    return result.rows[0] || null;
  }

  async retrieveCheckoutSession(sessionId: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.checkout.sessions.retrieve(sessionId);
  }

  async createPaymentLink(
    amountInCents: number,
    proposalId: number,
    clientName: string,
    jobDescription: string,
    successUrl: string,
    userStripeSecretKey?: string | null
  ) {
    const stripe = userStripeSecretKey 
      ? createStripeClientWithKey(userStripeSecretKey)
      : await getUncachableStripeClient();
    
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{
        price_data: {
          currency: 'usd',
          unit_amount: amountInCents,
          product_data: {
            name: `Deposit for ${jobDescription}`,
            description: `Payment for ${clientName}`,
          },
        },
        quantity: 1,
      }],
      after_completion: {
        type: 'redirect',
        redirect: {
          url: successUrl,
        },
      },
      metadata: {
        proposalId: proposalId.toString(),
        type: 'proposal_deposit',
      },
    });

    return paymentLink;
  }

  async deactivatePaymentLink(paymentLinkId: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.paymentLinks.update(paymentLinkId, {
      active: false,
    });
  }
}

export const stripeService = new StripeService();
