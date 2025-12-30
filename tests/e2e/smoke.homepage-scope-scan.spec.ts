import { test, expect } from '@playwright/test';

/**
 * Smoke Test: Homepage ScopeScan Marketing Section + ScopeScan Landing Page
 * 
 * Tests the marketing-focused ScopeScan teaser on the homepage and the
 * separate /scopescan landing page.
 */

// Mobile tests with iPhone viewport
test.describe('Homepage ScopeScan Teaser - Mobile', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport (375px for the requirement)
    await page.setViewportSize({ width: 375, height: 812 });
  });

  test('should display ScopeScan teaser section after "Tired..." section', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    // Pain points section should be visible
    const painPointsSection = page.locator('[data-testid="section-pain-points"]');
    await expect(painPointsSection).toBeVisible({ timeout: 15000 });

    // ScopeScan teaser section should be visible
    const scopeScanTeaser = page.locator('[data-testid="section-scopescan-teaser"]');
    await expect(scopeScanTeaser).toBeVisible({ timeout: 15000 });

    // Verify the order: pain-points section comes before scopescan-teaser
    // Both sections should exist and scopescan-teaser should appear after pain-points in DOM order
    const painPointsBox = await painPointsSection.boundingBox();
    const scopeScanBox = await scopeScanTeaser.boundingBox();
    
    expect(painPointsBox).toBeTruthy();
    expect(scopeScanBox).toBeTruthy();
    
    // ScopeScan teaser should be below the pain points section
    if (painPointsBox && scopeScanBox) {
      expect(scopeScanBox.y).toBeGreaterThan(painPointsBox.y);
    }
  });

  test('should display teaser headline and CTA buttons', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    // Wait for teaser section to be visible
    const scopeScanTeaser = page.locator('[data-testid="section-scopescan-teaser"]');
    await expect(scopeScanTeaser).toBeVisible({ timeout: 15000 });

    // Teaser headline should be visible
    const headline = page.locator('[data-testid="scopescan-teaser-headline"]');
    await expect(headline).toBeVisible();
    await expect(headline).toContainText(/ScopeScan/i);

    // Primary CTA should link to /scopescan/demo (Try Demo)
    const primaryCta = page.locator('[data-testid="teaser-cta-primary"]');
    await expect(primaryCta).toBeVisible();
    await expect(primaryCta).toHaveAttribute('href', '/scopescan/demo');

    // Secondary CTA should link to /scopescan (Learn More)
    const secondaryCta = page.locator('[data-testid="teaser-cta-secondary"]');
    await expect(secondaryCta).toBeVisible();
    await expect(secondaryCta).toHaveAttribute('href', '/scopescan');
  });

  test('should display image thumbnails in teaser', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    const scopeScanTeaser = page.locator('[data-testid="section-scopescan-teaser"]');
    await expect(scopeScanTeaser).toBeVisible({ timeout: 15000 });

    // Thumbnails grid should be visible
    const thumbnails = page.locator('[data-testid="scopescan-teaser-thumbnails"]');
    await expect(thumbnails).toBeVisible();
  });

  test('should NOT show Take Photo button on homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    // Wait for teaser section to be visible
    const scopeScanTeaser = page.locator('[data-testid="section-scopescan-teaser"]');
    await expect(scopeScanTeaser).toBeVisible({ timeout: 15000 });

    // Take Photo button should NOT exist on homepage
    const takePhotoButton = page.locator('[data-testid="button-take-photo"]');
    await expect(takePhotoButton).not.toBeVisible();

    // Upload Photo button should NOT exist on homepage
    const uploadPhotoButton = page.locator('[data-testid="button-upload-photo"]');
    await expect(uploadPhotoButton).not.toBeVisible();

    // Also verify text "Take Photo" does not appear on the page
    const pageContent = await page.content();
    expect(pageContent).not.toContain('Take Photo');
  });

  test('homepage has link to /scopescan or /scopescan/demo', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    // There should be links to either /scopescan or /scopescan/demo on the homepage
    const scopescanLink = page.locator('a[href="/scopescan"]');
    const scopescanDemoLink = page.locator('a[href="/scopescan/demo"]');
    
    // Either link should be visible
    const hasScopescan = await scopescanLink.first().isVisible().catch(() => false);
    const hasScopescanDemo = await scopescanDemoLink.first().isVisible().catch(() => false);
    
    expect(hasScopescan || hasScopescanDemo).toBe(true);
  });
});

