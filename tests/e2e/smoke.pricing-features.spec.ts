import { test, expect } from '@playwright/test';

/**
 * Smoke Test: Pricing Page Features
 * 
 * Ensures pricing page displays all critical feature information
 * consistently with Terms of Service (e-signature for paid plans only).
 */

test.describe('Pricing Page Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#pricing');
    await page.waitForLoadState('networkidle');
  });

  test('should display all three pricing plans', async ({ page }) => {
    // Check for Starter plan card
    const starterCard = page.locator('[data-testid="pricing-card-starter"]');
    await expect(starterCard).toBeVisible({ timeout: 10000 });

    // Check for Pro plan card
    const proCard = page.locator('[data-testid="pricing-card-pro"]');
    await expect(proCard).toBeVisible();

    // Check for Crew plan card
    const crewCard = page.locator('[data-testid="pricing-card-crew"]');
    await expect(crewCard).toBeVisible();
  });

  test('should display E-signature feature with correct plan availability', async ({ page }) => {
    // E-signature should be visible in Pro plan
    const proEsignature = page.locator('[data-testid="pro-esignature-feature"]');
    await expect(proEsignature).toBeVisible({ timeout: 10000 });
    await expect(proEsignature).toContainText(/e-signature/i);

    // E-signature should be visible in Crew plan
    const crewEsignature = page.locator('[data-testid="crew-esignature-feature"]');
    await expect(crewEsignature).toBeVisible();
    await expect(crewEsignature).toContainText(/e-signature/i);
  });

  test('should display Compare Plans section', async ({ page }) => {
    const comparePlansSection = page.locator('[data-testid="compare-plans-section"]');
    await expect(comparePlansSection).toBeVisible({ timeout: 10000 });
  });

  test('should display feature comparison table', async ({ page }) => {
    const comparisonTable = page.locator('[data-testid="compare-plans-table"]');
    await expect(comparisonTable).toBeVisible({ timeout: 10000 });
  });

  test('comparison table should show E-signature row with correct values', async ({ page }) => {
    // E-signature row should exist
    const esignatureRow = page.locator('[data-testid="compare-row-esignature"]');
    await expect(esignatureRow).toBeVisible({ timeout: 10000 });

    // Starter should show "—" (not included)
    const starterValue = esignatureRow.locator('td').nth(1);
    await expect(starterValue).toContainText('—');

    // Pro should show "✓" (included)
    const proValue = esignatureRow.locator('td').nth(2);
    await expect(proValue).toContainText('✓');

    // Crew should show "✓" (included)
    const crewValue = esignatureRow.locator('td').nth(3);
    await expect(crewValue).toContainText('✓');
  });

  test('should display pricing amounts for each plan', async ({ page }) => {
    // Starter: $9
    const starterPrice = page.locator('[data-testid="pricing-card-starter"]').getByText('$9');
    await expect(starterPrice).toBeVisible({ timeout: 10000 });

    // Pro: $29
    const proPrice = page.locator('[data-testid="pricing-card-pro"]').getByText('$29');
    await expect(proPrice).toBeVisible();

    // Crew: $79
    const crewPrice = page.locator('[data-testid="pricing-card-crew"]').getByText('$79');
    await expect(crewPrice).toBeVisible();
  });

  test('should display team seats information', async ({ page }) => {
    // Crew plan should mention 3 team seats
    const crewCard = page.locator('[data-testid="pricing-card-crew"]');
    await expect(crewCard).toContainText(/3 team/i, { timeout: 10000 });
  });

  test('should display branding/logo information in Pro and Crew', async ({ page }) => {
    // Pro should mention logo
    const proCard = page.locator('[data-testid="pricing-card-pro"]');
    await expect(proCard).toContainText(/logo/i, { timeout: 10000 });

    // Crew should mention branding
    const crewCard = page.locator('[data-testid="pricing-card-crew"]');
    await expect(crewCard).toContainText(/brand/i);
  });

  test('should display proposal limits for each plan', async ({ page }) => {
    // Pro: 15 proposals/month
    const proCard = page.locator('[data-testid="pricing-card-pro"]');
    await expect(proCard).toContainText(/15/i, { timeout: 10000 });

    // Crew: 50 proposals/month
    const crewCard = page.locator('[data-testid="pricing-card-crew"]');
    await expect(crewCard).toContainText(/50/i);
  });

  test('should display support level information', async ({ page }) => {
    // Starter: email support
    const starterCard = page.locator('[data-testid="pricing-card-starter"]');
    await expect(starterCard).toContainText(/email/i, { timeout: 10000 });

    // Pro: priority email support
    const proCard = page.locator('[data-testid="pricing-card-pro"]');
    await expect(proCard).toContainText(/priority/i);

    // Crew: priority phone & email
    const crewCard = page.locator('[data-testid="pricing-card-crew"]');
    await expect(crewCard).toContainText(/phone/i);
  });

  test('pricing page should be consistent with Terms page e-signature clause', async ({ page }) => {
    // Go to Terms page
    await page.goto('/terms');
    await page.waitForLoadState('networkidle');

    // Terms should mention e-signature for paid plans
    const termsContent = page.locator('text=E-signature functionality (for paid plans)');
    await expect(termsContent).toBeVisible({ timeout: 10000 });

    // Go back to pricing
    await page.goto('/#pricing');
    await page.waitForLoadState('networkidle');

    // Verify e-signature NOT in starter (free/pay-per-use)
    const esignatureRow = page.locator('[data-testid="compare-row-esignature"]');
    const starterEsig = esignatureRow.locator('td').nth(1);
    await expect(starterEsig).toContainText('—');

    // Verify e-signature IS in Pro (paid plan)
    const proEsig = esignatureRow.locator('td').nth(2);
    await expect(proEsig).toContainText('✓');

    // Verify e-signature IS in Crew (paid plan)
    const crewEsig = esignatureRow.locator('td').nth(3);
    await expect(crewEsig).toContainText('✓');
  });

  test('should have working CTA buttons for each plan', async ({ page }) => {
    // Starter CTA
    const starterCTA = page.locator('[data-testid="button-get-started"]');
    await expect(starterCTA).toBeVisible({ timeout: 10000 });
    await expect(starterCTA).toBeEnabled();

    // Pro CTA
    const proCTA = page.locator('[data-testid="button-subscribe-pro"]');
    await expect(proCTA).toBeVisible();
    await expect(proCTA).toBeEnabled();

    // Crew CTA
    const crewCTA = page.locator('[data-testid="button-subscribe-crew"]');
    await expect(crewCTA).toBeVisible();
    await expect(crewCTA).toBeEnabled();
  });
});
