import { Page, expect } from '@playwright/test';
import { 
  goToSignIn, 
  goToSignUp, 
  getEmailInputSelector,
  getPasswordInputSelector,
  getSubmitButtonSelector,
  AUTH_OPERATION_TIMEOUT,
  DEFAULT_ELEMENT_TIMEOUT,
} from './test-helpers';

/**
 * Authentication flow helpers for QA tests.
 * 
 * Handles sign-up and sign-in flows with test user management.
 * 
 * UPDATED: Now uses domcontentloaded + explicit waits instead of networkidle.
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
 * Handles Clerk's authentication flow or test auth mode.
 */
export async function signUp(page: Page, user: TestUser): Promise<void> {
  // Navigate to sign-up using improved helper (no networkidle)
  await goToSignUp(page, { timeout: AUTH_OPERATION_TIMEOUT });
  
  // Find and fill email input (works for both test mode and Clerk)
  const emailInput = page.locator(getEmailInputSelector()).first();
  await expect(emailInput).toBeVisible({ timeout: DEFAULT_ELEMENT_TIMEOUT });
  await emailInput.fill(user.email);
  
  // Look for password input
  const passwordInput = page.locator(getPasswordInputSelector()).first();
  if (await passwordInput.isVisible({ timeout: 1000 }).catch(() => false)) {
    await passwordInput.fill(user.password);
  }
  
  // Fill name fields if visible (test mode has these)
  const firstNameInput = page.locator('[data-testid="signup-firstname"], input[name="firstName"]').first();
  if (await firstNameInput.isVisible({ timeout: 500 }).catch(() => false)) {
    await firstNameInput.fill(user.firstName || 'QA');
  }
  
  const lastNameInput = page.locator('[data-testid="signup-lastname"], input[name="lastName"]').first();
  if (await lastNameInput.isVisible({ timeout: 500 }).catch(() => false)) {
    await lastNameInput.fill(user.lastName || 'Test');
  }
  
  // Submit the form
  const submitButton = page.locator(getSubmitButtonSelector()).first();
  await submitButton.click();
  
  // Wait for navigation to complete - use explicit URL check instead of arbitrary timeout
  // Either we go to dashboard, verification, or stay on sign-up with error
  await page.waitForURL(/\/(dashboard|generator|app|sign-up)/, { timeout: AUTH_OPERATION_TIMEOUT });
  
  // Check if we need to handle email verification (Clerk flow)
  const verificationCode = page.locator('input[name="code"]');
  if (await verificationCode.isVisible({ timeout: 1000 }).catch(() => false)) {
    const qaSecret = process.env.QA_TEST_SECRET;
    if (qaSecret) {
      await page.request.post('/api/qa/verify-user', {
        data: { email: user.email, secret: qaSecret },
      });
      await page.reload({ waitUntil: 'domcontentloaded' });
    }
  }
  
  // Final check: should be on dashboard or similar
  await expect(page).toHaveURL(/\/(dashboard|generator|app)/, { timeout: AUTH_OPERATION_TIMEOUT });
}

/**
 * Sign in an existing user through the UI.
 * Works with both test auth mode and Clerk.
 */
export async function signIn(page: Page, user: TestUser): Promise<void> {
  // Navigate to sign-in using improved helper (no networkidle)
  await goToSignIn(page, { timeout: AUTH_OPERATION_TIMEOUT });
  
  // Find and fill email
  const emailInput = page.locator(getEmailInputSelector()).first();
  await expect(emailInput).toBeVisible({ timeout: DEFAULT_ELEMENT_TIMEOUT });
  await emailInput.fill(user.email);
  
  // Clerk might have a continue button before password (two-step flow)
  const continueButton = page.locator('button:has-text("Continue")');
  if (await continueButton.isVisible({ timeout: 500 }).catch(() => false)) {
    await continueButton.click();
    // Wait for password field to appear
    await page.locator(getPasswordInputSelector()).first().waitFor({ 
      state: 'visible', 
      timeout: DEFAULT_ELEMENT_TIMEOUT 
    });
  }
  
  // Fill password
  const passwordInput = page.locator(getPasswordInputSelector()).first();
  await expect(passwordInput).toBeVisible({ timeout: DEFAULT_ELEMENT_TIMEOUT });
  await passwordInput.fill(user.password);
  
  // Submit
  const submitButton = page.locator(getSubmitButtonSelector()).first();
  await submitButton.click();
  
  // Wait for navigation - should redirect to dashboard or stay on sign-in with error
  await page.waitForURL(/\/(dashboard|generator|app|sign-in)/, { timeout: AUTH_OPERATION_TIMEOUT });
  
  // Final check: should be on dashboard
  await expect(page).toHaveURL(/\/(dashboard|generator|app)/, { timeout: AUTH_OPERATION_TIMEOUT });
}

/**
 * Sign out the current user.
 */
export async function signOut(page: Page): Promise<void> {
  await page.goto('/sign-out', { waitUntil: 'domcontentloaded' });
  
  // Confirm sign out if needed
  const signOutButton = page.locator('button:has-text("Sign out")');
  if (await signOutButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    await signOutButton.click();
  }
  
  // Wait for redirect to home or sign-in
  await expect(page).toHaveURL(/^\/$|\/sign-in/, { timeout: AUTH_OPERATION_TIMEOUT });
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
 * 
 * Enhanced version that also captures page errors and provides filtering.
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

/**
 * Enhanced error capture with categorization.
 * Use with setupDiagnostics from test-helpers for comprehensive diagnostics.
 */
export { 
  setupDiagnostics, 
  printDiagnostics, 
  filterAcceptableErrors 
} from './test-helpers';
