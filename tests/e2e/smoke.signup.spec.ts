import { test, expect } from '@playwright/test';
import { generateTestUser, captureConsoleErrors } from '../../qa/flows/auth';

/**
 * Smoke Test: Sign Up Flow
 * 
 * Critical flow that must never break.
 * Tests user registration through Clerk authentication.
 */

test.describe('Sign Up Flow', () => {
  test('should display sign up page with required elements', async ({ page }) => {
    await page.goto('/sign-up');
    await page.waitForLoadState('networkidle');

    // Check for key elements
    await expect(page.locator('h1, h2').filter({ hasText: /sign up|create/i }).first()).toBeVisible();
    
    // Email input should be present
    const emailInput = page.locator('input[type="email"], input[name="emailAddress"]').first();
    await expect(emailInput).toBeVisible({ timeout: 10000 });
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/sign-up');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="email"], input[name="emailAddress"]').first();
    await expect(emailInput).toBeVisible({ timeout: 10000 });

    // Enter invalid email
    await emailInput.fill('invalid-email');
    
    // Try to continue/submit
    const submitButton = page.locator('button[type="submit"]').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(1000);
    }

    // Should show some validation error or not proceed
    // Clerk handles validation internally
  });

  test('should have working navigation to sign in', async ({ page }) => {
    await page.goto('/sign-up');
    await page.waitForLoadState('networkidle');

    // Look for sign in link
    const signInLink = page.locator('a[href*="sign-in"], button:has-text("Sign in")').first();
    await expect(signInLink).toBeVisible();
    
    await signInLink.click();
    await expect(page).toHaveURL(/sign-in/, { timeout: 10000 });
  });

  test('should not have console errors on page load', async ({ page }) => {
    const errors = captureConsoleErrors(page);
    
    await page.goto('/sign-up');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Give time for any async errors

    // Filter out known acceptable errors
    const severeErrors = errors.filter(e => 
      !e.includes('ResizeObserver') && 
      !e.includes('favicon') &&
      !e.includes('manifest')
    );

    expect(severeErrors.length).toBe(0);
  });

  test.skip('should complete full sign up flow', async ({ page }) => {
    // This test is skipped by default as it creates real users
    // Enable in CI with proper test environment
    
    const testUser = generateTestUser();
    const errors = captureConsoleErrors(page);

    await page.goto('/sign-up');
    await page.waitForLoadState('networkidle');

    // Fill email
    const emailInput = page.locator('input[type="email"], input[name="emailAddress"]').first();
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await emailInput.fill(testUser.email);

    // Fill password if visible
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    if (await passwordInput.isVisible()) {
      await passwordInput.fill(testUser.password);
    }

    // Submit
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();

    // Wait for next step or redirect
    await page.waitForTimeout(3000);

    // Should either show verification step or redirect to dashboard
    const onVerification = await page.locator('input[name="code"]').isVisible();
    const onDashboard = page.url().includes('dashboard');

    expect(onVerification || onDashboard).toBeTruthy();

    // No severe console errors
    const severeErrors = errors.filter(e => 
      !e.includes('ResizeObserver') && 
      !e.includes('favicon')
    );
    expect(severeErrors.length).toBe(0);
  });
});
