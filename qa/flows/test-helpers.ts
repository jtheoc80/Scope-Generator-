import { Page, expect } from '@playwright/test';

/**
 * Test Helpers - Improved waiting strategies and diagnostics for e2e tests.
 * 
 * Key improvements:
 * 1. Replaces `networkidle` with `domcontentloaded` + explicit element waits
 * 2. Provides better error diagnostics on failure
 * 3. Configurable timeouts with sensible defaults
 */

// Default timeout for page navigation (10 seconds - enough for Next.js initial render + hydration)
export const DEFAULT_NAVIGATION_TIMEOUT = 10000;

// Default timeout for element visibility (5 seconds)
export const DEFAULT_ELEMENT_TIMEOUT = 5000;

// Maximum wait time for auth-related operations
export const AUTH_OPERATION_TIMEOUT = 5000;

/**
 * Collected diagnostic information from a test run
 */
export interface TestDiagnostics {
  consoleErrors: string[];
  consoleWarnings: string[];
  networkFailures: Array<{ url: string; status?: number; error?: string }>;
  pageErrors: string[];
}

/**
 * Set up diagnostic capture for a page.
 * Call this at the start of a test to collect errors on failure.
 */
export function setupDiagnostics(page: Page): TestDiagnostics {
  const diagnostics: TestDiagnostics = {
    consoleErrors: [],
    consoleWarnings: [],
    networkFailures: [],
    pageErrors: [],
  };

  // Capture console messages
  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    
    if (type === 'error') {
      diagnostics.consoleErrors.push(text);
    } else if (type === 'warning') {
      diagnostics.consoleWarnings.push(text);
    }
  });

  // Capture page errors (unhandled exceptions)
  page.on('pageerror', (error) => {
    diagnostics.pageErrors.push(error.message);
  });

  // Capture failed network requests
  page.on('requestfailed', (request) => {
    diagnostics.networkFailures.push({
      url: request.url(),
      error: request.failure()?.errorText,
    });
  });

  // Capture responses with error status codes
  page.on('response', (response) => {
    const status = response.status();
    if (status >= 400 && status !== 401 && status !== 403) {
      // Don't log 401/403 as errors since they're expected for auth
      diagnostics.networkFailures.push({
        url: response.url(),
        status,
      });
    }
  });

  return diagnostics;
}

/**
 * Print diagnostics on test failure.
 * Call this in afterEach when a test fails.
 */
export function printDiagnostics(diagnostics: TestDiagnostics | undefined, testName?: string): void {
  // Guard against undefined diagnostics (can happen if beforeEach failed)
  if (!diagnostics) return;
  
  const hasIssues = 
    diagnostics.consoleErrors.length > 0 ||
    diagnostics.pageErrors.length > 0 ||
    diagnostics.networkFailures.length > 0;

  if (!hasIssues) return;

  console.log('\n========================================');
  console.log(`TEST DIAGNOSTICS${testName ? `: ${testName}` : ''}`);
  console.log('========================================');

  if (diagnostics.consoleErrors.length > 0) {
    console.log('\n📛 Console Errors:');
    diagnostics.consoleErrors.forEach((err, i) => {
      console.log(`  ${i + 1}. ${err.substring(0, 200)}${err.length > 200 ? '...' : ''}`);
    });
  }

  if (diagnostics.pageErrors.length > 0) {
    console.log('\n💥 Page Errors (Unhandled Exceptions):');
    diagnostics.pageErrors.forEach((err, i) => {
      console.log(`  ${i + 1}. ${err.substring(0, 200)}${err.length > 200 ? '...' : ''}`);
    });
  }

  if (diagnostics.networkFailures.length > 0) {
    console.log('\n🌐 Network Failures:');
    diagnostics.networkFailures.forEach((failure, i) => {
      const statusInfo = failure.status ? `[${failure.status}]` : '';
      const errorInfo = failure.error ? `- ${failure.error}` : '';
      console.log(`  ${i + 1}. ${statusInfo} ${failure.url.substring(0, 100)} ${errorInfo}`);
    });
  }

  console.log('\n========================================\n');
}

/**
 * Filter diagnostics to remove known acceptable errors.
 * Use this before asserting on error counts.
 */
export function filterAcceptableErrors(diagnostics: TestDiagnostics): TestDiagnostics {
  const acceptablePatterns = [
    /ResizeObserver/i,
    /favicon/i,
    /manifest/i,
    /hydrat/i, // Hydration warnings in dev
    /webpack/i,
    /hot-update/i,
    /__nextjs/i,
  ];

  const isAcceptable = (text: string) => 
    acceptablePatterns.some(pattern => pattern.test(text));

  return {
    consoleErrors: diagnostics.consoleErrors.filter(e => !isAcceptable(e)),
    consoleWarnings: diagnostics.consoleWarnings.filter(e => !isAcceptable(e)),
    pageErrors: diagnostics.pageErrors.filter(e => !isAcceptable(e)),
    networkFailures: diagnostics.networkFailures.filter(f => 
      !isAcceptable(f.url) && !isAcceptable(f.error || '')
    ),
  };
}

