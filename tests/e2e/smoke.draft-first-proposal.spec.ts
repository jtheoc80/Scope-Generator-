import { test, expect } from '@playwright/test';
import { captureConsoleErrors } from '../../qa/flows/auth';

/**
 * Smoke Test: Draft-First Proposal Creation Flow
 * 
 * Tests the ability to create draft proposals without client name/address,
 * and validates that export/send actions require finalize fields.
 * 
 * Feature: Draft-first proposal creation
 * - Users can generate drafts without client name/address
 * - Export/send actions require client name + job address
 * - Draft save works without client info
 */

test.describe('Draft-First Proposal Creation', () => {
  
  test('should allow generating draft WITHOUT client name or address', async ({ page }) => {
    await page.goto('/generator');
    await page.waitForLoadState('networkidle');

    // Verify client name and address inputs exist but are empty
    const clientNameInput = page.locator('[data-testid="input-client-name"]');
    const addressInput = page.locator('[data-testid="input-address"]');
    await expect(clientNameInput).toBeVisible({ timeout: 10000 });
    await expect(addressInput).toBeVisible();
    
    // Verify the "Optional for Draft" indicator is shown
    const optionalBadge = page.getByText(/Optional for Draft/i);
    await expect(optionalBadge).toBeVisible();

    // Do NOT fill client name or address - leave them empty

    // Select trade
    const tradeSelect = page.locator('[data-testid="select-trade-0"]');
    await tradeSelect.click();
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(500);

    // Select job type
    const jobTypeSelect = page.locator('[data-testid="select-jobtype-0"]');
    await expect(jobTypeSelect).toBeVisible({ timeout: 5000 });
    await jobTypeSelect.click();
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(500);

    // Generate button should be enabled (services are valid)
    const generateButton = page.locator('[data-testid="button-generate-proposal"]');
    await expect(generateButton).toBeEnabled({ timeout: 5000 });

    // Click generate - should work without client/address
    await generateButton.click();

    // Wait for step 2 (preview)
    await page.waitForTimeout(2000);

    // Preview should be visible
    await expect(page.getByText(/Live Preview/i)).toBeVisible({ timeout: 10000 });
    
    // Draft mode banner should be visible (since client info is missing)
    const draftBanner = page.locator('[data-testid="banner-finalize-required"]');
    await expect(draftBanner).toBeVisible();
  });

  test('should BLOCK download PDF when client name/address are missing', async ({ page }) => {
    await page.goto('/generator');
    await page.waitForLoadState('networkidle');

    // Select trade and job type only (no client info)
    const tradeSelect = page.locator('[data-testid="select-trade-0"]');
    await tradeSelect.click();
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(500);

    const jobTypeSelect = page.locator('[data-testid="select-jobtype-0"]');
    await jobTypeSelect.click();
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(500);

    // Generate draft
    const generateButton = page.locator('[data-testid="button-generate-proposal"]');
    await generateButton.click();
    await page.waitForTimeout(2000);

    // Download button should exist but clicking should show error
    const downloadButton = page.locator('[data-testid="button-download-pdf"]');
    await expect(downloadButton).toBeVisible({ timeout: 5000 });
    
    // Download button should have reduced opacity (visual indicator)
    await expect(downloadButton).toHaveClass(/opacity-75/);
    
    // Click download - should trigger validation error
    await downloadButton.click();
    await page.waitForTimeout(500);

    // Error message should appear for client name
    const clientError = page.locator('[data-testid="error-client-name"]');
    await expect(clientError).toBeVisible({ timeout: 5000 });
    
    // Error message should appear for address
    const addressError = page.locator('[data-testid="error-address"]');
    await expect(addressError).toBeVisible();
  });

  test('should ENABLE download PDF after adding client name and address', async ({ page }) => {
    await page.goto('/generator');
    await page.waitForLoadState('networkidle');

    // Fill client info first
    const clientNameInput = page.locator('[data-testid="input-client-name"]');
    const addressInput = page.locator('[data-testid="input-address"]');
    await clientNameInput.fill('Test Client QA');
    await addressInput.fill('123 Test Street, Austin, TX 78701');

    // Select trade and job type
    const tradeSelect = page.locator('[data-testid="select-trade-0"]');
    await tradeSelect.click();
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(500);

    const jobTypeSelect = page.locator('[data-testid="select-jobtype-0"]');
    await jobTypeSelect.click();
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(500);

    // Generate
    const generateButton = page.locator('[data-testid="button-generate-proposal"]');
    await generateButton.click();
    await page.waitForTimeout(2000);

    // Download button should NOT have reduced opacity
    const downloadButton = page.locator('[data-testid="button-download-pdf"]');
    await expect(downloadButton).toBeVisible({ timeout: 5000 });
    await expect(downloadButton).not.toHaveClass(/opacity-75/);
    
    // Draft mode banner should NOT be visible (client info is provided)
    const draftBanner = page.locator('[data-testid="banner-finalize-required"]');
    await expect(draftBanner).not.toBeVisible();
  });

  test('should clear validation errors when user fills in client info', async ({ page }) => {
    await page.goto('/generator');
    await page.waitForLoadState('networkidle');

    // Generate draft without client info
    const tradeSelect = page.locator('[data-testid="select-trade-0"]');
    await tradeSelect.click();
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(500);

    const jobTypeSelect = page.locator('[data-testid="select-jobtype-0"]');
    await jobTypeSelect.click();
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(500);

    const generateButton = page.locator('[data-testid="button-generate-proposal"]');
    await generateButton.click();
    await page.waitForTimeout(2000);

    // Try to download - will fail and show errors
    const downloadButton = page.locator('[data-testid="button-download-pdf"]');
    await downloadButton.click();
    await page.waitForTimeout(500);

    // Errors should be visible
    const clientError = page.locator('[data-testid="error-client-name"]');
    await expect(clientError).toBeVisible({ timeout: 5000 });

    // Now fill in client name - error should clear
    const clientNameInput = page.locator('[data-testid="input-client-name"]');
    await clientNameInput.fill('Test Client');

    // Client name error should be gone
    await expect(clientError).not.toBeVisible();
  });

  test('should show correct step progression with draft-first flow', async ({ page }) => {
    await page.goto('/generator');
    await page.waitForLoadState('networkidle');

    // Step 1: Setup (form visible)
    const clientNameInput = page.locator('[data-testid="input-client-name"]');
    await expect(clientNameInput).toBeVisible({ timeout: 10000 });

    // Select trade and job type
    const tradeSelect = page.locator('[data-testid="select-trade-0"]');
    await tradeSelect.click();
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(500);

    const jobTypeSelect = page.locator('[data-testid="select-jobtype-0"]');
    await jobTypeSelect.click();
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(500);

    // Generate button works without client info
    const generateButton = page.locator('[data-testid="button-generate-proposal"]');
    await expect(generateButton).toBeEnabled();
    await generateButton.click();

    // Step 2: Preview (generated draft visible)
    await page.waitForTimeout(2000);
    
    // Preview should show "Draft Proposal" as client name since none was provided
    // The actual preview content depends on the previewData which uses watchedValues
    await expect(page.getByText(/Live Preview/i)).toBeVisible({ timeout: 10000 });
    
    // Save Draft button should work (saves with placeholder values)
    const saveDraftButton = page.locator('[data-testid="button-save-draft"]');
    if (await saveDraftButton.isVisible()) {
      // Note: This test runs without auth, so save draft may not be available
      // The button visibility depends on user state
    }
  });

  test('should not have console errors during draft-first flow', async ({ page }) => {
    const errors = captureConsoleErrors(page);
    
    await page.goto('/generator');
    await page.waitForLoadState('networkidle');

    // Complete draft-first flow
    const tradeSelect = page.locator('[data-testid="select-trade-0"]');
    await tradeSelect.click();
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(500);

    const jobTypeSelect = page.locator('[data-testid="select-jobtype-0"]');
    await jobTypeSelect.click();
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(500);

    const generateButton = page.locator('[data-testid="button-generate-proposal"]');
    await generateButton.click();
    await page.waitForTimeout(2000);

    // Filter out expected/non-critical errors
    const severeErrors = errors.filter(e => 
      !e.includes('ResizeObserver') && 
      !e.includes('favicon') &&
      !e.includes('manifest') &&
      !e.includes('hydrat') && // React hydration warnings
      !e.includes('Google Maps') // Google Maps API warnings
    );

    expect(severeErrors.length).toBe(0);
  });

  test('email button should be blocked without client info', async ({ page }) => {
    await page.goto('/generator');
    await page.waitForLoadState('networkidle');

    // Generate draft without client info
    const tradeSelect = page.locator('[data-testid="select-trade-0"]');
    await tradeSelect.click();
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(500);

    const jobTypeSelect = page.locator('[data-testid="select-jobtype-0"]');
    await jobTypeSelect.click();
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(500);

    const generateButton = page.locator('[data-testid="button-generate-proposal"]');
    await generateButton.click();
    await page.waitForTimeout(2000);

    // Email button exists (when logged in - may not be visible if not authenticated)
    const emailButton = page.locator('[data-testid="button-email-proposal"]');
    
    // If email button is visible (user is logged in), verify it has the visual indicator
    if (await emailButton.isVisible()) {
      await expect(emailButton).toHaveClass(/opacity-75/);
      
      // Click should trigger validation
      await emailButton.click();
      await page.waitForTimeout(500);
      
      // Errors should appear
      const clientError = page.locator('[data-testid="error-client-name"]');
      await expect(clientError).toBeVisible({ timeout: 5000 });
    }
  });
});