// Desktop tests with default viewport
test.describe('Homepage ScopeScan Teaser - Desktop', () => {
  test('should display teaser section on desktop viewport', async ({ page }) => {
    // Default viewport is desktop
    await page.goto('/');
    await page.waitForLoadState('load');

    // ScopeScan teaser section should be visible
    const scopeScanTeaser = page.locator('[data-testid="section-scopescan-teaser"]');
    await expect(scopeScanTeaser).toBeVisible({ timeout: 15000 });

    // Teaser headline should be visible
    const headline = page.locator('[data-testid="scopescan-teaser-headline"]');
    await expect(headline).toBeVisible();

    // Both CTAs should be visible
    const primaryCta = page.locator('[data-testid="teaser-cta-primary"]');
    await expect(primaryCta).toBeVisible();

    const secondaryCta = page.locator('[data-testid="teaser-cta-secondary"]');
    await expect(secondaryCta).toBeVisible();
  });

  test('should NOT show Take Photo or Upload Photo buttons on homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    const scopeScanTeaser = page.locator('[data-testid="section-scopescan-teaser"]');
    await expect(scopeScanTeaser).toBeVisible({ timeout: 15000 });

    // Old capture UI buttons should NOT exist
    const takePhotoButton = page.locator('[data-testid="button-take-photo"]');
    await expect(takePhotoButton).not.toBeVisible();

    const uploadPhotoButton = page.locator('[data-testid="button-upload-photo"]');
    await expect(uploadPhotoButton).not.toBeVisible();

    // Old empty state should NOT exist
    const oldEmptyState = page.locator('[data-testid="scope-scan-empty-state"]');
    await expect(oldEmptyState).not.toBeVisible();
  });

  test('desktop hero section should still work alongside teaser', async ({ page }) => {
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

  test('calculator section appears before "Tired..." section in DOM order', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    // Calculator is in the hero section - look for the trade select
    const calculatorSelect = page.locator('[data-testid="select-trade"]');
    await expect(calculatorSelect).toBeVisible({ timeout: 15000 });

    // Pain points section ("Tired..." heading)
    const painPointsSection = page.locator('[data-testid="section-pain-points"]');
    await expect(painPointsSection).toBeVisible();

    // Calculator should be above pain points in layout
    const calcBox = await calculatorSelect.boundingBox();
    const painBox = await painPointsSection.boundingBox();

    expect(calcBox).toBeTruthy();
    expect(painBox).toBeTruthy();

    if (calcBox && painBox) {
      expect(painBox.y).toBeGreaterThan(calcBox.y);
    }
  });
});

// ScopeScan Landing Page tests
test.describe('/scopescan Landing Page', () => {
  test('should render hero + proof section', async ({ page }) => {
    await page.goto('/scopescan');
    await page.waitForLoadState('load');

    // Hero section should be visible
    const hero = page.locator('[data-testid="scopescan-hero"]');
    await expect(hero).toBeVisible({ timeout: 15000 });

    // Headline should be visible
    const headline = page.locator('[data-testid="scopescan-headline"]');
    await expect(headline).toBeVisible();
    await expect(headline).toContainText(/Turn Job Site Photos Into Detailed Proposals/i);

    // Proof section should be visible
    const proofSection = page.locator('[data-testid="scopescan-proof-section"]');
    await expect(proofSection).toBeVisible();

    // Example projects grid should be visible
    const examplesGrid = page.locator('[data-testid="example-projects-grid"]');
    await expect(examplesGrid).toBeVisible();
  });

  test('clicking "Try Demo" navigates to demo page (no auth required)', async ({ page }) => {
    await page.goto('/scopescan');
    await page.waitForLoadState('load');

    // Click the primary CTA (Try Demo)
    const tryDemoButton = page.locator('[data-testid="cta-try-demo"]');
    await expect(tryDemoButton).toBeVisible({ timeout: 15000 });
    await tryDemoButton.click();

    // Should navigate to /scopescan/demo
    await page.waitForURL('**/scopescan/demo', { timeout: 15000 });
    expect(page.url()).toContain('/scopescan/demo');

    // Demo page should show demo content
    const demoBanner = page.locator('[data-testid="demo-mode-banner"]');
    await expect(demoBanner).toBeVisible({ timeout: 15000 });
  });

  test('"Start ScopeScan" link includes sign-in redirect', async ({ page }) => {
    await page.goto('/scopescan');
    await page.waitForLoadState('load');

    // Start ScopeScan button should link to sign-in with redirect
    const startButton = page.locator('[data-testid="cta-start-scopescan"]');
    await expect(startButton).toBeVisible({ timeout: 15000 });
    
    const href = await startButton.getAttribute('href');
    expect(href).toContain('sign-in');
    expect(href).toContain('redirect_url');
    expect(href).toContain('%2Fm%2Fcreate');
  });

  test('page should load without errors', async ({ page }) => {
    const response = await page.goto('/scopescan');
    expect(response?.status()).toBeLessThan(400);
  });
});

// Tablet tests
test.describe('Homepage ScopeScan Teaser - Tablet', () => {
  test.beforeEach(async ({ page }) => {
    // Set tablet viewport (iPad Mini)
    await page.setViewportSize({ width: 768, height: 1024 });
  });

  test('should display teaser section on tablet viewport', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    // ScopeScan teaser section should be visible
    const scopeScanTeaser = page.locator('[data-testid="section-scopescan-teaser"]');
    await expect(scopeScanTeaser).toBeVisible({ timeout: 15000 });

    // CTAs should be visible
    const primaryCta = page.locator('[data-testid="teaser-cta-primary"]');
    await expect(primaryCta).toBeVisible();
  });
});
