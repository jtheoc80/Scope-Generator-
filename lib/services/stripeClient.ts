import Stripe from 'stripe';

/**
 * Get Stripe client using environment variables
 * Works with both Vercel and local development
 */
export function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!secretKey) {
    throw new Error(
      'STRIPE_SECRET_KEY is not set. Please add it to your environment variables.'
    );
  }
  
  return new Stripe(secretKey);
}

/**
 * Legacy alias for backward compatibility
 */
export async function getUncachableStripeClient(): Promise<Stripe> {
  return getStripeClient();
}

/**
 * Get the Stripe publishable key from environment variables
 */
export function getStripePublishableKey(): string {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  
  if (!publishableKey) {
    throw new Error(
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set. Please add it to your environment variables.'
    );
  }
  
  return publishableKey;
}

/**
 * Get the Stripe secret key from environment variables
 */
export function getStripeSecretKey(): string {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!secretKey) {
    throw new Error(
      'STRIPE_SECRET_KEY is not set. Please add it to your environment variables.'
    );
  }
  
  return secretKey;
}

/**
 * Create a Stripe client with a custom secret key (for user's own Stripe account)
 */
export function createStripeClientWithKey(secretKey: string): Stripe {
  return new Stripe(secretKey);
}

/**
 * Get the Stripe webhook secret for verifying webhooks
 */
export function getStripeWebhookSecret(): string {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    throw new Error(
      'STRIPE_WEBHOOK_SECRET is not set. Please add it to your environment variables.'
    );
  }
  
  return webhookSecret;
}

/**
 * Check if Stripe is properly configured
 */
export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY && 
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  );
}


let stripeSync: any = null;

export async function getStripeSync() {
  if (!stripeSync) {
    const { StripeSync } = await import('stripe-replit-sync');
    const secretKey = await getStripeSecretKey();

    stripeSync = new StripeSync({
      poolConfig: {
        connectionString: process.env.DATABASE_URL!,
        max: 2,
      },
      stripeSecretKey: secretKey,
    });
  }
  return stripeSync;
}