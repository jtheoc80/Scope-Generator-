import { Page, expect } from '@playwright/test';

/**
 * Checkout flow helpers for QA tests.
 * 
 * Supports two modes:
 * - redirect: Test up to Stripe redirect, optionally automate card entry
 * - api-assert: Use test-only endpoint to simulate payment success
 */

export type CheckoutMode = 'redirect' | 'api-assert';

export interface CheckoutResult {
  success: boolean;
  sessionId?: string;
  checkoutUrl?: string;
  error?: string;
}

/**
 * Get the current checkout mode from environment.
 */
export function getCheckoutMode(): CheckoutMode {
  return (process.env.QA_STRIPE_MODE as CheckoutMode) || 'redirect';
}

/**
 * Start checkout session for a product.
 */
export async function startCheckout(
  page: Page,
  productType: 'starter' | 'pro' | 'crew' | 'pack'
): Promise<CheckoutResult> {
  // Navigate to dashboard and click upgrade/purchase
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  
  // Look for upgrade button or pricing trigger
  const upgradeButton = page.locator('[data-testid="button-upgrade"]');
  
  if (await upgradeButton.isVisible()) {
    await upgradeButton.click();
    await page.waitForTimeout(1000);
  }
  
  // Select the product in the paywall modal
  const planButton = page.locator(`[data-testid="select-plan-${productType}"], button:has-text("${productType}")`);
  if (await planButton.isVisible()) {
    await planButton.click();
  }
  
  // Intercept the checkout API call
  const [response] = await Promise.all([
    page.waitForResponse(
      (resp) => resp.url().includes('/api/stripe/checkout') && resp.status() < 400,
      { timeout: 10000 }
    ).catch(() => null),
    // Click checkout/subscribe button
    page.locator('[data-testid="button-checkout"], button:has-text("Subscribe"), button:has-text("Purchase")').first().click(),
  ]);
  
  if (!response) {
    return { success: false, error: 'No checkout response received' };
  }
  
  try {
    const data = await response.json();
    
    if (data.url) {
      return {
        success: true,
        checkoutUrl: data.url,
        sessionId: extractSessionId(data.url),
      };
    }
    
    return { success: false, error: data.message || 'No checkout URL returned' };
  } catch (e) {
    return { success: false, error: 'Failed to parse checkout response' };
  }
}

/**
 * Extract session ID from Stripe checkout URL.
 */
function extractSessionId(url: string): string | undefined {
  const match = url.match(/cs_[a-zA-Z0-9]+/);
  return match ? match[0] : undefined;
}

/**
 * Verify checkout session was created via API.
 */
export async function verifyCheckoutSession(
  page: Page,
  sessionId: string
): Promise<boolean> {
  try {
    const response = await page.request.post('/api/stripe/verify-session', {
      data: { sessionId },
    });
    return response.ok();
  } catch {
    return false;
  }
}

/**
 * Simulate successful payment using test-only endpoint.
 * Requires QA_TEST_SECRET environment variable.
 */
export async function simulatePaymentSuccess(
  page: Page,
  sessionId: string
): Promise<boolean> {
  const qaSecret = process.env.QA_TEST_SECRET;
  if (!qaSecret) {
    console.warn('QA_TEST_SECRET not set, cannot simulate payment');
    return false;
  }
  
  try {
    const response = await page.request.post('/api/qa/simulate-payment', {
      data: {
        sessionId,
        secret: qaSecret,
      },
    });
    return response.ok();
  } catch {
    return false;
  }
}

/**
 * Complete checkout flow in redirect mode.
 * Navigates to Stripe and optionally fills card details.
 */
export async function completeCheckoutRedirect(
  page: Page,
  checkoutUrl: string,
  fillCard: boolean = false
): Promise<boolean> {
  // Navigate to Stripe checkout
  await page.goto(checkoutUrl);
  await page.waitForLoadState('networkidle');
  
  // Verify we're on Stripe
  const isStripe = page.url().includes('checkout.stripe.com');
  if (!isStripe) {
    return false;
  }
  
  if (!fillCard) {
    // Just verify we got to Stripe
    return true;
  }
  
  // Fill test card details (Stripe test mode)
  // This is fragile due to Stripe's iframe structure
  try {
    // Wait for card input
    const cardInput = page.locator('input[name="cardNumber"]');
    await expect(cardInput).toBeVisible({ timeout: 10000 });
    
    // Test card number
    await cardInput.fill('4242424242424242');
    
    // Expiry
    const expiryInput = page.locator('input[name="cardExpiry"]');
    await expiryInput.fill('12/30');
    
    // CVC
    const cvcInput = page.locator('input[name="cardCvc"]');
    await cvcInput.fill('123');
    
    // Name
    const nameInput = page.locator('input[name="billingName"]');
    if (await nameInput.isVisible()) {
      await nameInput.fill('QA Test User');
    }
    
    // ZIP
    const zipInput = page.locator('input[name="billingPostalCode"]');
    if (await zipInput.isVisible()) {
      await zipInput.fill('12345');
    }
    
    // Submit
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Wait for redirect back
    await page.waitForURL(/.*dashboard.*success/, { timeout: 30000 });
    
    return true;
  } catch (e) {
    console.error('Failed to fill Stripe card form:', e);
    return false;
  }
}

/**
 * Full checkout flow for api-assert mode.
 * Creates session, simulates success, verifies result.
 */
export async function runCheckoutApiAssert(
  page: Page,
  productType: 'starter' | 'pro' | 'crew' | 'pack'
): Promise<boolean> {
  // Start checkout
  const result = await startCheckout(page, productType);
  if (!result.success || !result.sessionId) {
    console.error('Failed to start checkout:', result.error);
    return false;
  }
  
  // Simulate payment
  const simulated = await simulatePaymentSuccess(page, result.sessionId);
  if (!simulated) {
    console.error('Failed to simulate payment');
    return false;
  }
  
  // Verify success state
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  
  // Check for success indicators
  const successIndicators = [
    page.locator('[data-testid="pro-badge"]'),
    page.locator('text="PRO"'),
    page.locator('text="Payment successful"'),
  ];
  
  for (const indicator of successIndicators) {
    if (await indicator.isVisible()) {
      return true;
    }
  }
  
  return false;
}

/**
 * Create payment link for a proposal.
 */
export async function createPaymentLink(
  page: Page,
  proposalId: number,
  depositPercentage: number = 50
): Promise<string | null> {
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  
  // Open payment modal
  const paymentButton = page.locator(`[data-testid="button-payment-link-${proposalId}"]`);
  if (!await paymentButton.isVisible()) {
    return null;
  }
  
  await paymentButton.click();
  await page.waitForTimeout(1000);
  
  // Set deposit percentage if available
  const depositInput = page.locator('[data-testid="input-deposit-percentage"]');
  if (await depositInput.isVisible()) {
    await depositInput.fill(depositPercentage.toString());
  }
  
  // Create link
  const createButton = page.locator('[data-testid="button-create-payment-link"]');
  await createButton.click();
  
  // Wait for link
  await page.waitForTimeout(3000);
  
  // Get the generated link
  const linkDisplay = page.locator('[data-testid="payment-link-url"]');
  if (await linkDisplay.isVisible()) {
    return await linkDisplay.textContent();
  }
  
  return null;
}
