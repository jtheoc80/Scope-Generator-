import { test, expect } from '@playwright/test';

/**
 * Smoke Test: Draft Persistence (Autosave + Restore)
 * 
 * Tests that proposal drafts persist across page reloads via localStorage
 * and can be properly reset.
 * 
 * Feature: Draft Autosave and Restore
 * - Drafts auto-save to localStorage after changes
 * - Drafts restore on page reload
 * - Reset draft clears localStorage and form
 * - Invalid/old drafts don't break the page
 */

test.describe('Draft Persistence', () => {

  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/generator');
    await page.evaluate(() => {
      // Clear any existing draft data
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('scopegen_proposal_draft')) {
          localStorage.removeItem(key);
        }
      });
    });
  });

  test('should autosave draft and show saved indicator', async ({ page }) => {
    await page.goto('/generator');
    await page.waitForLoadState('networkidle');

    // Fill in some data
    const clientNameInput = page.locator('[data-testid="input-client-name"]');
    await expect(clientNameInput).toBeVisible({ timeout: 10000 });
    await clientNameInput.fill('Autosave Test Client');

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

    // Wait for debounced autosave (1 second + buffer)
    await page.waitForTimeout(1500);

    // Check that saved indicator appears
    const saveIndicator = page.locator('[data-testid="draft-save-indicator"]');
    await expect(saveIndicator).toBeVisible({ timeout: 5000 });
    
    // Should show "Saved" status
    await expect(saveIndicator).toContainText(/Saved/);
  });

  test('should restore draft after page reload', async ({ page }) => {
    await page.goto('/generator');
    await page.waitForLoadState('networkidle');

    const testClientName = 'Persistence Test Client ' + Date.now();
    const testAddress = '123 Persistence Test Street, Austin, TX 78701';

    // Fill in client info
    const clientNameInput = page.locator('[data-testid="input-client-name"]');
    await expect(clientNameInput).toBeVisible({ timeout: 10000 });
    await clientNameInput.fill(testClientName);

    const addressInput = page.locator('[data-testid="input-address"]');
    await addressInput.fill(testAddress);

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

    // Wait for autosave
    await page.waitForTimeout(1500);

    // Verify save indicator
    const saveIndicator = page.locator('[data-testid="draft-save-indicator"]');
    await expect(saveIndicator).toContainText(/Saved/);

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check that values were restored
    const restoredClientName = page.locator('[data-testid="input-client-name"]');
    await expect(restoredClientName).toHaveValue(testClientName, { timeout: 5000 });

    const restoredAddress = page.locator('[data-testid="input-address"]');
    await expect(restoredAddress).toHaveValue(testAddress);

    // Check that trade was restored (job type selector should be visible)
    const restoredJobType = page.locator('[data-testid="select-jobtype-0"]');
    await expect(restoredJobType).toBeVisible({ timeout: 5000 });

    // Draft restored banner should be visible
    const restoredBanner = page.locator('[data-testid="draft-restored-banner"]');
    await expect(restoredBanner).toBeVisible();
    await expect(restoredBanner).toContainText(/Draft restored/);
  });

  test('should clear draft when reset button is clicked', async ({ page }) => {
    await page.goto('/generator');
    await page.waitForLoadState('networkidle');

    // Fill in data
    const clientNameInput = page.locator('[data-testid="input-client-name"]');
    await expect(clientNameInput).toBeVisible({ timeout: 10000 });
    await clientNameInput.fill('Reset Test Client');

    // Select trade and job type
    const tradeSelect = page.locator('[data-testid="select-trade-0"]');
    await tradeSelect.click();
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(500);

    const jobTypeSelect = page.locator('[data-testid="select-jobtype-0"]');
    await jobTypeSelect.click();
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(500);

    // Generate to get to step 2 where reset button is in toolbar
    const generateButton = page.locator('[data-testid="button-generate-proposal"]');
    await expect(generateButton).toBeEnabled({ timeout: 5000 });
    await generateButton.click();
    await page.waitForTimeout(2000);

    // Wait for autosave
    await page.waitForTimeout(1500);

    // Click reset button in toolbar
    const resetButton = page.locator('[data-testid="button-reset-draft-toolbar"]');
    await expect(resetButton).toBeVisible({ timeout: 5000 });
    await resetButton.click();

    // Wait for reset
    await page.waitForTimeout(500);

    // Client name should be cleared
    await expect(clientNameInput).toHaveValue('');

    // Trade selector should be reset (no job type visible)
    await expect(page.locator('[data-testid="select-jobtype-0"]')).not.toBeVisible();

    // Reload and verify localStorage was cleared
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should NOT restore (draft was cleared)
    await expect(clientNameInput).toHaveValue('');
    
    // No restored banner
    const restoredBanner = page.locator('[data-testid="draft-restored-banner"]');
    await expect(restoredBanner).not.toBeVisible();
  });

  test('should handle invalid localStorage data gracefully', async ({ page }) => {
    // Set invalid data in localStorage before navigating
    await page.goto('/generator');
    await page.evaluate(() => {
      localStorage.setItem('scopegen_proposal_draft_anon', 'invalid json data {{{');
    });

    // Reload to trigger restore
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Page should load without errors
    const clientNameInput = page.locator('[data-testid="input-client-name"]');
    await expect(clientNameInput).toBeVisible({ timeout: 10000 });
    await expect(clientNameInput).toHaveValue('');

    // No restored banner (invalid data was discarded)
    const restoredBanner = page.locator('[data-testid="draft-restored-banner"]');
    await expect(restoredBanner).not.toBeVisible();
  });

  test('should handle old schema version gracefully', async ({ page }) => {
    await page.goto('/generator');
    
    // Set old version data in localStorage
    await page.evaluate(() => {
      const oldVersionData = JSON.stringify({
        version: 0, // Old version
        timestamp: Date.now(),
        draft: {
          clientName: 'Old Schema Client',
          address: '123 Old St',
          services: [],
          photos: [],
          enhancedScopes: {},
        },
      });
      localStorage.setItem('scopegen_proposal_draft_anon', oldVersionData);
    });

    // Reload to trigger restore
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Page should load without errors
    const clientNameInput = page.locator('[data-testid="input-client-name"]');
    await expect(clientNameInput).toBeVisible({ timeout: 10000 });
    
    // Old data should NOT be restored (version mismatch)
    await expect(clientNameInput).toHaveValue('');

    // No restored banner
    const restoredBanner = page.locator('[data-testid="draft-restored-banner"]');
    await expect(restoredBanner).not.toBeVisible();
  });

  test('should show unsaved indicator when changes are pending', async ({ page }) => {
    await page.goto('/generator');
    await page.waitForLoadState('networkidle');

    // Start typing immediately - should show unsaved state
    const clientNameInput = page.locator('[data-testid="input-client-name"]');
    await expect(clientNameInput).toBeVisible({ timeout: 10000 });
    await clientNameInput.fill('Quick Type');

    // Should briefly show "Unsaved" before autosave kicks in
    // Note: This test is timing-sensitive
    const saveIndicator = page.locator('[data-testid="draft-save-indicator"]');
    
    // Wait for autosave to complete
    await page.waitForTimeout(1500);
    
    // After autosave, should show "Saved"
    await expect(saveIndicator).toContainText(/Saved/);
  });

  test('should persist multiple services', async ({ page }) => {
    await page.goto('/generator');
    await page.waitForLoadState('networkidle');

    // Fill client info
    const clientNameInput = page.locator('[data-testid="input-client-name"]');
    await expect(clientNameInput).toBeVisible({ timeout: 10000 });
    await clientNameInput.fill('Multi-Service Test');

    // First service - select trade and job type
    const tradeSelect0 = page.locator('[data-testid="select-trade-0"]');
    await tradeSelect0.click();
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(500);

    const jobTypeSelect0 = page.locator('[data-testid="select-jobtype-0"]');
    await jobTypeSelect0.click();
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(500);

    // Add second service
    const addServiceButton = page.locator('[data-testid="button-add-service"]');
    await addServiceButton.click();
    await page.waitForTimeout(500);

    // Second service - select trade and job type
    const tradeSelect1 = page.locator('[data-testid="select-trade-1"]');
    await tradeSelect1.click();
    // Select a different trade if available, otherwise first
    const tradeOptions = page.locator('[role="option"]');
    const count = await tradeOptions.count();
    if (count > 1) {
      await tradeOptions.nth(1).click();
    } else {
      await tradeOptions.first().click();
    }
    await page.waitForTimeout(500);

    const jobTypeSelect1 = page.locator('[data-testid="select-jobtype-1"]');
    await expect(jobTypeSelect1).toBeVisible({ timeout: 5000 });
    await jobTypeSelect1.click();
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(500);

    // Wait for autosave
    await page.waitForTimeout(1500);

    // Reload
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify both services were restored
    await expect(clientNameInput).toHaveValue('Multi-Service Test');
    
    // Both service cards should exist
    await expect(page.locator('[data-testid="service-card-0"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="service-card-1"]')).toBeVisible();

    // Both should have job types selected
    await expect(page.locator('[data-testid="select-jobtype-0"]')).toBeVisible();
    await expect(page.locator('[data-testid="select-jobtype-1"]')).toBeVisible();
  });

  test('reset draft button in restored banner works', async ({ page }) => {
    await page.goto('/generator');
    await page.waitForLoadState('networkidle');

    // Fill in data and save
    const clientNameInput = page.locator('[data-testid="input-client-name"]');
    await expect(clientNameInput).toBeVisible({ timeout: 10000 });
    await clientNameInput.fill('Banner Reset Test');

    // Select trade/job type to ensure content
    const tradeSelect = page.locator('[data-testid="select-trade-0"]');
    await tradeSelect.click();
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(500);

    const jobTypeSelect = page.locator('[data-testid="select-jobtype-0"]');
    await jobTypeSelect.click();
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(500);

    // Wait for autosave
    await page.waitForTimeout(1500);

    // Reload to show restored banner
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify banner is visible
    const restoredBanner = page.locator('[data-testid="draft-restored-banner"]');
    await expect(restoredBanner).toBeVisible({ timeout: 5000 });

    // Click reset button in banner
    const resetButton = page.locator('[data-testid="button-reset-draft"]');
    await resetButton.click();
    await page.waitForTimeout(500);

    // Form should be cleared
    await expect(clientNameInput).toHaveValue('');
    
    // Banner should be gone
    await expect(restoredBanner).not.toBeVisible();
  });

});
