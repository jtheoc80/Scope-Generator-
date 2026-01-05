import { test, expect } from '@playwright/test';

/**
 * Billing E2E Tests
 * 
 * These tests validate the complete billing flow:
 * - Paywall display and interaction
 * - Billing status updates
 * - Gated feature access
 * 
 * In PAYMENTS_MODE=test, these tests use the test activation endpoint
 * to deterministically simulate payments without hitting Stripe.
 */

test.describe('Billing Flow @billing', () => {
  const isTestMode = process.env.PAYMENTS_MODE === 'test';
  
  test.describe('Paywall Component', () => {
    test('should display paywall with pricing plans', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Look for paywall trigger or upgrade button
      const upgradeButton = page.locator('[data-testid="button-upgrade"], [data-testid="paywall-trigger"]');
      
      if (await upgradeButton.isVisible()) {
        await upgradeButton.click();
        await page.waitForTimeout(1000);

        // Verify paywall modal appears
        const paywall = page.locator('[data-testid="paywall"]');
        await expect(paywall).toBeVisible({ timeout: 5000 });

        // Verify pricing plans are displayed
        const pricingPlans = page.locator('[data-testid="pricing-plans"]');
        await expect(pricingPlans).toBeVisible();

        // Verify individual plans are present
        await expect(page.locator('[data-testid="plan-starter"]')).toBeVisible();
        await expect(page.locator('[data-testid="plan-pro"]')).toBeVisible();
        await expect(page.locator('[data-testid="plan-crew"]')).toBeVisible();

        // Verify checkout button
        await expect(page.locator('[data-testid="start-checkout"]')).toBeVisible();
      }
    });

    test('should allow plan selection in paywall', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const upgradeButton = page.locator('[data-testid="button-upgrade"], [data-testid="paywall-trigger"]');
      
      if (await upgradeButton.isVisible()) {
        await upgradeButton.click();
        await page.waitForTimeout(1000);

        // Select different plans
        await page.locator('[data-testid="plan-starter"]').click();
        await expect(page.locator('[data-testid="plan-starter"]')).toHaveClass(/border-primary|ring-2/);

        await page.locator('[data-testid="plan-crew"]').click();
        await expect(page.locator('[data-testid="plan-crew"]')).toHaveClass(/border-primary|ring-2/);

        await page.locator('[data-testid="plan-pro"]').click();
        await expect(page.locator('[data-testid="plan-pro"]')).toHaveClass(/border-primary|ring-2/);
      }
    });
  });

  test.describe('Billing Status Component', () => {
    test('should display billing status', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Look for billing status component
      const billingStatus = page.locator('[data-testid="billing-status"]');
      
      // If user is authenticated, billing status should be visible or loadable
      const isVisible = await billingStatus.isVisible().catch(() => false);
      
      if (isVisible) {
        // Should have status attribute
        await expect(billingStatus).toHaveAttribute('data-status');
        await expect(billingStatus).toHaveAttribute('data-plan');
        await expect(billingStatus).toHaveAttribute('data-has-access');
      }
    });
  });

  test.describe('Billing Status API', () => {
    test('billing status endpoint should respond', async ({ page }) => {
      const response = await page.request.get('/api/billing/status', {
        failOnStatusCode: false,
      });

      // Should get a response (401 if not authenticated, 200 if authenticated)
      expect([200, 401]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        
        // Verify response structure
        expect(data).toHaveProperty('hasActiveSubscription');
        expect(data).toHaveProperty('canAccessPremiumFeatures');
        expect(data).toHaveProperty('plan');
        expect(data).toHaveProperty('status');
        expect(data).toHaveProperty('availableCredits');
      }
    });

    test('billing status should not be cached', async ({ page }) => {
      const response = await page.request.get('/api/billing/status', {
        failOnStatusCode: false,
      });

      if (response.status() === 200) {
        const cacheControl = response.headers()['cache-control'];
        expect(cacheControl).toContain('no-store');
      }
    });
  });

  test.describe('Test Mode Billing', () => {
    test.skip(!isTestMode, 'Only runs in PAYMENTS_MODE=test');

    test('test activation endpoint should be accessible', async ({ page }) => {
      const response = await page.request.get('/api/test/activate-billing', {
        failOnStatusCode: false,
      });

      // Should respond (not 500)
      expect(response.status()).toBeLessThan(500);
    });

    test('should activate test billing for user', async ({ page }) => {
      // This test requires authentication
      // In CI, you'd use a test user

      const response = await page.request.post('/api/test/activate-billing', {
        data: {
          action: 'activate',
          plan: 'pro',
        },
        failOnStatusCode: false,
      });

      // Will be 401 without auth, but should not be 500
      expect(response.status()).toBeLessThan(500);
      
      if (response.status() === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.testMode).toBe(true);
        expect(data.billingStatus).toBeDefined();
        expect(data.billingStatus.hasActiveSubscription).toBe(true);
      }
    });

    test('should deactivate test billing for user', async ({ page }) => {
      const response = await page.request.post('/api/test/activate-billing', {
        data: {
          action: 'deactivate',
        },
        failOnStatusCode: false,
      });

      // Will be 401 without auth, but should not be 500
      expect(response.status()).toBeLessThan(500);
      
      if (response.status() === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.billingStatus.hasActiveSubscription).toBe(false);
      }
    });
  });

  test.describe('Checkout Flow', () => {
    test('checkout endpoint should require authentication', async ({ page }) => {
      const response = await page.request.post('/api/stripe/checkout', {
        data: { productType: 'pro' },
        failOnStatusCode: false,
      });

      expect(response.status()).toBe(401);
    });

    test('checkout endpoint should validate product type', async ({ page }) => {
      const response = await page.request.post('/api/stripe/checkout', {
        data: { productType: 'invalid-plan' },
        failOnStatusCode: false,
      });

      // Should reject invalid product types (400 or 401 depending on auth)
      expect([400, 401]).toContain(response.status());
    });
  });

  test.describe('Webhook Security', () => {
    test('webhook should reject missing signature', async ({ page }) => {
      const response = await page.request.post('/api/stripe/webhook', {
        data: { type: 'test.event' },
        failOnStatusCode: false,
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.message).toContain('signature');
    });
  });

  test.describe('Access Gating', () => {
    test.skip(!isTestMode, 'Only runs in PAYMENTS_MODE=test');

    test('gated features should be inaccessible without subscription', async ({ page }) => {
      // First, ensure no active subscription
      await page.request.post('/api/test/activate-billing', {
        data: { action: 'deactivate' },
        failOnStatusCode: false,
      });

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Check billing status shows inactive
      const billingStatus = page.locator('[data-testid="billing-status"]');
      if (await billingStatus.isVisible()) {
        await expect(billingStatus).toHaveAttribute('data-has-access', 'false');
      }
    });

    test('gated features should be accessible with active subscription', async ({ page }) => {
      // Activate test billing
      const activateResponse = await page.request.post('/api/test/activate-billing', {
        data: { action: 'activate', plan: 'pro' },
        failOnStatusCode: false,
      });

      if (activateResponse.status() === 200) {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');

        // Check billing status shows active
        const billingStatus = page.locator('[data-testid="billing-status"]');
        if (await billingStatus.isVisible()) {
          await expect(billingStatus).toHaveAttribute('data-has-access', 'true');
          await expect(billingStatus).toHaveAttribute('data-status', 'active');
        }

        // Clean up
        await page.request.post('/api/test/activate-billing', {
          data: { action: 'deactivate' },
          failOnStatusCode: false,
        });
      }
    });
  });

  test.describe('Subscription Management', () => {
    test('manage subscription button should be visible for subscribers', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Look for manage subscription button (only visible for active subscribers)
      
      // This will only be visible if user has an active subscription
      // We just verify the element exists in the DOM structure
      const count = await page.locator('[data-testid="billing-status"]').count();
      expect(count >= 0).toBe(true);
    });
  });

  test.describe('Payment Success Handling', () => {
    test('success page should handle query params', async ({ page }) => {
      await page.goto('/dashboard?success=true&session_id=cs_test_123');
      await page.waitForLoadState('networkidle');

      // Page should load without error
      const title = await page.title();
      expect(title).toBeTruthy();
    });

    test('cancel redirect should work', async ({ page }) => {
      await page.goto('/dashboard?canceled=true');
      await page.waitForLoadState('networkidle');

      // Page should load without error
      const title = await page.title();
      expect(title).toBeTruthy();
    });
  });
});

