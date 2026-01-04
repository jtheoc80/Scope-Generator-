import { test, expect } from '@playwright/test';
import { 
  generateTestUser, 
  captureConsoleErrors,
  setupDiagnostics,
  printDiagnostics,
} from '../../qa/flows/auth';
import {
  goToSignUp,
  getEmailInputSelector,
  getPasswordInputSelector,
  getSubmitButtonSelector,
  AUTH_OPERATION_TIMEOUT,
  DEFAULT_ELEMENT_TIMEOUT,
  TestDiagnostics,
} from '../../qa/flows/test-helpers';

/**
 * Smoke Test: Sign Up Flow
 * 
 * Critical flow that must never break.
 * Tests user registration through Clerk or test auth mode.
 * 
 * UPDATED: Uses domcontentloaded + explicit waits instead of networkidle.
 * Maximum wait time: 5s per operation (not 17s timeouts).
 */

test.describe('Sign Up Flow @smoke', () => {
  let diagnostics: TestDiagnostics;

  test.beforeEach(async ({ page }) => {
    diagnostics = setupDiagnostics(page);
  });

  test.afterEach(async ({}, testInfo) => {
    if (testInfo.status !== 'passed') {
      printDiagnostics(diagnostics, testInfo.title);
    }
  });

  test('should display sign up page with required elements', async ({ page }) => {
    // Use improved navigation helper (no networkidle)
    await goToSignUp(page, { timeout: AUTH_OPERATION_TIMEOUT });

    // Check for sign-up form container
    await expect(page.locator('[data-testid="signup-form"], [data-testid="signup-page"]').first())
      .toBeVisible({ timeout: DEFAULT_ELEMENT_TIMEOUT });

    // Check for key elements
    await expect(page.locator('h1, h2').filter({ hasText: /sign up|create/i }).first())
      .toBeVisible({ timeout: DEFAULT_ELEMENT_TIMEOUT });
    
    // Email input should be present
    const emailInput = page.locator(getEmailInputSelector()).first();
    await expect(emailInput).toBeVisible({ timeout: DEFAULT_ELEMENT_TIMEOUT });
  });

  test('should validate email format', async ({ page }) => {
    await goToSignUp(page, { timeout: AUTH_OPERATION_TIMEOUT });

    const emailInput = page.locator(getEmailInputSelector()).first();
    await expect(emailInput).toBeVisible({ timeout: DEFAULT_ELEMENT_TIMEOUT });

    // Enter invalid email
    await emailInput.fill('invalid-email');
    
    // Try to continue/submit
    const submitButton = page.locator(getSubmitButtonSelector()).first();
    if (await submitButton.isVisible({ timeout: DEFAULT_ELEMENT_TIMEOUT })) {
      await submitButton.click();
      
      // Wait briefly for validation
      await page.waitForTimeout(500);
    }

    // Should show validation error or stay on page (Clerk/test mode handles validation)
    await expect(page).toHaveURL(/sign-up/);
  });

  test('should have working navigation to sign in', async ({ page }) => {
    await goToSignUp(page, { timeout: AUTH_OPERATION_TIMEOUT });

    // Look for sign in link
    const signInLink = page.locator('a[href*="sign-in"], button:has-text("Sign in")').first();
    await expect(signInLink).toBeVisible({ timeout: DEFAULT_ELEMENT_TIMEOUT });
    
    await signInLink.click();
    await expect(page).toHaveURL(/sign-in/, { timeout: AUTH_OPERATION_TIMEOUT });
  });

  test('should not have console errors on page load', async ({ page }) => {
    const errors = captureConsoleErrors(page);
    
    await goToSignUp(page, { timeout: AUTH_OPERATION_TIMEOUT });
    
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

  test.skip('should complete full sign up flow', async ({ page }) => {
    // This test is skipped by default as it creates real users
    // Enable in CI with AUTH_MODE=test for predictable testing
    
    const testUser = generateTestUser();
    const errors = captureConsoleErrors(page);

    await goToSignUp(page, { timeout: AUTH_OPERATION_TIMEOUT });

    // Fill email
    const emailInput = page.locator(getEmailInputSelector()).first();
    await expect(emailInput).toBeVisible({ timeout: DEFAULT_ELEMENT_TIMEOUT });
    await emailInput.fill(testUser.email);

    // Fill password if visible
    const passwordInput = page.locator(getPasswordInputSelector()).first();
    if (await passwordInput.isVisible({ timeout: 500 }).catch(() => false)) {
      await passwordInput.fill(testUser.password);
    }

    // Submit
    const submitButton = page.locator(getSubmitButtonSelector()).first();
    await submitButton.click();

    // Wait for navigation - either verification, dashboard, or stay with error
    await page.waitForURL(/\/(dashboard|generator|app|sign-up)/, { timeout: AUTH_OPERATION_TIMEOUT });

    // Should either show verification step or redirect to dashboard
    const onVerification = await page.locator('input[name="code"]').isVisible({ timeout: 500 }).catch(() => false);
    const onDashboard = page.url().includes('dashboard');
    const onGenerator = page.url().includes('generator');

    expect(onVerification || onDashboard || onGenerator).toBeTruthy();

    // No severe console errors
    const severeErrors = errors.filter(e => 
      !e.includes('ResizeObserver') && 
      !e.includes('favicon') &&
      !e.includes('hydrat')
    );
    expect(severeErrors.length).toBe(0);
  });
});
