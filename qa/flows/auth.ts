import { Page, expect } from '@playwright/test';

/**
 * Authentication flow helpers for QA tests.
 * 
 * Handles sign-up and sign-in flows with test user management.
 */

export interface TestUser {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Generate a unique test user for the current test run.
 * Uses timestamp + random suffix to ensure uniqueness.
 */
export function generateTestUser(runId?: string): TestUser {
  const timestamp = runId || Date.now().toString();
  const domain = process.env.QA_TEST_EMAIL_DOMAIN || 'example.test';
  
  return {
    email: `qa+${timestamp}@${domain}`,
    password: process.env.QA_TEST_PASSWORD || 'TestPassword123!',
    firstName: 'QA',
    lastName: `Test${timestamp.slice(-4)}`,
  };
}

/**
 * Sign up a new user through the UI.
 * Handles Clerk's authentication flow.
 */
export async function signUp(page: Page, user: TestUser): Promise<void> {
  await page.goto('/sign-up');
  
  // Wait for Clerk to load
  await page.waitForLoadState('networkidle');
  
  // Clerk's sign-up form uses specific selectors
  // Try to find the email input in Clerk's form
  const emailInput = page.locator('input[name="emailAddress"], input[type="email"]').first();
  await expect(emailInput).toBeVisible({ timeout: 10000 });
  
  await emailInput.fill(user.email);
  
  // Look for password input
  const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
  if (await passwordInput.isVisible()) {
    await passwordInput.fill(user.password);
  }
  
  // Fill name fields if visible
  const firstNameInput = page.locator('input[name="firstName"]');
  if (await firstNameInput.isVisible()) {
    await firstNameInput.fill(user.firstName || 'QA');
  }
  
  const lastNameInput = page.locator('input[name="lastName"]');
  if (await lastNameInput.isVisible()) {
    await lastNameInput.fill(user.lastName || 'Test');
  }
  
  // Submit the form
  const submitButton = page.locator('button[type="submit"]').first();
  await submitButton.click();
  
  // Wait for redirect or next step
  // Clerk might show email verification step
  await page.waitForTimeout(2000);
  
  // Check if we need to handle email verification
  const verificationCode = page.locator('input[name="code"]');
  if (await verificationCode.isVisible()) {
    // In QA mode, we might have auto-verification enabled
    // Or use test-only bypass endpoint
    const qaSecret = process.env.QA_TEST_SECRET;
    if (qaSecret) {
      // Call test-only verification bypass
      await page.request.post('/api/qa/verify-user', {
        data: { email: user.email, secret: qaSecret },
      });
      // Refresh the page to continue
      await page.reload();
    }
  }
  
  // Wait for dashboard or success state
  await expect(page).toHaveURL(/\/(dashboard|generator|app)/, { timeout: 30000 });
}

/**
 * Sign in an existing user through the UI.
 */
export async function signIn(page: Page, user: TestUser): Promise<void> {
  await page.goto('/sign-in');
  
  // Wait for Clerk to load
  await page.waitForLoadState('networkidle');
  
  // Find and fill email
  const emailInput = page.locator('input[name="identifier"], input[type="email"]').first();
  await expect(emailInput).toBeVisible({ timeout: 10000 });
  await emailInput.fill(user.email);
  
  // Clerk might have a continue button before password
  const continueButton = page.locator('button:has-text("Continue")');
  if (await continueButton.isVisible()) {
    await continueButton.click();
    await page.waitForTimeout(1000);
  }
  
  // Fill password
  const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
  await expect(passwordInput).toBeVisible({ timeout: 5000 });
  await passwordInput.fill(user.password);
  
  // Submit
  const submitButton = page.locator('button[type="submit"]').first();
  await submitButton.click();
  
  // Wait for dashboard
  await expect(page).toHaveURL(/\/(dashboard|generator|app)/, { timeout: 30000 });
}

/**
 * Sign out the current user.
 */
export async function signOut(page: Page): Promise<void> {
  await page.goto('/sign-out');
  await page.waitForLoadState('networkidle');
  
  // Confirm sign out if needed
  const signOutButton = page.locator('button:has-text("Sign out")');
  if (await signOutButton.isVisible()) {
    await signOutButton.click();
  }
  
  // Wait for redirect to home
  await expect(page).toHaveURL(/^\/$|\/sign-in/, { timeout: 10000 });
}

/**
 * Check if user is authenticated by looking for dashboard access.
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const response = await page.request.get('/api/auth/user');
  return response.ok();
}

/**
 * Create a test user via API (faster than UI for setup).
 * Requires QA_TEST_SECRET to be set.
 */
export async function createTestUserViaAPI(page: Page, user: TestUser): Promise<boolean> {
  const qaSecret = process.env.QA_TEST_SECRET;
  if (!qaSecret) {
    return false;
  }
  
  try {
    const response = await page.request.post('/api/qa/create-user', {
      data: {
        ...user,
        secret: qaSecret,
      },
    });
    return response.ok();
  } catch {
    return false;
  }
}

/**
 * Capture console errors during a test.
 */
export function captureConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  page.on('pageerror', (error) => {
    errors.push(error.message);
  });
  
  return errors;
}