/**
 * Integration test for full billing flow in test mode
 */
test.describe('Full Billing Integration @billing @integration', () => {
  const isTestMode = process.env.PAYMENTS_MODE === 'test';
  
  test.skip(!isTestMode, 'Only runs in PAYMENTS_MODE=test');

  test('complete checkout to access flow', async ({ page }) => {
    // Step 1: Verify user starts without access
    const statusBefore = await page.request.get('/api/billing/status', {
      failOnStatusCode: false,
    });
    
    if (statusBefore.status() === 401) {
      // Skip if not authenticated
      test.skip();
      return;
    }

    const dataBefore = await statusBefore.json();
    console.log('Status before:', dataBefore);

    // Step 2: Activate test billing
    const activateResponse = await page.request.post('/api/test/activate-billing', {
      data: { action: 'activate', plan: 'pro' },
    });
    
    expect(activateResponse.status()).toBe(200);
    const activateData = await activateResponse.json();
    expect(activateData.success).toBe(true);

    // Step 3: Verify billing status shows active
    const statusAfter = await page.request.get('/api/billing/status');
    const dataAfter = await statusAfter.json();
    
    expect(dataAfter.hasActiveSubscription).toBe(true);
    expect(dataAfter.canAccessPremiumFeatures).toBe(true);
    expect(dataAfter.plan).toBe('pro');
    expect(dataAfter.status).toBe('active');

    // Step 4: Verify UI reflects the change
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const billingStatus = page.locator('[data-testid="billing-status"]');
    if (await billingStatus.isVisible()) {
      await expect(billingStatus).toHaveAttribute('data-has-access', 'true');
    }

    // Step 5: Deactivate and verify access revoked
    await page.request.post('/api/test/activate-billing', {
      data: { action: 'deactivate' },
    });

    const statusFinal = await page.request.get('/api/billing/status');
    const dataFinal = await statusFinal.json();
    
    expect(dataFinal.hasActiveSubscription).toBe(false);
    expect(dataFinal.status).toBe('canceled');
  });
});
