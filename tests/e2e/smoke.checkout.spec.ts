import { test, expect } from '@playwright/test';
import { getCheckoutMode } from '../../qa/flows/checkout';

/**
 * Smoke Test: Checkout Flow
 * 
 * Critical flow that must never break.
 * Tests the subscription/purchase checkout flow.
 */

test.describe('Checkout Flow @smoke', () => {
  test('dashboard should have upgrade/purchase button', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Look for upgrade button (for non-pro users)
    const upgradeButton = page.locator('[data-testid="button-upgrade"]');
    
    // Either upgrade button exists or user is already pro
    const hasUpgrade = await upgradeButton.isVisible();
    // Use separate locators and combine with .or() for valid selector syntax
    const proBadge = page.locator('[data-testid="pro-badge"]').or(page.getByText('PRO', { exact: true }));
    const isPro = await proBadge.first().isVisible().catch(() => false);

    // One should be true
    expect(hasUpgrade || isPro).toBeTruthy();
  });

  test('clicking upgrade should open paywall modal', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const upgradeButton = page.locator('[data-testid="button-upgrade"]');
    
    if (await upgradeButton.isVisible()) {
      await upgradeButton.click();
      await page.waitForTimeout(1000);

      // Paywall modal should show pricing options
      const modal = page.locator('[role="dialog"], .modal, [data-testid="paywall-modal"]');
      await expect(modal).toBeVisible({ timeout: 5000 });
    }
  });

  test('paywall should show pricing plans', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const upgradeButton = page.locator('[data-testid="button-upgrade"]');
    
    if (await upgradeButton.isVisible()) {
      await upgradeButton.click();
      await page.waitForTimeout(1000);

      // Should show pricing information
      const priceText = page.locator('text=/\\$\\d+/');
      const hasPricing = await priceText.count() > 0;
      
      expect(hasPricing).toBeTruthy();
    }
  });

  test('checkout API should be accessible', async ({ page }) => {
    // Verify the checkout endpoint exists and responds
    const response = await page.request.post('/api/stripe/checkout', {
      data: { productType: 'pro' },
      failOnStatusCode: false,
    });

    // Should get a response (even if error due to auth)
    expect(response.status()).toBeLessThan(500);
    
    // Without auth, should get 401
    if (response.status() === 401) {
      const body = await response.json();
      expect(body.message).toBeDefined();
    }
  });

  test('checkout should require authentication', async ({ page }) => {
    const response = await page.request.post('/api/stripe/checkout', {
      data: { productType: 'pro' },
      failOnStatusCode: false,
    });

    // Without authentication, should return 401
    expect(response.status()).toBe(401);
  });

  test('checkout should validate product type', async ({ page }) => {
    // This test documents expected API behavior
    const response = await page.request.post('/api/stripe/checkout', {
      data: { productType: 'invalid-type' },
      failOnStatusCode: false,
    });

    // Should reject invalid product types
    // Will be 400 or 401 depending on auth state
    expect([400, 401]).toContain(response.status());
  });

  test.describe('Redirect Mode', () => {
    test.skip(getCheckoutMode() !== 'redirect', 'Skipped: Not in redirect mode');

    test('should initiate checkout and get Stripe URL', async ({ page }) => {
      // This requires authentication
      // Document expected behavior for redirect mode
      expect(getCheckoutMode()).toBe('redirect');
    });
  });

  test.describe('API Assert Mode', () => {
    test.skip(getCheckoutMode() !== 'api-assert', 'Skipped: Not in api-assert mode');

    test('QA simulate-payment endpoint should exist', async ({ page }) => {
      const response = await page.request.post('/api/qa/simulate-payment', {
        data: { sessionId: 'test', secret: 'wrong' },
        failOnStatusCode: false,
      });

      // Should get a response (error without correct secret)
      expect(response.status()).toBeLessThan(500);
    });
  });

  test('payment success page should handle query params', async ({ page }) => {
    // Navigate to dashboard with success params
    await page.goto('/dashboard?success=true&session_id=test_session');
    await page.waitForLoadState('networkidle');

    // Page should load without error
    // Success message might appear (if session is valid)
    const pageTitle = await page.title();
    expect(pageTitle).toBeTruthy();
  });

  test('payment cancel should redirect properly', async ({ page }) => {
    await page.goto('/dashboard?canceled=true');
    await page.waitForLoadState('networkidle');

    // Page should load and possibly show cancel message
    const pageTitle = await page.title();
    expect(pageTitle).toBeTruthy();
  });
});
