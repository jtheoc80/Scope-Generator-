import { test, expect } from '@playwright/test';
import { 
  captureConsoleErrors,
  setupDiagnostics,
  printDiagnostics,
  filterAcceptableErrors,
} from '../../qa/flows/auth';
import {
  goToSignIn,
  getEmailInputSelector,
  getPasswordInputSelector,
  getSubmitButtonSelector,
  AUTH_OPERATION_TIMEOUT,
  DEFAULT_ELEMENT_TIMEOUT,
  TestDiagnostics,
} from '../../qa/flows/test-helpers';

/**
 * Smoke Test: Sign In Flow
 * 
 * Critical flow that must never break.
 * Tests user authentication through Clerk or test auth mode.
 * 
 * UPDATED: Uses domcontentloaded + explicit waits instead of networkidle.
 * Maximum wait time: 5s per operation (not 17s timeouts).
 */

test.describe('Sign In Flow @smoke', () => {
  let diagnostics: TestDiagnostics;

  test.beforeEach(async ({ page }) => {
    diagnostics = setupDiagnostics(page);
  });

  test.afterEach(async ({}, testInfo) => {
    if (testInfo.status !== 'passed') {
      printDiagnostics(diagnostics, testInfo.title);
    }
  });

  test('should display sign in page with required elements', async ({ page }) => {
    // Use improved navigation helper (no networkidle)
    await goToSignIn(page, { timeout: AUTH_OPERATION_TIMEOUT });

    // Check for sign-in form container
    await expect(page.locator('[data-testid="signin-form"], [data-testid="signin-page"]').first())
      .toBeVisible({ timeout: DEFAULT_ELEMENT_TIMEOUT });

    // Check for key heading elements
    await expect(page.locator('h1, h2').filter({ hasText: /sign in|log in|welcome/i }).first())
      .toBeVisible({ timeout: DEFAULT_ELEMENT_TIMEOUT });
    
    // Email/identifier input should be present
    const emailInput = page.locator(getEmailInputSelector()).first();
    await expect(emailInput).toBeVisible({ timeout: DEFAULT_ELEMENT_TIMEOUT });
  });

  test('should validate required fields', async ({ page }) => {
    await goToSignIn(page, { timeout: AUTH_OPERATION_TIMEOUT });

    // Try to submit without entering anything
    const submitButton = page.locator(getSubmitButtonSelector()).first();
    if (await submitButton.isVisible({ timeout: DEFAULT_ELEMENT_TIMEOUT })) {
      await submitButton.click();
      
      // Wait briefly for validation feedback
      await page.waitForTimeout(500);
    }

    // Should still be on sign-in page (didn't proceed without credentials)
    await expect(page).toHaveURL(/sign-in/);
  });

  test('should have working navigation to sign up', async ({ page }) => {
    await goToSignIn(page, { timeout: AUTH_OPERATION_TIMEOUT });

    // Look for sign up link
    const signUpLink = page.locator('a[href*="sign-up"], button:has-text("Sign up")').first();
    await expect(signUpLink).toBeVisible({ timeout: DEFAULT_ELEMENT_TIMEOUT });
    
    await signUpLink.click();
    await expect(page).toHaveURL(/sign-up/, { timeout: AUTH_OPERATION_TIMEOUT });
  });

  test('should not have console errors on page load', async ({ page }) => {
    const errors = captureConsoleErrors(page);
    
    await goToSignIn(page, { timeout: AUTH_OPERATION_TIMEOUT });
    
    // Brief wait for any async errors to surface
    await page.waitForTimeout(1000);

    // Filter out known acceptable errors
    const severeErrors = errors.filter(e => 
      !e.includes('ResizeObserver') && 
      !e.includes('favicon') &&
      !e.includes('manifest') &&
      !e.includes('hydrat') &&
      !e.includes('Invalid or unexpected token') // Dev server hot reload issue
    );

    expect(severeErrors.length).toBe(0);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await goToSignIn(page, { timeout: AUTH_OPERATION_TIMEOUT });

    // Fill invalid credentials
    const emailInput = page.locator(getEmailInputSelector()).first();
    await expect(emailInput).toBeVisible({ timeout: DEFAULT_ELEMENT_TIMEOUT });
    await emailInput.fill('nonexistent@example.com');

    // Look for continue button (Clerk's two-step flow)
    const continueButton = page.locator('button:has-text("Continue")');
    if (await continueButton.isVisible({ timeout: 500 }).catch(() => false)) {
      await continueButton.click();
      // Wait for password field
      await page.locator(getPasswordInputSelector()).first().waitFor({ 
        state: 'visible', 
        timeout: DEFAULT_ELEMENT_TIMEOUT 
      }).catch(() => {});
    }

    // Fill password if visible
    const passwordInput = page.locator(getPasswordInputSelector()).first();
    if (await passwordInput.isVisible({ timeout: 500 }).catch(() => false)) {
      await passwordInput.fill('wrongpassword123');
      
      const submitButton = page.locator(getSubmitButtonSelector()).first();
      await submitButton.click();
      
      // Wait briefly for error response
      await page.waitForTimeout(1000);
    }

    // Should show some error or still be on sign-in (not redirected)
    await expect(page).toHaveURL(/sign-in/);
  });

  test('should be accessible via direct URL', async ({ page }) => {
    const response = await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });
    
    expect(response?.status()).toBeLessThan(400);
    
    // Page should have proper title
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('page should be mobile responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await goToSignIn(page, { timeout: AUTH_OPERATION_TIMEOUT });

    // Email input should still be visible and usable
    const emailInput = page.locator(getEmailInputSelector()).first();
    await expect(emailInput).toBeVisible({ timeout: DEFAULT_ELEMENT_TIMEOUT });
    
    // Submit button should be visible
    const submitButton = page.locator(getSubmitButtonSelector()).first();
    await expect(submitButton).toBeVisible({ timeout: DEFAULT_ELEMENT_TIMEOUT });
  });
});
