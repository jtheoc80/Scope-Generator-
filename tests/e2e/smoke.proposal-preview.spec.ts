import { test, expect } from '@playwright/test';
import { captureConsoleErrors } from '../../qa/flows/auth';

/**
 * Smoke Test: Proposal Preview Live Updates
 * 
 * Tests the live preview pane functionality:
 * - Preview updates when scope/line items change
 * - Placeholders shown when client/address are empty
 * - Real values shown when client/address are set
 * - Mobile drawer functionality
 */

test.describe('Proposal Preview Live Updates', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/generator');
    await page.waitForLoadState('networkidle');
  });

  test('should show empty state when no services are added', async ({ page }) => {
    // Initially, the preview should show empty state
    const emptyState = page
      .locator('text=Ready to Start')
      .or(page.locator('text=readyToStart'))
      .first();
    await expect(emptyState).toBeVisible({ timeout: 10000 });
    
    // Preview container should not have proposal content
    const proposalPreview = page.locator('[data-testid="proposal-preview-container"]');
    await expect(proposalPreview).not.toBeVisible();
  });

  test('should show placeholder values when client/address are empty', async ({ page }) => {
    // Select a trade and job type to enable preview
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

    // Preview should now be visible (desktop)
    const previewContainer = page.locator('[data-testid="proposal-preview-container"]');
    await expect(previewContainer).toBeVisible({ timeout: 5000 });

    // Check that placeholder values are shown
    const clientName = page.locator('[data-testid="preview-client-name"]');
    await expect(clientName).toHaveText('Client Name');

    const address = page.locator('[data-testid="preview-address"]');
    await expect(address).toHaveText('123 Client Street');
  });

  test('should update preview when client name is entered', async ({ page }) => {
    // Fill in client name first
    const clientNameInput = page.locator('[data-testid="input-client-name"]');
    await clientNameInput.fill('John Smith');

    // Select a trade and job type
    const tradeSelect = page.locator('[data-testid="select-trade-0"]');
    await tradeSelect.click();
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(500);

    const jobTypeSelect = page.locator('[data-testid="select-jobtype-0"]');
    await expect(jobTypeSelect).toBeVisible({ timeout: 5000 });
    await jobTypeSelect.click();
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(500);

    // Preview should show the entered client name
    const clientName = page.locator('[data-testid="preview-client-name"]');
    await expect(clientName).toHaveText('John Smith');
  });

  test('should update preview when address is entered', async ({ page }) => {
    // Fill in address
    const addressInput = page.locator('[data-testid="input-address"]');
    await addressInput.fill('456 Oak Street, Austin, TX 78701');

    // Select a trade and job type
    const tradeSelect = page.locator('[data-testid="select-trade-0"]');
    await tradeSelect.click();
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(500);

    const jobTypeSelect = page.locator('[data-testid="select-jobtype-0"]');
    await expect(jobTypeSelect).toBeVisible({ timeout: 5000 });
    await jobTypeSelect.click();
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(500);

    // Preview should show the entered address
    const address = page.locator('[data-testid="preview-address"]');
    await expect(address).toHaveText('456 Oak Street, Austin, TX 78701');
  });

  test('should update preview with both client name and address', async ({ page }) => {
    // Fill in client info
    await page.locator('[data-testid="input-client-name"]').fill('Jane Doe');
    await page.locator('[data-testid="input-address"]').fill('789 Elm Street, Dallas, TX 75201');

    // Select a trade and job type
    await page.locator('[data-testid="select-trade-0"]').click();
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(500);

    await page.locator('[data-testid="select-jobtype-0"]').click();
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(500);

    // Preview should show both values
    await expect(page.locator('[data-testid="preview-client-name"]')).toHaveText('Jane Doe');
    await expect(page.locator('[data-testid="preview-address"]')).toHaveText('789 Elm Street, Dallas, TX 75201');
  });

  test('should show scope items in preview when service is selected', async ({ page }) => {
    // Select a trade and job type
    await page.locator('[data-testid="select-trade-0"]').click();
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(500);

    await page.locator('[data-testid="select-jobtype-0"]').click();
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(500);

    // Scope list should be visible in preview
    const scopeList = page.locator('[data-testid="preview-scope-list"]');
    await expect(scopeList).toBeVisible({ timeout: 5000 });

    // Should have at least one scope item
    const scopeItems = page.locator('[data-testid^="preview-scope-item-"]');
    await expect(scopeItems.first()).toBeVisible();
  });

  test('should show job type in preview', async ({ page }) => {
    // Select a trade and job type
    await page.locator('[data-testid="select-trade-0"]').click();
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(500);

    await page.locator('[data-testid="select-jobtype-0"]').click();
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(500);

    // Job type should be visible in preview
    const jobType = page.locator('[data-testid="preview-job-type"]');
    await expect(jobType).toBeVisible({ timeout: 5000 });
    // Job type should not be empty
    await expect(jobType).not.toHaveText('');
  });

  test('should show total price in preview', async ({ page }) => {
    // Select a trade and job type
    await page.locator('[data-testid="select-trade-0"]').click();
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(500);

    await page.locator('[data-testid="select-jobtype-0"]').click();
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(500);

    // Total price should be visible in preview (after generating)
    await page.locator('[data-testid="button-generate-proposal"]').click();
    await page.waitForTimeout(2000);

    const totalPrice = page.locator('[data-testid="preview-total-price"]');
    await expect(totalPrice).toBeVisible({ timeout: 5000 });
    // Price should contain a dollar sign
    await expect(totalPrice).toContainText('$');
  });

  test('should update preview in real-time when client name changes', async ({ page }) => {
    // First set up a valid service
    await page.locator('[data-testid="select-trade-0"]').click();
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(500);

    await page.locator('[data-testid="select-jobtype-0"]').click();
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(500);

    // Enter initial client name
    const clientNameInput = page.locator('[data-testid="input-client-name"]');
    await clientNameInput.fill('Initial Name');
    await page.waitForTimeout(300);

    // Verify preview shows initial name
    await expect(page.locator('[data-testid="preview-client-name"]')).toHaveText('Initial Name');

    // Change the client name
    await clientNameInput.clear();
    await clientNameInput.fill('Updated Name');
    await page.waitForTimeout(300);

    // Verify preview updates immediately
    await expect(page.locator('[data-testid="preview-client-name"]')).toHaveText('Updated Name');
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
});

