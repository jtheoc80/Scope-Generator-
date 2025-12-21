import { test, expect } from '@playwright/test';
import { captureConsoleErrors } from '../../qa/flows/auth';
import { getDefaultProposalData } from '../../qa/flows/proposal';

/**
 * Smoke Test: Proposal Creation Flow
 * 
 * Critical flow that must never break.
 * Tests the proposal generator and saving functionality.
 */

test.describe('Proposal Creation Flow', () => {
  test('should display generator page with form elements', async ({ page }) => {
    await page.goto('/generator');
    await page.waitForLoadState('networkidle');

    // Client name input
    const clientNameInput = page.locator('[data-testid="input-client-name"]');
    await expect(clientNameInput).toBeVisible({ timeout: 10000 });

    // Address input
    const addressInput = page.locator('[data-testid="input-address"]');
    await expect(addressInput).toBeVisible();

    // Trade selector
    const tradeSelect = page.locator('[data-testid="select-trade-0"]');
    await expect(tradeSelect).toBeVisible();
  });

  test('should allow filling basic client information', async ({ page }) => {
    const proposalData = getDefaultProposalData();
    
    await page.goto('/generator');
    await page.waitForLoadState('networkidle');

    // Fill client name
    const clientNameInput = page.locator('[data-testid="input-client-name"]');
    await clientNameInput.fill(proposalData.clientName);
    await expect(clientNameInput).toHaveValue(proposalData.clientName);

    // Fill address
    const addressInput = page.locator('[data-testid="input-address"]');
    await addressInput.fill(proposalData.address);
    await expect(addressInput).toHaveValue(proposalData.address);
  });

  test('should show job types after selecting trade', async ({ page }) => {
    await page.goto('/generator');
    await page.waitForLoadState('networkidle');

    // Select trade
    const tradeSelect = page.locator('[data-testid="select-trade-0"]');
    await tradeSelect.click();
    
    // Select first trade option
    const tradeOption = page.locator('[role="option"]').first();
    await expect(tradeOption).toBeVisible({ timeout: 5000 });
    await tradeOption.click();
    
    await page.waitForTimeout(500);

    // Job type selector should now be visible
    const jobTypeSelect = page.locator('[data-testid="select-jobtype-0"]');
    await expect(jobTypeSelect).toBeVisible({ timeout: 5000 });
  });

  test('should enable generate button when form is valid', async ({ page }) => {
    const proposalData = getDefaultProposalData();
    
    await page.goto('/generator');
    await page.waitForLoadState('networkidle');

    // Fill required fields
    const clientNameInput = page.locator('[data-testid="input-client-name"]');
    await clientNameInput.fill(proposalData.clientName);

    const addressInput = page.locator('[data-testid="input-address"]');
    await addressInput.fill(proposalData.address);

    // Select trade
    const tradeSelect = page.locator('[data-testid="select-trade-0"]');
    await tradeSelect.click();
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(500);

    // Select job type
    const jobTypeSelect = page.locator('[data-testid="select-jobtype-0"]');
    await jobTypeSelect.click();
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(500);

    // Generate button should be enabled
    const generateButton = page.locator('[data-testid="button-generate-proposal"]');
    await expect(generateButton).toBeEnabled({ timeout: 5000 });
  });

  test('should display preview after generating', async ({ page }) => {
    const proposalData = getDefaultProposalData();
    
    await page.goto('/generator');
    await page.waitForLoadState('networkidle');

    // Fill form
    await page.locator('[data-testid="input-client-name"]').fill(proposalData.clientName);
    await page.locator('[data-testid="input-address"]').fill(proposalData.address);

    // Select trade
    await page.locator('[data-testid="select-trade-0"]').click();
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(500);

    // Select job type
    await page.locator('[data-testid="select-jobtype-0"]').click();
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(500);

    // Generate
    const generateButton = page.locator('[data-testid="button-generate-proposal"]');
    await generateButton.click();

    // Wait for preview to appear
    await page.waitForTimeout(2000);

    // Preview area should show content
    const previewArea = page.locator('.proposal-preview, [class*="preview"], [data-testid="proposal-preview"]');
    // At minimum, the client name should appear somewhere
    await expect(page.getByText(proposalData.clientName)).toBeVisible({ timeout: 10000 });
  });

  test('should allow adding multiple services', async ({ page }) => {
    await page.goto('/generator');
    await page.waitForLoadState('networkidle');

    // Initially one service card
    const initialCards = page.locator('[data-testid^="service-card-"]');
    const initialCount = await initialCards.count();
    expect(initialCount).toBeGreaterThanOrEqual(1);

    // Click add service button
    const addServiceButton = page.locator('[data-testid="button-add-service"]');
    await addServiceButton.click();
    await page.waitForTimeout(500);

    // Should have one more service card
    const newCount = await page.locator('[data-testid^="service-card-"]').count();
    expect(newCount).toBe(initialCount + 1);
  });

  test('should not have console errors on page load', async ({ page }) => {
    const errors = captureConsoleErrors(page);
    
    await page.goto('/generator');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const severeErrors = errors.filter(e => 
      !e.includes('ResizeObserver') && 
      !e.includes('favicon') &&
      !e.includes('manifest') &&
      !e.includes('hydrat') // React hydration warnings
    );

    expect(severeErrors.length).toBe(0);
  });

  test('page should be accessible via direct URL', async ({ page }) => {
    const response = await page.goto('/generator');
    expect(response?.status()).toBeLessThan(400);
  });
});
