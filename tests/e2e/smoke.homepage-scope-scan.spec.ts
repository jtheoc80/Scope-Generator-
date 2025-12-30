import { test, expect } from '@playwright/test';

/**
 * Smoke Test: Homepage ScopeScan Marketing Section
 * 
 * Tests the marketing-focused ScopeScan section on the homepage.
 * Verifies marketing content and CTA navigation.
 */

// Mobile tests with iPhone viewport
test.describe('Homepage ScopeScan Marketing - Mobile', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport (375px for the requirement)
    await page.setViewportSize({ width: 375, height: 812 });
  });

  test('should display marketing headline and subheadline', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    // ScopeScan section should be visible
    const scopeScanSection = page.locator('[data-testid="section-scope-scan"]');
    await expect(scopeScanSection).toBeVisible({ timeout: 15000 });

    // Marketing headline should be visible
    const heading = page.locator('[data-testid="scope-scan-heading"]');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(/Turn Job Site Photos Into Detailed Proposals/i);

    // Subheadline should be visible
    const subheadline = page.locator('[data-testid="scope-scan-subheadline"]');
    await expect(subheadline).toBeVisible();
    await expect(subheadline).toContainText(/ScopeScan uses AI/i);
  });

  test('should display CTA buttons that link to ScopeScan page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    // Wait for section to be visible
    const scopeScanSection = page.locator('[data-testid="section-scope-scan"]');
    await expect(scopeScanSection).toBeVisible({ timeout: 15000 });

    // Primary CTA should link to /m/create
    const primaryCta = page.locator('[data-testid="cta-try-scopescan"]');
    await expect(primaryCta).toBeVisible();
    await expect(primaryCta).toHaveAttribute('href', '/m/create');

    // Secondary CTA should link to sample proposal section
    const secondaryCta = page.locator('[data-testid="cta-see-sample"]');
    await expect(secondaryCta).toBeVisible();
    await expect(secondaryCta).toHaveAttribute('href', '#demo');
  });

  test('should NOT show Take Photo button on homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    // Wait for section to be visible
    const scopeScanSection = page.locator('[data-testid="section-scope-scan"]');
    await expect(scopeScanSection).toBeVisible({ timeout: 15000 });

    // Take Photo button should NOT exist on homepage
    const takePhotoButton = page.locator('[data-testid="button-take-photo"]');
    await expect(takePhotoButton).not.toBeVisible();

    // Upload Photo button should NOT exist on homepage
    const uploadPhotoButton = page.locator('[data-testid="button-upload-photo"]');
    await expect(uploadPhotoButton).not.toBeVisible();
  });

  test('clicking CTA should navigate to ScopeScan page with Start ScopeScan button', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    // Wait for section to be visible
    const scopeScanSection = page.locator('[data-testid="section-scope-scan"]');
    await expect(scopeScanSection).toBeVisible({ timeout: 15000 });

    // Click the primary CTA
    const primaryCta = page.locator('[data-testid="cta-try-scopescan"]');
    await primaryCta.click();

    // Should navigate to /m/create
    await page.waitForURL('**/m/create', { timeout: 15000 });
    expect(page.url()).toContain('/m/create');

    // The ScopeScan page should have a Start ScopeScan button
    const startButton = page.getByRole('button', { name: /Start ScopeScan/i });
    await expect(startButton).toBeVisible({ timeout: 15000 });
  });

  test('should display three benefits', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    const scopeScanSection = page.locator('[data-testid="section-scope-scan"]');
    await expect(scopeScanSection).toBeVisible({ timeout: 15000 });

    // Three benefit cards should be visible
    const benefit1 = page.locator('[data-testid="benefit-1"]');
    const benefit2 = page.locator('[data-testid="benefit-2"]');
    const benefit3 = page.locator('[data-testid="benefit-3"]');

    await expect(benefit1).toBeVisible();
    await expect(benefit2).toBeVisible();
    await expect(benefit3).toBeVisible();
  });

  test('should display example projects grid', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    const scopeScanSection = page.locator('[data-testid="section-scope-scan"]');
    await expect(scopeScanSection).toBeVisible({ timeout: 15000 });

    // Example projects grid should be visible
    const examplesGrid = page.locator('[data-testid="example-projects-grid"]');
    await expect(examplesGrid).toBeVisible();
  });
});

// Desktop tests with default viewport
test.describe('Homepage ScopeScan Marketing - Desktop', () => {
  test('should display marketing section on desktop viewport', async ({ page }) => {
    // Default viewport is desktop
    await page.goto('/');
    await page.waitForLoadState('load');

    // ScopeScan section should be visible
    const scopeScanSection = page.locator('[data-testid="section-scope-scan"]');
    await expect(scopeScanSection).toBeVisible({ timeout: 15000 });

    // Marketing headline should be visible
    const heading = page.locator('[data-testid="scope-scan-heading"]');
    await expect(heading).toBeVisible();

    // Both CTAs should be visible
    const primaryCta = page.locator('[data-testid="cta-try-scopescan"]');
    await expect(primaryCta).toBeVisible();

    const secondaryCta = page.locator('[data-testid="cta-see-sample"]');
    await expect(secondaryCta).toBeVisible();
  });

  test('should NOT show Take Photo or Upload Photo buttons on homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    const scopeScanSection = page.locator('[data-testid="section-scope-scan"]');
    await expect(scopeScanSection).toBeVisible({ timeout: 15000 });

    // Old capture UI buttons should NOT exist
    const takePhotoButton = page.locator('[data-testid="button-take-photo"]');
    await expect(takePhotoButton).not.toBeVisible();

    const uploadPhotoButton = page.locator('[data-testid="button-upload-photo"]');
    await expect(uploadPhotoButton).not.toBeVisible();

    // Old empty state should NOT exist
    const oldEmptyState = page.locator('[data-testid="scope-scan-empty-state"]');
    await expect(oldEmptyState).not.toBeVisible();
  });

  test('desktop hero section should still work alongside marketing ScopeScan', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    // Hero section should still work
    const tryFreeButton = page.locator('[data-testid="button-try-free-proposal"]');
    await expect(tryFreeButton).toBeVisible({ timeout: 15000 });

    // Stats should still work
    const statProposals = page.locator('[data-testid="stat-proposals"]');
    await expect(statProposals).toBeVisible();
  });

  test('page should load without 4xx/5xx errors', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(400);
  });
});

// Tablet tests
test.describe('Homepage ScopeScan Marketing - Tablet', () => {
  test.beforeEach(async ({ page }) => {
    // Set tablet viewport (iPad Mini)
    await page.setViewportSize({ width: 768, height: 1024 });
  });

  test('should display marketing section on tablet viewport', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    // ScopeScan section should be visible
    const scopeScanSection = page.locator('[data-testid="section-scope-scan"]');
    await expect(scopeScanSection).toBeVisible({ timeout: 15000 });

    // CTAs should be visible
    const primaryCta = page.locator('[data-testid="cta-try-scopescan"]');
    await expect(primaryCta).toBeVisible();
  });
});