test.describe('Mobile Preview Drawer', () => {
  
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE viewport

  test.beforeEach(async ({ page }) => {
    await page.goto('/generator');
    await page.waitForLoadState('networkidle');
  });

  test('should show preview drawer trigger on mobile when services are selected', async ({ page }) => {
    // Select a trade and job type
    await page.locator('[data-testid="select-trade-0"]').click();
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(500);

    await page.locator('[data-testid="select-jobtype-0"]').click();
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(500);

    // Drawer trigger button should be visible
    const drawerTrigger = page.locator('[data-testid="proposal-preview-drawer-trigger"]');
    await expect(drawerTrigger).toBeVisible({ timeout: 5000 });
  });

  test('should open drawer when trigger is clicked', async ({ page }) => {
    // Select a trade and job type
    await page.locator('[data-testid="select-trade-0"]').click();
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(500);

    await page.locator('[data-testid="select-jobtype-0"]').click();
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(500);

    // Click drawer trigger
    await page.locator('[data-testid="proposal-preview-drawer-trigger"]').click();
    await page.waitForTimeout(500);

    // Drawer content should be visible
    const drawerContent = page.locator('[data-testid="proposal-preview-drawer-content"]');
    await expect(drawerContent).toBeVisible({ timeout: 5000 });
  });

  test('should show client info with placeholders in mobile drawer', async ({ page }) => {
    // Select a trade and job type
    await page.locator('[data-testid="select-trade-0"]').click();
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(500);

    await page.locator('[data-testid="select-jobtype-0"]').click();
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(500);

    // Open drawer
    await page.locator('[data-testid="proposal-preview-drawer-trigger"]').click();
    await page.waitForTimeout(500);

    // In the drawer, placeholders should be shown
    const clientName = page.locator('[data-testid="proposal-preview-drawer-content"] [data-testid="preview-client-name"]');
    await expect(clientName).toHaveText('Client Name');
  });

  test('should show real values in mobile drawer when client info is filled', async ({ page }) => {
    // Fill client info
    await page.locator('[data-testid="input-client-name"]').fill('Mobile User');
    await page.locator('[data-testid="input-address"]').fill('123 Mobile St');

    // Select a trade and job type
    await page.locator('[data-testid="select-trade-0"]').click();
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(500);

    await page.locator('[data-testid="select-jobtype-0"]').click();
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(500);

    // Open drawer
    await page.locator('[data-testid="proposal-preview-drawer-trigger"]').click();
    await page.waitForTimeout(500);

    // In the drawer, real values should be shown
    const clientName = page.locator('[data-testid="proposal-preview-drawer-content"] [data-testid="preview-client-name"]');
    await expect(clientName).toHaveText('Mobile User');
  });
});
