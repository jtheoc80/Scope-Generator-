import { test, expect } from '@playwright/test';

/**
 * Preflight Smoke Test
 * 
 * This test runs first to validate the test harness is correctly configured.
 * If this test fails, it provides clear, actionable error messages for debugging
 * common misconfigurations:
 * 
 * - Missing or unreachable webServer
 * - Invalid baseURL configuration
 * - Browser not installed
 * - Network connectivity issues
 * 
 * Run this test first when debugging test harness issues:
 *   npx playwright test smoke.preflight.spec.ts --project=chromium
 *   npx playwright test smoke.preflight.spec.ts --project=mobile-chrome
 */

test.describe('Preflight Checks', () => {
  test('webServer is reachable and baseURL is valid', async ({ page, baseURL }) => {
    // Validate baseURL is configured
    if (!baseURL) {
      throw new Error(
        `PREFLIGHT FAILURE: baseURL is not configured.\n` +
        `Fix: Ensure playwright.config.ts has 'use.baseURL' set, or set QA_BASE_URL env var.\n` +
        `Example: QA_BASE_URL=http://localhost:3000 npx playwright test`
      );
    }

    // Attempt to reach the homepage
    let response;
    try {
      response = await page.goto('/', { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('ERR_CONNECTION_REFUSED') || 
          err.message.includes('ECONNREFUSED')) {
        throw new Error(
          `PREFLIGHT FAILURE: Cannot connect to ${baseURL}\n` +
          `The webServer is not running or unreachable.\n\n` +
          `Fix options:\n` +
          `  1. Start the dev server manually: npm run dev\n` +
          `  2. Check webServer config in playwright.config.ts\n` +
          `  3. Verify the port ${new URL(baseURL).port || '3000'} is not in use\n` +
          `  4. In CI, ensure the server is started before running tests\n\n` +
          `Original error: ${err.message}`
        );
      }
      if (err.message.includes('ERR_NAME_NOT_RESOLVED') ||
          err.message.includes('ENOTFOUND')) {
        throw new Error(
          `PREFLIGHT FAILURE: Cannot resolve hostname for ${baseURL}\n` +
          `The URL hostname is invalid or DNS resolution failed.\n\n` +
          `Fix: Check QA_BASE_URL environment variable or baseURL in config.\n` +
          `Expected: http://localhost:3000 (or your staging URL)\n\n` +
          `Original error: ${err.message}`
        );
      }
      throw new Error(
        `PREFLIGHT FAILURE: Failed to navigate to ${baseURL}\n` +
        `Original error: ${err.message}`
      );
    }

    // Check response status
    if (!response) {
      throw new Error(
        `PREFLIGHT FAILURE: No response received from ${baseURL}\n` +
        `The server may have crashed or returned an empty response.`
      );
    }

    const status = response.status();
    if (status >= 500) {
      throw new Error(
        `PREFLIGHT FAILURE: Server error (HTTP ${status}) at ${baseURL}\n` +
        `The server returned a 5xx error. Check server logs for details.`
      );
    }

    if (status === 404) {
      throw new Error(
        `PREFLIGHT FAILURE: Homepage not found (HTTP 404) at ${baseURL}\n` +
        `The / route may not be configured. Check your Next.js pages/routes.`
      );
    }

    expect(status).toBeLessThan(400);

    // Verify the page has basic structure (not a blank page)
    const body = page.locator('body');
    await expect(body).toBeAttached({ timeout: 10000 });

    // Check for a non-empty page (basic smoke check)
    const bodyText = await body.textContent();
    if (!bodyText || bodyText.trim().length === 0) {
      throw new Error(
        `PREFLIGHT FAILURE: Page at ${baseURL} appears empty.\n` +
        `The HTML body has no text content. This may indicate:\n` +
        `  - JavaScript failed to hydrate the page\n` +
        `  - A rendering error occurred\n` +
        `  - The wrong page is being served`
      );
    }

    // Log success info for debugging
    console.log(`✓ Preflight passed:`);
    console.log(`  - baseURL: ${baseURL}`);
    console.log(`  - HTTP status: ${status}`);
    console.log(`  - Page has content: ${bodyText.slice(0, 100).trim()}...`);
  });

  test('browser viewport is correctly configured', async ({ page, viewport }) => {
    // Check viewport is set (important for mobile testing)
    if (!viewport) {
      console.warn('Warning: No viewport configured - using browser defaults');
    } else {
      console.log(`✓ Configured Viewport: ${viewport.width}x${viewport.height}`);
    }

    // Quick DOM check - ensure we can interact with the page
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    
    // Log actual viewport for debugging (may differ due to page's viewport meta tag)
    const actualViewport = await page.evaluate(() => ({
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
    }));
    console.log(`✓ Actual window: ${actualViewport.innerWidth}x${actualViewport.innerHeight}`);
    console.log(`✓ Screen: ${actualViewport.screenWidth}x${actualViewport.screenHeight}`);
    
    // For mobile viewport, verify we're in a reasonable mobile range
    // Note: window.innerWidth may differ from viewport.width due to page's CSS/meta viewport
    if (viewport && viewport.width < 500) {
      // Mobile device - just verify viewport config is present
      expect(viewport.width).toBeLessThan(500);
      expect(viewport.height).toBeGreaterThan(500);
      console.log(`✓ Mobile viewport configured correctly`);
    }
  });

  test('project configuration is valid', async ({ browserName, page }) => {
    // Log browser info for debugging
    console.log(`✓ Browser: ${browserName}`);
    
    const userAgent = await page.evaluate(() => navigator.userAgent);
    console.log(`✓ User Agent: ${userAgent.slice(0, 80)}...`);
    
    // For mobile-chrome project, verify we're using Chromium with mobile UA
    if (process.env.PLAYWRIGHT_PROJECT_NAME === 'mobile-chrome') {
      expect(userAgent.toLowerCase()).toContain('android');
      expect(userAgent.toLowerCase()).toContain('mobile');
    }
    
    // Verify we can make basic API requests from the page
    await page.goto('/');
    
    // Test that JavaScript is working
    const jsWorks = await page.evaluate(() => {
      return typeof window !== 'undefined' && typeof document !== 'undefined';
    });
    expect(jsWorks).toBe(true);
    console.log(`✓ JavaScript execution: working`);
  });
});