/**
 * Navigate to a page using domcontentloaded instead of networkidle.
 * 
 * This is faster and more reliable for Next.js apps which often have
 * persistent connections (analytics, WebSocket, etc.) that prevent
 * networkidle from ever triggering.
 * 
 * @param page - Playwright page
 * @param url - URL to navigate to
 * @param options - Additional options
 */
export async function navigateTo(
  page: Page,
  url: string,
  options?: {
    /** Wait for this selector to be visible after navigation */
    waitForSelector?: string;
    /** Timeout for navigation */
    timeout?: number;
    /** Additional wait after domcontentloaded (avoid if possible) */
    additionalWait?: number;
  }
): Promise<void> {
  const { waitForSelector, timeout = DEFAULT_NAVIGATION_TIMEOUT, additionalWait } = options || {};

  // Navigate with domcontentloaded - fires when HTML is parsed
  await page.goto(url, {
    waitUntil: 'domcontentloaded',
    timeout,
  });

  // If a selector is specified, wait for it to be visible
  if (waitForSelector) {
    await expect(page.locator(waitForSelector).first()).toBeVisible({
      timeout: DEFAULT_ELEMENT_TIMEOUT,
    });
  }

  // Only use additional wait if absolutely necessary
  if (additionalWait) {
    await page.waitForTimeout(additionalWait);
  }
}

/**
 * Navigate to sign-in page and wait for form to be ready.
 */
export async function goToSignIn(
  page: Page,
  options?: { timeout?: number }
): Promise<void> {
  const { timeout = AUTH_OPERATION_TIMEOUT } = options || {};
  
  await page.goto('/sign-in', {
    waitUntil: 'domcontentloaded',
    timeout,
  });

  // Wait for the email input to be visible (works for both test mode and Clerk)
  const emailInput = page.locator(getEmailInputSelector()).first();
  await expect(emailInput).toBeVisible({ timeout });
}

/**
 * Navigate to sign-up page and wait for form to be ready.
 */
export async function goToSignUp(
  page: Page,
  options?: { timeout?: number }
): Promise<void> {
  const { timeout = AUTH_OPERATION_TIMEOUT } = options || {};
  
  await page.goto('/sign-up', {
    waitUntil: 'domcontentloaded',
    timeout,
  });

  // Wait for the email input to be visible (works for both test mode and Clerk)
  const emailInput = page.locator(getEmailInputSelector()).first();
  await expect(emailInput).toBeVisible({ timeout });
}

/**
 * Wait for page to be interactive (ready for user input).
 * Use this instead of networkidle for forms and interactive pages.
 */
export async function waitForInteractive(
  page: Page,
  selectors: string[],
  timeout: number = DEFAULT_ELEMENT_TIMEOUT
): Promise<void> {
  for (const selector of selectors) {
    await expect(page.locator(selector).first()).toBeVisible({ timeout });
  }
}

/**
 * Assert API endpoint responds correctly.
 * Checks status code and optionally response shape.
 */
export async function assertApiResponse(
  page: Page,
  endpoint: string,
  options?: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    data?: Record<string, unknown>;
    expectedStatus?: number | number[];
    expectJson?: boolean;
    timeout?: number;
  }
): Promise<{ status: number; body: unknown }> {
  const {
    method = 'GET',
    data,
    expectedStatus,
    expectJson = true,
    timeout = DEFAULT_NAVIGATION_TIMEOUT,
  } = options || {};

  const requestOptions: Parameters<Page['request']['fetch']>[1] = {
    method,
    timeout,
    failOnStatusCode: false,
  };

  if (data) {
    requestOptions.data = data;
  }

  const response = await page.request.fetch(endpoint, requestOptions);
  const status = response.status();

  // Check expected status
  if (expectedStatus !== undefined) {
    const expectedStatuses = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
    // Assert that the actual status is one of the expected statuses
    expect(expectedStatuses, `Expected status to be one of ${expectedStatuses}, but got ${status}`).toContain(status);
  } else {
    // Default: no server errors
    expect(status).toBeLessThan(500);
  }

  // Parse body if JSON expected
  let body: unknown = null;
  if (expectJson) {
    try {
      body = await response.json();
    } catch {
      // Not JSON, that's okay for some responses
      body = await response.text();
    }
  }

  return { status, body };
}

/**
 * Check if we're in test auth mode.
 * Useful for conditional test logic.
 */
export function isTestAuthMode(): boolean {
  return process.env.AUTH_MODE === 'test' || process.env.NEXT_PUBLIC_AUTH_MODE === 'test';
}

/**
 * Get the email input selector that works for both test mode and Clerk.
 */
export function getEmailInputSelector(): string {
  return '[data-testid="signin-email"], [data-testid="signup-email"], input[type="email"], input[name="identifier"], input[name="emailAddress"]';
}

/**
 * Get the password input selector that works for both test mode and Clerk.
 */
export function getPasswordInputSelector(): string {
  return '[data-testid="signin-password"], [data-testid="signup-password"], input[type="password"], input[name="password"]';
}

/**
 * Get the submit button selector that works for both test mode and Clerk.
 */
export function getSubmitButtonSelector(): string {
  return '[data-testid="auth-submit"], button[type="submit"]';
}
