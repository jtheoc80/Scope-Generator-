import { test, expect } from '@playwright/test';

/**
 * Regression Test: Data Provider Strings
 * 
 * This test ensures that public-facing pages do not contain
 * third-party data provider names (RSMeans, HomeAdvisor, 1build)
 * unless we have documented licensing agreements in the repository.
 * 
 * These strings were removed as part of a legal/compliance audit.
 * If this test fails, ensure you have proper licensing documentation
 * before re-adding any vendor names.
 */

// Forbidden strings that should not appear in public-facing pages
// unless backed by licensing documentation in the repository
const FORBIDDEN_DATA_PROVIDER_STRINGS = [
  'RSMeans',
  'HomeAdvisor',
  'Powered by 1build',
  '1build.com',
  '1build cost data',
  '1build data',
];

// Public pages that should be audited for data provider claims
const PAGES_TO_AUDIT = [
  '/calculator',
  '/market-pricing',
];

test.describe('Data Provider Compliance', () => {
  for (const pagePath of PAGES_TO_AUDIT) {
    test(`should not contain forbidden data provider strings on ${pagePath}`, async ({ page }) => {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');

      // Get the full page text content
      const pageContent = await page.textContent('body');
      
      // Check for each forbidden string
      for (const forbiddenString of FORBIDDEN_DATA_PROVIDER_STRINGS) {
        const containsForbidden = pageContent?.includes(forbiddenString);
        
        expect(
          containsForbidden,
          `Page ${pagePath} should not contain "${forbiddenString}". ` +
          `If you need to add this vendor name, please first add licensing documentation to the repository.`
        ).toBe(false);
      }
    });
  }

  test('calculator page should display estimate disclaimer', async ({ page }) => {
    await page.goto('/calculator');
    await page.waitForLoadState('networkidle');

    // Select options to show the estimate
    await page.locator('[data-testid="select-trade"]').selectOption('bathroom');
    await page.locator('[data-testid="select-job-type"]').selectOption('full-gut');
    await page.locator('[data-testid="button-size-medium"]').click();

    // Wait for estimate to appear
    await expect(page.locator('[data-testid="text-price-range"]')).toBeVisible({ timeout: 5000 });

    // Check for disclaimer
    const disclaimer = page.locator('[data-testid="estimate-disclaimer"]');
    await expect(disclaimer).toBeVisible();
    await expect(disclaimer).toContainText('Estimates are directional');
    await expect(disclaimer).toContainText('site conditions');
  });

  test('calculator methodology section should use neutral language', async ({ page }) => {
    await page.goto('/calculator');
    await page.waitForLoadState('networkidle');

    // Find the methodology section
    const methodologyHeading = page.locator('[data-testid="heading-methodology"]');
    await expect(methodologyHeading).toBeVisible();

    // Check that the "National Baseline" description uses neutral language
    const pageContent = await page.textContent('body');
    
    // Should contain neutral language
    expect(pageContent).toContain('industry cost databases');
    expect(pageContent).toContain('public market benchmarks');
    
    // Should NOT contain specific vendor names
    expect(pageContent).not.toContain('RSMeans');
    expect(pageContent).not.toContain('HomeAdvisor');
  });

  test('market pricing page should use neutral data source language', async ({ page }) => {
    await page.goto('/market-pricing');
    await page.waitForLoadState('networkidle');

    const pageContent = await page.textContent('body');
    
    // Should contain neutral language alternatives
    expect(pageContent).toContain('Real-Time Cost Data');
    
    // Should NOT contain specific vendor branding in marketing copy
    expect(pageContent).not.toContain('Powered by 1build');
    expect(pageContent).not.toContain('1build.com');
  });
});

/**
 * Note: Internal code (console logs, API variable names, service class names)
 * may still reference vendor names for technical implementation purposes.
 * This test specifically targets public-facing UI copy.
 * 
 * If you need to add a licensed data provider:
 * 1. Add licensing documentation to /docs/data-licensing/ or similar
 * 2. Update this test to exclude the newly-licensed provider
 * 3. Get legal/compliance approval before merging
 */
