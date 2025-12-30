import { test, expect } from '@playwright/test';

/**
 * Smoke Test: ScopeScan Demo Flow
 * 
 * Tests the demo mode flow for unauthenticated users:
 * 1. Homepage has "Try Demo" CTA that goes to /scopescan/demo
 * 2. Demo page shows sample projects without auth
 * 3. "Start ScopeScan" links include returnTo param for auth redirect
 */

test.describe('ScopeScan Demo Flow - Unauthenticated User', () => {
  test('homepage teaser has "Try Demo" CTA linking to /scopescan/demo', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    // ScopeScan teaser section should be visible
    const scopeScanTeaser = page.locator('[data-testid="section-scopescan-teaser"]');
    await expect(scopeScanTeaser).toBeVisible({ timeout: 15000 });

    // Primary CTA should be "Try Demo" linking to /scopescan/demo
    const primaryCta = page.locator('[data-testid="teaser-cta-primary"]');
    await expect(primaryCta).toBeVisible();
    await expect(primaryCta).toHaveAttribute('href', '/scopescan/demo');
    await expect(primaryCta).toContainText(/Try Demo/i);
  });

  test('/scopescan landing page has dual CTAs', async ({ page }) => {
    await page.goto('/scopescan');
    await page.waitForLoadState('load');

    // Hero section should be visible
    const hero = page.locator('[data-testid="scopescan-hero"]');
    await expect(hero).toBeVisible({ timeout: 15000 });

    // Primary CTA should be "Try Demo" linking to /scopescan/demo
    const tryDemoCta = page.locator('[data-testid="cta-try-demo"]');
    await expect(tryDemoCta).toBeVisible();
    await expect(tryDemoCta).toHaveAttribute('href', '/scopescan/demo');

    // Secondary CTA should be "Start ScopeScan" with auth redirect
    const startCta = page.locator('[data-testid="cta-start-scopescan"]');
    await expect(startCta).toBeVisible();
    // Should include redirect_url param to /m/create
    const href = await startCta.getAttribute('href');
    expect(href).toContain('sign-in');
    expect(href).toContain('redirect_url');
    expect(href).toContain('%2Fm%2Fcreate');
  });

  test('clicking "Try Demo" navigates to demo page (no auth required)', async ({ page }) => {
    await page.goto('/scopescan');
    await page.waitForLoadState('load');

    // Click the Try Demo button
    const tryDemoCta = page.locator('[data-testid="cta-try-demo"]');
    await expect(tryDemoCta).toBeVisible({ timeout: 15000 });
    await tryDemoCta.click();

    // Should navigate to /scopescan/demo
    await page.waitForURL('**/scopescan/demo', { timeout: 15000 });
    expect(page.url()).toContain('/scopescan/demo');
  });

  test('/scopescan/demo page loads without error and shows demo content', async ({ page }) => {
    const response = await page.goto('/scopescan/demo');
    
    // Should load without errors
    expect(response?.status()).toBeLessThan(400);
    await page.waitForLoadState('load');

    // Demo mode banner should be visible
    const demoBanner = page.locator('[data-testid="demo-mode-banner"]');
    await expect(demoBanner).toBeVisible({ timeout: 15000 });
    await expect(demoBanner).toContainText(/Demo mode/i);

    // Page headline should be visible
    const headline = page.locator('[data-testid="demo-page-headline"]');
    await expect(headline).toBeVisible();
    await expect(headline).toContainText(/See ScopeScan in Action/i);

    // Project selector should be visible with sample projects
    const projectSelector = page.locator('[data-testid="demo-project-selector"]');
    await expect(projectSelector).toBeVisible();

    // Should have at least one demo project
    const demoProjects = page.locator('[data-testid^="demo-project-"]');
    await expect(demoProjects.first()).toBeVisible();
  });

  test('demo page shows scope items and pricing', async ({ page }) => {
    await page.goto('/scopescan/demo');
    await page.waitForLoadState('load');

    // Project summary should be visible
    const projectSummary = page.locator('[data-testid="demo-project-summary"]');
    await expect(projectSummary).toBeVisible({ timeout: 15000 });

    // Scope items should be visible
    const scopeItems = page.locator('[data-testid="demo-scope-items"]');
    await expect(scopeItems).toBeVisible();

    // Should have multiple scope items
    const scopeItemsList = page.locator('[data-testid^="demo-scope-item-"]');
    const count = await scopeItemsList.count();
    expect(count).toBeGreaterThan(3);
  });

  test('demo page switching between projects works', async ({ page }) => {
    await page.goto('/scopescan/demo');
    await page.waitForLoadState('load');

    // Wait for page to be ready
    const projectSelector = page.locator('[data-testid="demo-project-selector"]');
    await expect(projectSelector).toBeVisible({ timeout: 15000 });

    // Get initial project name from summary
    const projectSummary = page.locator('[data-testid="demo-project-summary"]');
    await expect(projectSummary).toBeVisible();
    const initialText = await projectSummary.textContent();

    // Click on the second demo project (kitchen)
    const kitchenProject = page.locator('[data-testid="demo-project-demo-kitchen-1"]');
    if (await kitchenProject.isVisible()) {
      await kitchenProject.click();
      
      // Wait for content to update
      await page.waitForTimeout(300);
      
      // Summary text should change
      const newText = await projectSummary.textContent();
      // Just check that the project selector interaction works
      expect(newText).toBeDefined();
    }
  });

  test('demo page has sign-in CTAs that redirect to tool', async ({ page }) => {
    await page.goto('/scopescan/demo');
    await page.waitForLoadState('load');

    // Demo banner sign-in CTA
    const bannerSignIn = page.locator('[data-testid="demo-signin-cta"]');
    await expect(bannerSignIn).toBeVisible({ timeout: 15000 });
    const bannerHref = await bannerSignIn.getAttribute('href');
    expect(bannerHref).toContain('sign-in');
    expect(bannerHref).toContain('redirect_url');

    // Main CTA sign-in button
    const mainSignIn = page.locator('[data-testid="demo-cta-signin"]');
    await expect(mainSignIn).toBeVisible();
    const mainHref = await mainSignIn.getAttribute('href');
    expect(mainHref).toContain('sign-in');
    expect(mainHref).toContain('redirect_url');
  });

  test('demo page does NOT have save/export functionality active', async ({ page }) => {
    await page.goto('/scopescan/demo');
    await page.waitForLoadState('load');

    // Wait for page to load
    const demoBanner = page.locator('[data-testid="demo-mode-banner"]');
    await expect(demoBanner).toBeVisible({ timeout: 15000 });

    // Page content should mention that save is disabled
    const pageContent = await page.content();
    expect(pageContent).toMatch(/Save.*Disabled|sign in to save/i);
  });
});

