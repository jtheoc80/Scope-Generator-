import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for QA Agent E2E tests.
 * 
 * Environment variables:
 * - QA_BASE_URL: Base URL for tests (default: http://localhost:3000)
 * - CI: Set automatically by GitHub Actions
 * 
 * Projects:
 * - chromium: Desktop Chrome browser
 * - mobile-chrome: Mobile Chrome emulation using Pixel 5 (Android device)
 * 
 * Running mobile-chrome locally:
 *   npx playwright test --project=mobile-chrome
 *   npx playwright test --project=mobile-chrome --headed
 */

const baseURL = process.env.QA_BASE_URL || 'http://localhost:3000';

export default defineConfig({
  testDir: './tests/e2e',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI for flaky test stability - 3 retries for smoke tests */
  retries: process.env.CI ? 3 : 0,
  
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
    
    /* Timeout for each action */
    actionTimeout: 15000,
    
    /* Navigation timeout */
    navigationTimeout: 30000,
  },

  /* Global timeout for each test */
  timeout: 60000,
  
  /* Expect timeout */
  expect: {
    timeout: 10000,
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
   * Run your local dev server before starting the tests.
   * In CI, we start the server separately (via npm run start) for better control.
   * Locally, this auto-starts dev server if not already running.
   */
  webServer: {
    command: process.env.CI ? 'npm run start' : 'npm run dev',
    url: baseURL,
    timeout: 120000,
    /* Don't start server in CI - it's started separately in the workflow */
    ...(process.env.CI && { reuseExistingServer: true }),
  },
});
