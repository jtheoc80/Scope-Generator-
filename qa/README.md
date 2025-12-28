# QA Agent

This directory contains the QA Agent infrastructure for end-to-end testing and continuous validation of critical flows.

## Quick Start

```bash
# Run full QA suite locally
npm run qa

# Run only E2E tests
npm run e2e

# Run E2E tests with browser UI
npm run e2e:ui

# Run Lighthouse CI
npm run lighthouse
```

## Critical Flows Tested

The QA Agent validates these flows that **must never break**:

1. **Sign Up** - User registration through Clerk
2. **Sign In** - User authentication
3. **Create Proposal** - Proposal generation and saving
4. **Add Photos** - Photo upload and management
5. **Email PDF** - Sending proposals via email
6. **Checkout** - Stripe payment flow
7. **Delete Draft** - Draft proposal deletion with confirmation

## Project Structure

```
qa/
├── flows/              # Reusable flow helpers (page objects)
│   ├── auth.ts         # Authentication helpers
│   ├── proposal.ts     # Proposal management helpers
│   ├── checkout.ts     # Checkout/payment helpers
│   └── index.ts        # Barrel export
├── reports/            # Generated reports (gitignored)
│   ├── emails/         # Email sink records
│   ├── pdfs/           # PDF artifacts
│   ├── lighthouse/     # Lighthouse reports
│   └── summary.md      # Run summary
├── scripts/
│   └── runner.ts       # Main QA orchestrator
└── README.md           # This file

tests/
├── e2e/                # Playwright E2E tests
│   ├── smoke.signup.spec.ts
│   ├── smoke.signin.spec.ts
│   ├── smoke.proposal-create.spec.ts
│   ├── smoke.proposal-photos.spec.ts
│   ├── smoke.email-pdf.spec.ts
│   ├── smoke.checkout.spec.ts
│   └── smoke.delete-draft.spec.ts
└── fixtures/
    └── images/         # Test fixture images
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `QA_BASE_URL` | Base URL for tests | `http://localhost:3000` |
| `QA_TEST_EMAIL_DOMAIN` | Domain for test emails | `example.test` |
| `QA_EMAIL_SINK` | Email sink mode (`file` for testing) | - |
| `QA_STRIPE_MODE` | Checkout test mode (`redirect` or `api-assert`) | `redirect` |
| `QA_TEST_SECRET` | Secret for QA-only endpoints | - |
| `QA_TEST_PASSWORD` | Password for test users | `TestPassword123!` |

## CI/CD Integration

The QA Agent runs automatically via GitHub Actions:

- **On Pull Request**: Runs against local build
- **On Push to Main**: Runs against local build
- **Nightly (2 AM UTC)**: Runs against staging/production

### Artifacts

After each CI run, these artifacts are available:
- `playwright-report` - HTML test report
- `playwright-results` - JSON test results
- `lighthouse-report` - Performance/accessibility reports
- `qa-summary` - Human-readable summary

## Email Testing

When `QA_EMAIL_SINK=file`, emails are captured to JSON files instead of being sent:

```typescript
// Email records are stored at qa/reports/emails/<runId>.json
{
  "id": "email-xxx",
  "to": "recipient@example.test",
  "subject": "Proposal: Kitchen Remodel",
  "pdfFileName": "proposal-123.pdf",
  "pdfByteLength": 45678,
  "proposalId": 123,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Verifying Emails in Tests

```typescript
// In your test:
const response = await page.request.get('/api/qa/email-records?runId=' + runId);
const { records } = await response.json();
expect(records[0].to).toBe(expectedEmail);
expect(records[0].pdfByteLength).toBeGreaterThan(10000);
```

## Checkout Testing

Two modes are supported:

### Redirect Mode (Default)

Tests the checkout flow up to Stripe redirect:
- Creates checkout session
- Verifies redirect URL
- Optionally fills Stripe test card

### API Assert Mode

Uses test-only endpoint to simulate payment:
- Creates checkout session
- Calls `/api/qa/simulate-payment`
- Verifies fulfillment

Set `QA_STRIPE_MODE=api-assert` and provide `QA_TEST_SECRET`.

## Writing New Tests

1. Create a new spec file in `tests/e2e/`
2. Use flow helpers from `qa/flows/`
3. Follow the smoke test pattern:

```typescript
import { test, expect } from '@playwright/test';
import { generateTestUser } from '../../qa/flows';

test.describe('My New Flow', () => {
  test('should do something important', async ({ page }) => {
    // Navigate
    await page.goto('/my-page');
    
    // Interact
    await page.click('[data-testid="my-button"]');
    
    // Assert
    await expect(page.locator('[data-testid="success"]')).toBeVisible();
  });
});
```

## Adding Test IDs

Add `data-testid` attributes to critical UI elements:

```tsx
<Button data-testid="button-submit">Submit</Button>
<Input data-testid="input-email" />
```

Use descriptive, hierarchical names:
- `button-{action}` - Buttons
- `input-{field}` - Input fields
- `row-{type}-{id}` - List items
- `modal-{name}` - Modals

## Troubleshooting

### Tests fail locally but pass in CI

- Ensure you're running against the same build
- Check environment variables
- Run with `--headed` flag to see what's happening

### Flaky tests

- Use Playwright's auto-wait instead of `waitForTimeout`
- Prefer `expect(locator).toBeVisible()` over `isVisible()`
- Add retries in CI: `retries: process.env.CI ? 2 : 0`

### Lighthouse fails

- Check if dev server is running
- Verify the URLs in `lighthouserc.js`
- Run locally first: `npm run lighthouse`

## Contact

For issues with the QA Agent, check:
1. GitHub Actions logs
2. `qa/reports/summary.md`
3. Playwright HTML report
