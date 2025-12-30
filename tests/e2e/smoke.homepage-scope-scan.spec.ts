import { test, expect } from '@playwright/test';

/**
 * Smoke Test: Homepage ScopeScan Module
 * 
 * Tests the ScopeScan photo capture module on the homepage.
 * Verifies it works on both mobile and desktop viewports.
 */

// Mobile tests with iPhone viewport
test.describe('Homepage ScopeScan - Mobile', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport for all tests in this describe block
    await page.setViewportSize({ width: 390, height: 844 }); // iPhone 12 size
  });

  test('should display Scope Scan section with heading and buttons', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    // Scope Scan section should be visible
    const scopeScanSection = page.locator('[data-testid="section-scope-scan"]');
    await expect(scopeScanSection).toBeVisible({ timeout: 15000 });

    // Heading should be visible
    const heading = page.locator('[data-testid="scope-scan-heading"]');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(/ScopeScan/i);

    // Take Photo button should be visible
    const takePhotoButton = page.locator('[data-testid="button-take-photo"]');
    await expect(takePhotoButton).toBeVisible();

    // Upload Photo button should be visible  
    const uploadPhotoButton = page.locator('[data-testid="button-upload-photo"]');
    await expect(uploadPhotoButton).toBeVisible();
  });

  test('should have file input with capture attribute for camera', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    // Wait for the section to be visible first
    const scopeScanSection = page.locator('[data-testid="section-scope-scan"]');
    await expect(scopeScanSection).toBeVisible({ timeout: 15000 });

    // Camera input should have capture="environment" attribute
    const cameraInput = page.locator('[data-testid="input-camera"]');
    await expect(cameraInput).toHaveAttribute('accept', 'image/*');
    await expect(cameraInput).toHaveAttribute('capture', 'environment');
  });

  test('should have gallery file input that accepts images', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    // Wait for the section to be visible first
    const scopeScanSection = page.locator('[data-testid="section-scope-scan"]');
    await expect(scopeScanSection).toBeVisible({ timeout: 15000 });

    // Gallery input should accept images and allow multiple
    const galleryInput = page.locator('[data-testid="input-gallery"]');
    await expect(galleryInput).toHaveAttribute('accept', 'image/*');
    await expect(galleryInput).toHaveAttribute('multiple', '');
  });

  test('Upload button should trigger file input', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    // Wait for the section to be visible first
    const scopeScanSection = page.locator('[data-testid="section-scope-scan"]');
    await expect(scopeScanSection).toBeVisible({ timeout: 15000 });

    // Click the upload button
    const uploadPhotoButton = page.locator('[data-testid="button-upload-photo"]');
    await uploadPhotoButton.click();

    // File input should be available (hidden but functional)
    const galleryInput = page.locator('[data-testid="input-gallery"]');
    await expect(galleryInput).toBeAttached();
  });

  test('should display empty state when no photos added', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    // Wait for the section to be visible first
    const scopeScanSection = page.locator('[data-testid="section-scope-scan"]');
    await expect(scopeScanSection).toBeVisible({ timeout: 15000 });

    // Empty state should be visible
    const emptyState = page.locator('[data-testid="scope-scan-empty-state"]');
    await expect(emptyState).toBeVisible();
  });

  test('should have link to start ScopeScan without photos', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    // Wait for the section to be visible first
    const scopeScanSection = page.locator('[data-testid="section-scope-scan"]');
    await expect(scopeScanSection).toBeVisible({ timeout: 15000 });

    // Link to /m/create should exist - the button is inside a Link component
    const startButton = page.locator('[data-testid="button-start-scope-scan-link"]');
    await expect(startButton).toBeVisible();
    
    // Check that the parent <a> has the correct href
    const parentLink = startButton.locator('xpath=ancestor::a');
    await expect(parentLink).toHaveAttribute('href', '/m/create');
  });
});

// Desktop tests with default viewport
test.describe('Homepage ScopeScan - Desktop', () => {
  test('should display Scope Scan section on desktop viewport', async ({ page }) => {
    // Default viewport is desktop
    await page.goto('/');
    await page.waitForLoadState('load');

    // Scope Scan section should be visible
    const scopeScanSection = page.locator('[data-testid="section-scope-scan"]');
    await expect(scopeScanSection).toBeVisible({ timeout: 15000 });

    // Heading should be visible
    const heading = page.locator('[data-testid="scope-scan-heading"]');
    await expect(heading).toBeVisible();

    // Both buttons should be visible
    const takePhotoButton = page.locator('[data-testid="button-take-photo"]');
    await expect(takePhotoButton).toBeVisible();

    const uploadPhotoButton = page.locator('[data-testid="button-upload-photo"]');
    await expect(uploadPhotoButton).toBeVisible();
  });

  test('should show empty state with helpful text', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    // Wait for the section to be visible first
    const scopeScanSection = page.locator('[data-testid="section-scope-scan"]');
    await expect(scopeScanSection).toBeVisible({ timeout: 15000 });

    const emptyState = page.locator('[data-testid="scope-scan-empty-state"]');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText(/photo/i);
  });

  test('desktop hero section should still be visible alongside ScopeScan', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    // Hero section should still work
    const tryFreeButton = page.locator('[data-testid="button-try-free-proposal"]');
    await expect(tryFreeButton).toBeVisible({ timeout: 15000 });

    // Stats should still work
    const statProposals = page.locator('[data-testid="stat-proposals"]');
    await expect(statProposals).toBeVisible();
  });

  test('Upload button click should not cause page to break', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    // Wait for the section to be visible first
    const scopeScanSection = page.locator('[data-testid="section-scope-scan"]');
    await expect(scopeScanSection).toBeVisible({ timeout: 15000 });

    // Click upload button
    const uploadPhotoButton = page.locator('[data-testid="button-upload-photo"]');
    await uploadPhotoButton.click();
    
    // Page should still be functional after clicking - file input should be attached
    const galleryInput = page.locator('[data-testid="input-gallery"]');
    await expect(galleryInput).toBeAttached();
    
    // The button should still be visible (page didn't break)
    await expect(uploadPhotoButton).toBeVisible();
  });

  test('page should load without 4xx/5xx errors', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(400);
  });
});

// Tablet tests
test.describe('Homepage ScopeScan - Tablet', () => {
  test.beforeEach(async ({ page }) => {
    // Set tablet viewport (iPad Mini)
    await page.setViewportSize({ width: 768, height: 1024 });
  });

  test('should display Scope Scan on tablet viewport', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    // Scope Scan section should be visible
    const scopeScanSection = page.locator('[data-testid="section-scope-scan"]');
    await expect(scopeScanSection).toBeVisible({ timeout: 15000 });

    // Buttons should be visible
    const takePhotoButton = page.locator('[data-testid="button-take-photo"]');
    await expect(takePhotoButton).toBeVisible();
  });
});
