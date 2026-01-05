# Test Fixtures

This directory contains test fixtures used by the E2E test suite.

## Images

The `images/` directory contains minimal JPEG test images used for photo upload testing:

- `test-photo-1.jpg` - Minimal 1x1 white pixel JPEG (362 bytes)
- `test-photo-2.jpg` - Minimal 1x1 white pixel JPEG (362 bytes)
- `test-photo-3.jpg` - Minimal 1x1 white pixel JPEG (362 bytes)

These images are intentionally minimal to:
- Keep the repository size small
- Provide valid JPEG files for upload testing
- Ensure fast test execution

## Usage

These fixtures are used by the E2E tests in `tests/e2e/smoke.proposal-photos.spec.ts` to test photo upload functionality.