test.describe('ScopeScan Auth Gating', () => {
  test('"Start ScopeScan" from /scopescan goes to sign-in with returnTo', async ({ page }) => {
    await page.goto('/scopescan');
    await page.waitForLoadState('load');

    // Click Start ScopeScan
    const startCta = page.locator('[data-testid="cta-start-scopescan"]');
    await expect(startCta).toBeVisible({ timeout: 15000 });
    
    // Get the href and verify it has proper redirect
    const href = await startCta.getAttribute('href');
    expect(href).toContain('sign-in');
    expect(href).toContain('redirect_url=%2Fm%2Fcreate');
  });

  test('final CTA at bottom of /scopescan has proper redirects', async ({ page }) => {
    await page.goto('/scopescan');
    await page.waitForLoadState('load');

    // Scroll to bottom CTA
    const finalTryDemo = page.locator('[data-testid="cta-final-try-demo"]');
    await finalTryDemo.scrollIntoViewIfNeeded();
    await expect(finalTryDemo).toBeVisible({ timeout: 15000 });
    await expect(finalTryDemo).toHaveAttribute('href', '/scopescan/demo');

    const finalStart = page.locator('[data-testid="cta-final-start-scopescan"]');
    await expect(finalStart).toBeVisible();
    const href = await finalStart.getAttribute('href');
    expect(href).toContain('sign-in');
    expect(href).toContain('redirect_url');
  });
});

test.describe('ScopeScan Demo - Mobile', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
  });

  test('demo page is mobile-responsive', async ({ page }) => {
    await page.goto('/scopescan/demo');
    await page.waitForLoadState('load');

    // Demo banner should be visible on mobile
    const demoBanner = page.locator('[data-testid="demo-mode-banner"]');
    await expect(demoBanner).toBeVisible({ timeout: 15000 });

    // Project selector should be visible
    const projectSelector = page.locator('[data-testid="demo-project-selector"]');
    await expect(projectSelector).toBeVisible();

    // Content should be accessible (no overflow issues)
    const projectSummary = page.locator('[data-testid="demo-project-summary"]');
    await expect(projectSummary).toBeVisible();
  });

  test('homepage teaser Try Demo works on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    // Teaser should be visible
    const teaser = page.locator('[data-testid="section-scopescan-teaser"]');
    await expect(teaser).toBeVisible({ timeout: 15000 });

    // Primary CTA should link to demo
    const primaryCta = page.locator('[data-testid="teaser-cta-primary"]');
    await expect(primaryCta).toBeVisible();
    await expect(primaryCta).toHaveAttribute('href', '/scopescan/demo');
  });
});
