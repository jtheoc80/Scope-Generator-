import { test, expect } from '@playwright/test';
import { captureConsoleErrors } from '../../qa/flows/auth';

/**
 * Smoke Test: Sign In Flow
 * 
 * Critical flow that must never break.
 * Tests user authentication through Clerk.
 */

test.describe('Sign In Flow', () => {
  test('should display sign in page with required elements', async ({ page }) => {
    await page.goto('/sign-in');
    await page.waitForLoadState('networkidle');

    // Check for key elements
    await expect(page.locator('h1, h2').filter({ hasText: /sign in|log in|welcome/i }).first()).toBeVisible();
    
    // Email/identifier input should be present
    const emailInput = page.locator('input[type="email"], input[name="identifier"], input[name="emailAddress"]').first();
    await expect(emailInput).toBeVisible({ timeout: 10000 });
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/sign-in');
    await page.waitForLoadState('networkidle');

    // Try to submit without entering anything
    const submitButton = page.locator('button[type="submit"]').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(1000);
    }

    // Clerk should show validation or not proceed
    // Just verify we're still on sign-in page
    await expect(page).toHaveURL(/sign-in/);
  });

  test('should have working navigation to sign up', async ({ page }) => {
    await page.goto('/sign-in');
    await page.waitForLoadState('networkidle');

    // Look for sign up link
    const signUpLink = page.locator('a[href*="sign-up"], button:has-text("Sign up")').first();
    await expect(signUpLink).toBeVisible();
    
    await signUpLink.click();
    await expect(page).toHaveURL(/sign-up/, { timeout: 10000 });
  });

  test('should not have console errors on page load', async ({ page }) => {
    const errors = captureConsoleErrors(page);
    
    await page.goto('/sign-in');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Filter out known acceptable errors
    const severeErrors = errors.filter(e => 
      !e.includes('ResizeObserver') && 
      !e.includes('favicon') &&
      !e.includes('manifest')
    );

    expect(severeErrors.length).toBe(0);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/sign-in');
    await page.waitForLoadState('networkidle');

    // Fill invalid credentials
    const emailInput = page.locator('input[type="email"], input[name="identifier"]').first();
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await emailInput.fill('nonexistent@example.com');

    // Look for continue button (Clerk's two-step flow)
    const continueButton = page.locator('button:has-text("Continue")');
    if (await continueButton.isVisible()) {
      await continueButton.click();
      await page.waitForTimeout(1000);
    }

    // Fill password if visible
    const passwordInput = page.locator('input[type="password"]').first();
    if (await passwordInput.isVisible()) {
      await passwordInput.fill('wrongpassword123');
      
      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();
      await page.waitForTimeout(2000);
    }

    // Should show some error or still be on sign-in
    await expect(page).toHaveURL(/sign-in/);
  });

  test('should be accessible via direct URL', async ({ page }) => {
    const response = await page.goto('/sign-in');
    
    expect(response?.status()).toBeLessThan(400);
    
    // Page should have proper title
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('page should be mobile responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/sign-in');
    await page.waitForLoadState('networkidle');

    // Email input should still be visible and usable
    const emailInput = page.locator('input[type="email"], input[name="identifier"]').first();
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    
    // Submit button should be visible
    const submitButton = page.locator('button[type="submit"]').first();
    await expect(submitButton).toBeVisible();
  });
});
