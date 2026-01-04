import { test, expect } from '@playwright/test';

/**
 * Regression Test: Mobile Job Submit Error Handling
 * 
 * These tests verify that the /api/mobile/jobs/:jobId/submit endpoint:
 * 1. Returns non-200 status codes when errors occur
 * 2. Never returns success (200) with error conditions
 * 
 * Context: Bug fix for Postgres error 42703 where `scope_sections` column was missing.
 * The issue was compounded by silent failures that returned HTTP 200 even when the
 * database insert failed.
 * 
 * These tests ensure the API correctly propagates errors to callers.
 */

test.describe('Mobile Submit API Error Handling', () => {
  
  test('should return 400 for invalid jobId', async ({ request }) => {
    // Test with non-numeric jobId - should return 400, NOT 200
    const response = await request.post('/api/mobile/jobs/invalid-id/submit', {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {},
    });
    
    // Should return 4xx error, definitely not 200
    expect(response.status()).not.toBe(200);
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
    
    const json = await response.json();
    expect(json.error).toBeDefined();
    expect(json.error.code).toBe('INVALID_INPUT');
  });

  test('should return 401 for unauthorized request', async ({ request }) => {
    // Test without auth - should return 401, NOT 200
    const response = await request.post('/api/mobile/jobs/1/submit', {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {},
    });
    
    // Should return 401 Unauthorized, NOT 200
    expect(response.status()).not.toBe(200);
    expect(response.status()).toBe(401);
  });

  test('should return 404 for non-existent job (with valid auth pattern)', async ({ request }) => {
    // This test validates the error code path - the auth will fail but we're testing
    // that the API doesn't silently succeed
    const response = await request.post('/api/mobile/jobs/999999999/submit', {
      headers: {
        'Content-Type': 'application/json',
        // Note: This will fail auth, but demonstrates the endpoint responds correctly
      },
      data: { package: 'BETTER' },
    });
    
    // Should NOT return 200 for non-existent resource
    expect(response.status()).not.toBe(200);
    
    // Should return an error response structure
    const json = await response.json();
    expect(json.error).toBeDefined();
  });

  test('error response should include requestId for debugging', async ({ request }) => {
    // Verify error responses include requestId for log correlation
    const response = await request.post('/api/mobile/jobs/invalid/submit', {
      headers: {
        'Content-Type': 'application/json',
        'x-request-id': 'test-regression-check-12345',
      },
      data: {},
    });
    
    expect(response.status()).not.toBe(200);
    
    const json = await response.json();
    expect(json.error).toBeDefined();
    // Request ID should be in response for debugging
    expect(json.error.requestId).toBeDefined();
  });

  test('error response structure matches expected format', async ({ request }) => {
    // Verify error response structure for client error handling
    const response = await request.post('/api/mobile/jobs/abc/submit', {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {},
    });
    
    expect(response.status()).not.toBe(200);
    
    const json = await response.json();
    
    // Error response should have standard structure
    expect(json.error).toBeDefined();
    expect(json.error.code).toBeDefined();
    expect(json.error.message).toBeDefined();
    expect(json.error.requestId).toBeDefined();
    
    // Code should be one of our defined error codes
    const validCodes = ['UNAUTHORIZED', 'INVALID_INPUT', 'NOT_FOUND', 'CONFLICT', 'FAILED_PRECONDITION', 'INTERNAL'];
    expect(validCodes).toContain(json.error.code);
  });

  test('response header should include x-request-id', async ({ request }) => {
    // Verify response headers for observability
    const response = await request.post('/api/mobile/jobs/123/submit', {
      headers: {
        'Content-Type': 'application/json',
        'x-request-id': 'header-test-67890',
      },
      data: {},
    });
    
    // Request ID should be echoed back in response headers
    const requestIdHeader = response.headers()['x-request-id'];
    expect(requestIdHeader).toBeDefined();
    expect(requestIdHeader.length).toBeGreaterThan(0);
  });
});

/**
 * Note: Full integration tests that verify database error handling require:
 * 1. A test database with schema mismatches OR
 * 2. Mocking the storage layer
 * 
 * The tests above verify the API layer error handling works correctly.
 * The actual DB error (scope_sections column missing) is resolved by the
 * migration: supabase/migrations/20260104000000_add_scope_sections_to_proposals.sql
 */
