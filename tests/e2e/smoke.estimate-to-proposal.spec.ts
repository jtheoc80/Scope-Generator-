import { test, expect } from '@playwright/test';

/**
 * Smoke Test: Estimate to Proposal Handoff
 * 
 * Tests the seamless handoff from the Instant Price Estimate (calculator)
 * into the Proposal Generator with prefilled context via URL params.
 * 
 * Feature: When a user completes an estimate, clicking "Turn into a Proposal"
 * should open the create page with fields prefilled (trade/job type/size/zip).
 * 
 * Note: These tests focus on the URL param handoff mechanism. The actual
 * prefill UI behavior requires auth setup and is tested via unit tests.
 */

test.describe('Estimate to Proposal Handoff', () => {
  
  test('calculator CTA button should include estimate params in URL', async ({ page }) => {
    // Go to calculator
    await page.goto('/calculator');
    await page.waitForLoadState('networkidle');

    // Verify calculator page loaded
    const calculatorTitle = page.locator('[data-testid="heading-calculator-title"]');
    await expect(calculatorTitle).toBeVisible({ timeout: 15000 });

    // Select trade (bathroom)
    const tradeSelect = page.locator('[data-testid="select-trade"]');
    await tradeSelect.selectOption('bathroom');
    
    // Wait for React state to update (longer wait for memo recalculation)
    await page.waitForTimeout(2000);

    // Wait for job type select to be enabled
    const jobTypeSelect = page.locator('[data-testid="select-job-type"]');
    await expect(jobTypeSelect).toBeEnabled({ timeout: 5000 });
    await jobTypeSelect.selectOption('tub-to-shower');
    await page.waitForTimeout(1000);

    // Select size (medium)
    const mediumSizeButton = page.locator('[data-testid="button-size-medium"]');
    await expect(mediumSizeButton).toBeEnabled({ timeout: 5000 });
    await mediumSizeButton.click();
    await page.waitForTimeout(500);

    // Enter ZIP code
    const zipInput = page.locator('[data-testid="input-zip-code"]');
    await zipInput.fill('77339');
    
    // Wait for price calculation to complete
    await page.waitForTimeout(2000);
    
    // Price should be visible (which means the CTA is also visible)
    const priceRange = page.locator('[data-testid="text-price-range"]');
    await expect(priceRange).toBeVisible({ timeout: 10000 });

    // Now check the CTA button href
    const ctaButton = page.locator('[data-testid="button-get-proposal"]');
    await expect(ctaButton).toBeVisible();
    
    const href = await ctaButton.getAttribute('href');
    expect(href).toContain('trade=bathroom');
    expect(href).toContain('jobType=tub-to-shower');
    expect(href).toContain('size=medium');
    expect(href).toContain('zip=77339');
  });

  test('calculator CTA navigates to create page with params', async ({ page }) => {
    // Go to calculator
    await page.goto('/calculator');
    await page.waitForLoadState('networkidle');

    // Verify calculator page loaded
    await expect(page.locator('[data-testid="heading-calculator-title"]')).toBeVisible({ timeout: 15000 });

    // Select trade
    await page.locator('[data-testid="select-trade"]').selectOption('painting');
    await page.waitForTimeout(2000);

    // Wait for job type select to be enabled and select it
    const jobTypeSelect = page.locator('[data-testid="select-job-type"]');
    await expect(jobTypeSelect).toBeEnabled({ timeout: 5000 });
    await jobTypeSelect.selectOption('whole-house');
    await page.waitForTimeout(1000);

    // Select size
    const mediumSizeButton = page.locator('[data-testid="button-size-medium"]');
    await expect(mediumSizeButton).toBeEnabled({ timeout: 5000 });
    await mediumSizeButton.click();
    
    // Wait for price calculation
    await page.waitForTimeout(2000);
    
    // Price should be visible
    await expect(page.locator('[data-testid="text-price-range"]')).toBeVisible({ timeout: 10000 });

    // The CTA button should exist and have the correct href
    const ctaButton = page.locator('[data-testid="button-get-proposal"]');
    await expect(ctaButton).toHaveText(/Turn into a Proposal/);
    
    const href = await ctaButton.getAttribute('href');
    expect(href).toContain('/m/create');
    expect(href).toContain('trade=painting');
    
    // Click the CTA
    await ctaButton.click();

    // Verify we navigated to the create page with params
    await page.waitForURL(/\/m\/create/, { timeout: 15000 });
    const url = page.url();
    expect(url).toContain('trade=painting');
  });

  test('custom sqft param is included in URL', async ({ page }) => {
    // Go to calculator
    await page.goto('/calculator');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-testid="heading-calculator-title"]')).toBeVisible({ timeout: 15000 });

    // Select trade
    await page.locator('[data-testid="select-trade"]').selectOption('flooring');
    await page.waitForTimeout(1000);

    // Check if we can select custom size
    const customSizeButton = page.locator('[data-testid="button-size-custom"]');
    if (await customSizeButton.isEnabled()) {
      await customSizeButton.click();
      await page.waitForTimeout(500);

      // Enter custom sqft
      const customSqftInput = page.locator('[data-testid="input-custom-sqft"]');
      await customSqftInput.fill('350');
      await page.waitForTimeout(500);

      // Check that sqft is in the href
      const ctaButton = page.locator('[data-testid="button-get-proposal"]');
      const href = await ctaButton.getAttribute('href');
      expect(href).toContain('size=custom');
      expect(href).toContain('sqft=350');
    }
  });

  test('footer CTA also includes params', async ({ page }) => {
    // Go to calculator
    await page.goto('/calculator');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-testid="heading-calculator-title"]')).toBeVisible({ timeout: 15000 });

    // Select trade
    await page.locator('[data-testid="select-trade"]').selectOption('hvac');
    
    // Wait for React to update the memo'd URL
    await page.waitForTimeout(2000);

    // Check footer CTA href - scroll to it first
    const footerCta = page.locator('[data-testid="button-footer-cta"]');
    await footerCta.scrollIntoViewIfNeeded();
    await expect(footerCta).toHaveText(/Turn into a Proposal/);
    
    // Wait a bit more for any re-renders
    await page.waitForTimeout(500);
    
    const href = await footerCta.getAttribute('href');
    expect(href).toContain('/m/create');
    expect(href).toContain('trade=hvac');
  });

  test('invalid params do not crash the create page', async ({ page }) => {
    // Navigate with invalid params
    await page.goto('/m/create?trade=invalid_trade&size=huge&zip=abc');
    
    // Page should load (even if showing loading state)
    await page.waitForLoadState('networkidle');
    
    // The page should not crash - body should be visible
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
    
    // URL should still have the params (they're not stripped)
    const url = page.url();
    expect(url).toContain('trade=invalid_trade');
  });

  test('empty params work correctly', async ({ page }) => {
    // Navigate to create page with no params
    await page.goto('/m/create');
    await page.waitForLoadState('networkidle');
    
    // Page should load without crashing
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
    
    // URL should not have query params
    const url = page.url();
    expect(url).not.toContain('?');
  });
});
