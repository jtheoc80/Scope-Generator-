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
  
  /* Shared settings for all projects */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: process.env.QA_BASE_URL || 'http://localhost:3000',
    
    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    
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
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['iPhone 12'] },
    },
    // Uncomment for multi-browser testing
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  /* Directory for test artifacts */
  outputDir: 'qa/reports/test-results',

  /* Run your local dev server before starting the tests */
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120000,
    /* Pass test auth mode env variables to dev server */
    env: {
      AUTH_MODE: process.env.AUTH_MODE || '',
      NEXT_PUBLIC_AUTH_MODE: process.env.NEXT_PUBLIC_AUTH_MODE || '',
    },
  },
});
