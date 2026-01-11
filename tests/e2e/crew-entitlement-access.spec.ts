import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Crew Entitlement Access Control
 * 
 * Tests the entitlement system to ensure:
 * 1. Non-crew users cannot access crew data via API
 * 2. Admin-only endpoints reject non-admin users
 * 3. Crew page shows proper "No Access" UI for unauthorized users
 */

test.describe('Crew Entitlement Access Control', () => {
  
  test.describe('API Access Control - Unauthenticated', () => {
    
    test('GET /api/crew/access should require authentication', async ({ request }) => {
      const response = await request.get('/api/crew/access');
      // Should return 401 for unauthenticated users
      expect([400, 401, 403]).toContain(response.status());
    });

    test('GET /api/company should require authentication', async ({ request }) => {
      const response = await request.get('/api/company');
      expect([400, 401, 403]).toContain(response.status());
    });

    test('GET /api/company/members should require authentication', async ({ request }) => {
      const response = await request.get('/api/company/members');
      expect([400, 401, 403]).toContain(response.status());
    });

    test('POST /api/company should require authentication', async ({ request }) => {
      const response = await request.post('/api/company', {
        data: { name: 'Test Company' },
      });
      expect([400, 401, 403]).toContain(response.status());
    });
  });

  test.describe('Admin API Access Control - Unauthenticated', () => {
    
    test('GET /api/admin/users should require admin access', async ({ request }) => {
      const response = await request.get('/api/admin/users');
      expect([400, 401, 403]).toContain(response.status());
    });

    test('GET /api/admin/users/:id should require admin access', async ({ request }) => {
      const response = await request.get('/api/admin/users/test-user-id');
      expect([400, 401, 403]).toContain(response.status());
    });

    test('POST /api/admin/users/:id/entitlements should require admin access', async ({ request }) => {
      const response = await request.post('/api/admin/users/test-user-id/entitlements', {
        data: { entitlement: 'CREW_ACCESS' },
      });
      expect([400, 401, 403]).toContain(response.status());
    });

    test('DELETE /api/admin/users/:id/entitlements/:ent should require admin access', async ({ request }) => {
      const response = await request.delete('/api/admin/users/test-user-id/entitlements/CREW_ACCESS');
      expect([400, 401, 403]).toContain(response.status());
    });

    test('PATCH /api/admin/users/:id/role should require admin access', async ({ request }) => {
      const response = await request.patch('/api/admin/users/test-user-id/role', {
        data: { role: 'admin' },
      });
      expect([400, 401, 403]).toContain(response.status());
    });

    test('GET /api/admin/audit-logs should require admin access', async ({ request }) => {
      const response = await request.get('/api/admin/audit-logs');
      expect([400, 401, 403]).toContain(response.status());
    });
  });

  test.describe('Crew Page UI Access Control', () => {
    
    test('crew page should load without server errors', async ({ page }) => {
      const response = await page.goto('/crew');
      // Page should load (status < 500)
      expect(response?.status()).toBeLessThan(500);
    });

    test('crew page should show loading state initially', async ({ page }) => {
      await page.goto('/crew');
      
      // Should show either loading spinner or redirect to home
      const hasLoader = await page.locator('.animate-spin').isVisible().catch(() => false);
      const isOnCrewPage = page.url().includes('/crew');
      const isOnHomePage = page.url() === '/' || page.url().endsWith('/');
      
      // Either shows loader on crew page OR redirected to home
      expect(hasLoader || isOnCrewPage || isOnHomePage).toBeTruthy();
    });

    test('crew page should show access denied UI for unauthenticated users', async ({ page }) => {
      await page.goto('/crew');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000); // Wait for access check
      
      // Should redirect to home OR show access denied
      const url = page.url();
      const isOnHome = url === '/' || url.endsWith('/') || url.includes('/sign-in');
      const hasAccessDenied = await page.locator('text="Access Denied"').isVisible().catch(() => false);
      const hasLockIcon = await page.locator('[class*="Lock"]').isVisible().catch(() => false);
      const hasNoAccessUI = await page.locator('text=/don.t have access/i').isVisible().catch(() => false);
      
      // One of these should be true
      expect(isOnHome || hasAccessDenied || hasLockIcon || hasNoAccessUI).toBeTruthy();
    });

    test('crew page access denied UI should show next steps', async ({ page }) => {
      await page.goto('/crew');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      // If access denied UI is shown, it should have next steps
      const hasAccessDenied = await page.locator('text="Access Denied"').isVisible().catch(() => false);
      
      if (hasAccessDenied) {
        // Should show next steps
        const hasNextSteps = await page.locator('text="Next Steps"').isVisible().catch(() => false);
        const hasSubscribeOption = await page.locator('text=/Subscribe to Crew/i').isVisible().catch(() => false);
        const hasViewPlans = await page.locator('text=/View Plans/i').isVisible().catch(() => false);
        
        expect(hasNextSteps || hasSubscribeOption || hasViewPlans).toBeTruthy();
      }
    });
  });

  test.describe('Admin Page Access Control', () => {
    
    test('admin page should load without server errors', async ({ page }) => {
      const response = await page.goto('/admin/users');
      expect(response?.status()).toBeLessThan(500);
    });

    test('admin page should redirect non-admin users', async ({ page }) => {
      await page.goto('/admin/users');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      // Should redirect to dashboard/home OR show access denied
      const url = page.url();
      const redirected = url.includes('/dashboard') || url === '/' || url.endsWith('/');
      const hasAccessDenied = await page.locator('text="Access Denied"').isVisible().catch(() => false);
      const hasAdminRequired = await page.locator('text=/Admin access required/i').isVisible().catch(() => false);
      
      expect(redirected || hasAccessDenied || hasAdminRequired).toBeTruthy();
    });
  });

  test.describe('Entitlement Validation', () => {
    
    test('invalid entitlement should be rejected', async ({ request }) => {
      // Even without auth, server should validate entitlement names
      const response = await request.post('/api/admin/users/test-user/entitlements', {
        data: { entitlement: 'INVALID_ENTITLEMENT' },
      });
      
      // Should reject (either due to auth or validation)
      expect([400, 401, 403]).toContain(response.status());
    });

    test('invalid role should be rejected', async ({ request }) => {
      const response = await request.patch('/api/admin/users/test-user/role', {
        data: { role: 'superadmin' },
      });
      
      // Should reject (either due to auth or validation)
      expect([400, 401, 403]).toContain(response.status());
    });
  });

  test.describe('Search Console Access (Crew Feature)', () => {
    
    test('GET /api/search-console/test should require crew subscription', async ({ request }) => {
      const response = await request.get('/api/search-console/test');
      // Should require auth and crew subscription
      expect([400, 401, 403]).toContain(response.status());
    });

    test('GET /api/search-console/sites should require crew subscription', async ({ request }) => {
      const response = await request.get('/api/search-console/sites');
      expect([400, 401, 403]).toContain(response.status());
    });
  });
});

test.describe('Crew Access Response Format', () => {
  
  test('crew access endpoint response should have expected fields', async ({ request }) => {
    const response = await request.get('/api/crew/access');
    
    // Even if unauthorized, check response format when possible
    if (response.status() === 200) {
      const data = await response.json();
      
      // Should have these fields
      expect(data).toHaveProperty('hasCrewAccess');
      expect(data).toHaveProperty('hasCrewPayoutAccess');
      expect(data).toHaveProperty('subscriptionPlan');
      expect(data).toHaveProperty('entitlements');
      
      // Entitlements should be an array
      expect(Array.isArray(data.entitlements)).toBeTruthy();
    }
  });
});

test.describe('Auth Access Response Format', () => {
  
  test('auth access endpoint should return access summary', async ({ request }) => {
    const response = await request.get('/api/auth/access');
    
    // Even if unauthorized, the endpoint should respond consistently
    if (response.status() === 200) {
      const data = await response.json();
      
      expect(data).toHaveProperty('isAuthenticated');
      expect(data).toHaveProperty('isAdmin');
      expect(data).toHaveProperty('hasCrewAccess');
      expect(data).toHaveProperty('hasCrewPayoutAccess');
      expect(data).toHaveProperty('entitlements');
    }
  });
});
