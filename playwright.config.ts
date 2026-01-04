import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for QA Agent E2E tests.
 * 
 * Environment variables:
 * - QA_BASE_URL: Base URL for tests (default: http://localhost:3000)
 * - CI: Set automatically by GitHub Actions
 * - AUTH_MODE: Set to 'test' for predictable test authentication (no real Clerk)
 * - NEXT_PUBLIC_AUTH_MODE: Client-side auth mode flag
 * 
 * Test Auth Mode:
 * When AUTH_MODE=test is set, the app will render test-friendly auth forms
 * instead of Clerk components, allowing for deterministic e2e testing.
 * 
 * IMPORTANT: networkidle is NOT used - we use domcontentloaded + explicit waits.
 */

const baseURL = process.env.QA_BASE_URL || 'http://localhost:3000';

export default defineConfig({
  testDir: './tests/e2e',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI for flaky test stability - reduced from 3 to 2 since tests are more reliable now */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI for stability */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter configuration */
  reporter: [
    ['html', { outputFolder: 'qa/reports/playwright-html', open: 'never' }],
    ['json', { outputFile: 'qa/reports/playwright-results.json' }],
    ['list'],
  ],
  
  /* Shared settings for all projects - baseURL applies globally */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL,
    
    /* Collect trace on first retry in CI for debugging flaky tests */
    trace: process.env.CI ? 'on-first-retry' : 'off',
    
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Video on failure */
    video: 'retain-on-failure',
    
    /* Timeout for each action - reduced from 15s to 5s for faster feedback */
    actionTimeout: 5000,
    
    /* Navigation timeout - reduced from 30s to 10s (no networkidle) */
    navigationTimeout: 10000,
  },

  /* Global timeout for each test - reduced from 60s to 30s */
  timeout: 30000,
  
  /* Expect timeout - reduced from 10s to 5s */
  expect: {
    timeout: 5000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'mobile-chrome',
      /* 
       * Uses Pixel 5 device emulation - an Android device that runs Chromium.
       * This ensures tests run with the chromium browser that's already installed,
       * unlike iPhone devices which require WebKit.
       * 
       * Device specs: 393x851 viewport, touch enabled, mobile user agent
       */
      use: { 
        ...devices['Pixel 5'],
      },
    },
    // Uncomment for multi-browser testing (requires additional browser installs)
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
    // {
    //   name: 'mobile-safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  /* Directory for test artifacts */
  outputDir: 'qa/reports/test-results',

  /*
   * Web server configuration for Playwright tests.
   * - In CI, the server is started separately in the workflow; this will reuse it.
   * - Locally, this will start the dev server if it's not already running.
   */
  webServer: {
    command: 'npm run dev',
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120000,
    /* Pass test auth mode env variables to dev server */
    env: {
      AUTH_MODE: process.env.AUTH_MODE || '',
      NEXT_PUBLIC_AUTH_MODE: process.env.NEXT_PUBLIC_AUTH_MODE || '',
    },
  },
});
