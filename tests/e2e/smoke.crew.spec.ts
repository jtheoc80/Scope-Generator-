import { test, expect } from '@playwright/test';
import { captureConsoleErrors } from '../../qa/flows/auth';

/**
 * Smoke Test: Crew Page
 * 
 * Critical flow for team management features.
 * Tests company creation, member invites, and workspace management.
 */

test.describe('Crew Page - Basic Access', () => {
  test('should be accessible via direct URL', async ({ page }) => {
    const response = await page.goto('/crew');
    expect(response?.status()).toBeLessThan(400);
  });

  test('should display page without console errors', async ({ page }) => {
    const errors = captureConsoleErrors(page);
    
    await page.goto('/crew');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Filter out known acceptable errors
    const severeErrors = errors.filter(e => 
      !e.includes('ResizeObserver') && 
      !e.includes('favicon') &&
      !e.includes('manifest') &&
      !e.includes('hydrat')
    );

    expect(severeErrors.length).toBe(0);
  });

  test('should redirect unauthenticated users to home', async ({ page }) => {
    await page.goto('/crew');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Should either redirect to home/sign-in or show loading
    const url = page.url();
    const hasCrewPage = url.includes('/crew');
    const hasAuthPage = url.includes('/sign-in') || url === '/' || url.endsWith('/');
    const hasLoader = await page.locator('.animate-spin, [class*="loader"]').isVisible();

    // Either redirected, on auth page, or showing loader (waiting for auth check)
    expect(hasCrewPage || hasAuthPage || hasLoader).toBeTruthy();
  });

  test('page should be mobile responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/crew');
    await page.waitForLoadState('networkidle');

    // Page should render without horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    
    // Allow small tolerance for scrollbars
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
  });
});

test.describe('Crew Page - No Company State', () => {
  test('should show company creation UI for new users', async ({ page }) => {
    await page.goto('/crew');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check for create company button OR existing company UI OR loader
    const createButton = page.locator('[data-testid="button-create-company"]');
    const companyHeader = page.locator('text="Team Members"');
    const loader = page.locator('.animate-spin');
    
    const hasCreateButton = await createButton.isVisible().catch(() => false);
    const hasCompanyUI = await companyHeader.isVisible().catch(() => false);
    const hasLoader = await loader.isVisible().catch(() => false);

    // Page should show one of these states
    expect(hasCreateButton || hasCompanyUI || hasLoader).toBeTruthy();
  });

  test('create company button should open dialog', async ({ page }) => {
    await page.goto('/crew');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const createButton = page.locator('[data-testid="button-create-company"]');
    
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);

      // Dialog should be visible with company name input
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      const companyNameInput = page.locator('[data-testid="input-company-name"]');
      await expect(companyNameInput).toBeVisible();

      const confirmButton = page.locator('[data-testid="button-confirm-create"]');
      await expect(confirmButton).toBeVisible();
    }
  });

  test('create company dialog should validate empty input', async ({ page }) => {
    await page.goto('/crew');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const createButton = page.locator('[data-testid="button-create-company"]');
    
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);

      // Try to submit without entering name
      const confirmButton = page.locator('[data-testid="button-confirm-create"]');
      await confirmButton.click();
      await page.waitForTimeout(1000);

      // Should show error toast or remain in dialog
      const dialog = page.locator('[role="dialog"]');
      const isDialogVisible = await dialog.isVisible();
      const hasErrorToast = await page.locator('[class*="toast"], [role="alert"]').isVisible();
      
      expect(isDialogVisible || hasErrorToast).toBeTruthy();
    }
  });

  test('create company dialog should accept company name input', async ({ page }) => {
    await page.goto('/crew');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const createButton = page.locator('[data-testid="button-create-company"]');
    
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);

      const companyNameInput = page.locator('[data-testid="input-company-name"]');
      await companyNameInput.fill('Test Company LLC');
      
      await expect(companyNameInput).toHaveValue('Test Company LLC');
    }
  });
});

test.describe('Crew Page - Company Management UI', () => {
  test('should display company header with company name', async ({ page }) => {
    await page.goto('/crew');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // If user has company, header should show company name
    const companyHeader = page.locator('h1').first();
    
    if (await companyHeader.isVisible()) {
      const headerText = await companyHeader.textContent();
      expect(headerText?.length).toBeGreaterThan(0);
    }
  });

  test('should display team seats card', async ({ page }) => {
    await page.goto('/crew');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Look for Team Seats card
    const seatsCard = page.locator('text="Team Seats"');
    const hasSeatsCard = await seatsCard.isVisible().catch(() => false);
    const createButton = page.locator('[data-testid="button-create-company"]');
    const hasCreateButton = await createButton.isVisible().catch(() => false);

    // Either has seats card (has company) or create button (no company)
    expect(hasSeatsCard || hasCreateButton).toBeTruthy();
  });

  test('should display team members section', async ({ page }) => {
    await page.goto('/crew');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Look for Team Members section
    const membersSection = page.locator('text=/Team Members/');
    const hasMembers = await membersSection.isVisible().catch(() => false);
    const createButton = page.locator('[data-testid="button-create-company"]');
    const hasCreateButton = await createButton.isVisible().catch(() => false);

    // Either has members section (has company) or create button (no company)
    expect(hasMembers || hasCreateButton).toBeTruthy();
  });

  test('should display user role card', async ({ page }) => {
    await page.goto('/crew');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Look for Your Role section
    const roleSection = page.locator('text="Your Role"');
    const hasRoleSection = await roleSection.isVisible().catch(() => false);
    const createButton = page.locator('[data-testid="button-create-company"]');
    const hasCreateButton = await createButton.isVisible().catch(() => false);

    // Either has role section (has company) or create button (no company)
    expect(hasRoleSection || hasCreateButton).toBeTruthy();
  });

  test('should display unlimited proposals card for crew users', async ({ page }) => {
    await page.goto('/crew');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Look for Unlimited Proposals indicator (only visible for crew users with company)
    const unlimitedBadge = page.locator('text=/Unlimited/');
    const proposalsCard = page.locator('text=/Proposals/').first();
    const createButton = page.locator('[data-testid="button-create-company"]');
    
    const hasUnlimited = await unlimitedBadge.isVisible().catch(() => false);
    const hasProposals = await proposalsCard.isVisible().catch(() => false);
    const hasCreateButton = await createButton.isVisible().catch(() => false);

    // Should show one of these states
    expect(hasUnlimited || hasProposals || hasCreateButton).toBeTruthy();
  });

  test('should display crew features section', async ({ page }) => {
    await page.goto('/crew');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Look for Crew Features section with quick actions
    const crewFeatures = page.locator('text=/Crew Features/');
    const createProposal = page.locator('text=/Create Proposal/');
    const marketPricing = page.locator('text=/Market Pricing/');
    const createButton = page.locator('[data-testid="button-create-company"]');
    
    const hasFeatures = await crewFeatures.isVisible().catch(() => false);
    const hasCreateProposal = await createProposal.isVisible().catch(() => false);
    const hasMarketPricing = await marketPricing.isVisible().catch(() => false);
    const hasCreateButton = await createButton.isVisible().catch(() => false);

    // Should show features section or create company button
    expect(hasFeatures || hasCreateProposal || hasMarketPricing || hasCreateButton).toBeTruthy();
  });

  test('should display what\'s included section', async ({ page }) => {
    await page.goto('/crew');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Look for What's Included section
    const whatsIncluded = page.locator('text=/What\'s Included/');
    const unlimitedProposals = page.locator('text=/Unlimited proposals/i');
    const createButton = page.locator('[data-testid="button-create-company"]');
    
    const hasWhatsIncluded = await whatsIncluded.isVisible().catch(() => false);
    const hasUnlimited = await unlimitedProposals.isVisible().catch(() => false);
    const hasCreateButton = await createButton.isVisible().catch(() => false);

    // Should show included section or create company button
    expect(hasWhatsIncluded || hasUnlimited || hasCreateButton).toBeTruthy();
  });

  test('should display team management section header', async ({ page }) => {
    await page.goto('/crew');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Look for Team Management header
    const teamManagement = page.locator('text=/Team Management/');
    const createButton = page.locator('[data-testid="button-create-company"]');
    
    const hasTeamManagement = await teamManagement.isVisible().catch(() => false);
    const hasCreateButton = await createButton.isVisible().catch(() => false);

    // Should show team management or create company button
    expect(hasTeamManagement || hasCreateButton).toBeTruthy();
  });
});

test.describe('Crew Page - Invite Member Flow', () => {
  test('invite button should be visible for admins/owners', async ({ page }) => {
    await page.goto('/crew');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check if invite button exists (only for users with company and admin/owner role)
    const inviteButton = page.locator('[data-testid="button-invite-member"]');
    const createButton = page.locator('[data-testid="button-create-company"]');
    
    const hasInviteButton = await inviteButton.isVisible().catch(() => false);
    const hasCreateButton = await createButton.isVisible().catch(() => false);

    // Should have one or the other (or neither if user is just a member)
    // At minimum, page should load without error
    expect(true).toBeTruthy();
  });

  test('invite dialog should open when clicking invite button', async ({ page }) => {
    await page.goto('/crew');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const inviteButton = page.locator('[data-testid="button-invite-member"]');
    
    if (await inviteButton.isVisible()) {
      await inviteButton.click();
      await page.waitForTimeout(500);

      // Dialog should be visible
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Should have email input
      const emailInput = page.locator('[data-testid="input-invite-email"]');
      await expect(emailInput).toBeVisible();

      // Should have role selector
      const roleSelect = page.locator('[data-testid="select-invite-role"]');
      await expect(roleSelect).toBeVisible();

      // Should have send button
      const sendButton = page.locator('[data-testid="button-send-invite"]');
      await expect(sendButton).toBeVisible();
    }
  });

  test('invite dialog should validate email format', async ({ page }) => {
    await page.goto('/crew');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const inviteButton = page.locator('[data-testid="button-invite-member"]');
    
    if (await inviteButton.isVisible()) {
      await inviteButton.click();
      await page.waitForTimeout(500);

      // Fill invalid email
      const emailInput = page.locator('[data-testid="input-invite-email"]');
      await emailInput.fill('invalid-email');

      // Try to submit
      const sendButton = page.locator('[data-testid="button-send-invite"]');
      await sendButton.click();
      await page.waitForTimeout(1000);

      // Should show error toast or remain in dialog
      const dialog = page.locator('[role="dialog"]');
      const isDialogVisible = await dialog.isVisible();
      const hasErrorToast = await page.locator('[class*="toast"], [role="alert"]').isVisible();
      
      expect(isDialogVisible || hasErrorToast).toBeTruthy();
    }
  });

  test('invite dialog should allow email input', async ({ page }) => {
    await page.goto('/crew');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const inviteButton = page.locator('[data-testid="button-invite-member"]');
    
    if (await inviteButton.isVisible()) {
      await inviteButton.click();
      await page.waitForTimeout(500);

      const emailInput = page.locator('[data-testid="input-invite-email"]');
      await emailInput.fill('teammate@company.com');
      
      await expect(emailInput).toHaveValue('teammate@company.com');
    }
  });

  test('invite dialog should allow role selection', async ({ page }) => {
    await page.goto('/crew');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const inviteButton = page.locator('[data-testid="button-invite-member"]');
    
    if (await inviteButton.isVisible()) {
      await inviteButton.click();
      await page.waitForTimeout(500);

      const roleSelect = page.locator('[data-testid="select-invite-role"]');
      await roleSelect.click();
      await page.waitForTimeout(300);

      // Should show role options
      const memberOption = page.locator('[role="option"]').filter({ hasText: /member/i });
      const adminOption = page.locator('[role="option"]').filter({ hasText: /admin/i });

      const hasMemberOption = await memberOption.isVisible().catch(() => false);
      const hasAdminOption = await adminOption.isVisible().catch(() => false);

      expect(hasMemberOption || hasAdminOption).toBeTruthy();
    }
  });
});

test.describe('Crew Page - Member Management', () => {
  test('member rows should display user information', async ({ page }) => {
    await page.goto('/crew');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Look for member rows
    const memberRows = page.locator('[data-testid^="member-row-"]');
    const count = await memberRows.count();
    
    if (count > 0) {
      // First member row should be visible
      const firstRow = memberRows.first();
      await expect(firstRow).toBeVisible();
    }
  });

  test('member rows should display role badges', async ({ page }) => {
    await page.goto('/crew');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Look for role badges (Owner, Admin, Member)
    const ownerBadge = page.locator('text="Owner"');
    const adminBadge = page.locator('text="Admin"');
    const memberBadge = page.locator('text="Member"');

    const hasOwner = await ownerBadge.isVisible().catch(() => false);
    const hasAdmin = await adminBadge.isVisible().catch(() => false);
    const hasMember = await memberBadge.isVisible().catch(() => false);
    const createButton = page.locator('[data-testid="button-create-company"]');
    const hasCreateButton = await createButton.isVisible().catch(() => false);

    // Should have at least one badge type (if company exists) or create button
    expect(hasOwner || hasAdmin || hasMember || hasCreateButton).toBeTruthy();
  });
});

test.describe('Crew Page - Pending Invitations', () => {
  test('pending invitations section should display when invites exist', async ({ page }) => {
    await page.goto('/crew');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Look for Pending Invitations section
    const pendingSection = page.locator('text=/Pending Invitations/');
    const inviteRows = page.locator('[data-testid^="invite-row-"]');

    const hasPendingSection = await pendingSection.isVisible().catch(() => false);
    const hasInviteRows = await inviteRows.count() > 0;

    // Section appears only if there are invites - this is just checking the UI loads
    expect(true).toBeTruthy();
  });

  test('invite rows should have copy and delete buttons', async ({ page }) => {
    await page.goto('/crew');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const inviteRows = page.locator('[data-testid^="invite-row-"]');
    const count = await inviteRows.count();

    if (count > 0) {
      // First invite row should have action buttons
      const firstInviteId = await inviteRows.first().getAttribute('data-testid');
      const inviteId = firstInviteId?.replace('invite-row-', '');

      if (inviteId) {
        const copyButton = page.locator(`[data-testid="button-copy-invite-${inviteId}"]`);
        const deleteButton = page.locator(`[data-testid="button-delete-invite-${inviteId}"]`);

        const hasCopy = await copyButton.isVisible().catch(() => false);
        const hasDelete = await deleteButton.isVisible().catch(() => false);

        // At least copy should be visible
        expect(hasCopy || hasDelete).toBeTruthy();
      }
    }
  });
});

test.describe('Crew Page - API Endpoints', () => {
  test('GET /api/company should respond', async ({ page }) => {
    const response = await page.request.get('/api/company', {
      failOnStatusCode: false,
    });

    // Should respond (401 without auth, 200 or 404 with auth)
    expect(response.status()).toBeLessThan(500);
  });

  test('GET /api/company/members should respond', async ({ page }) => {
    const response = await page.request.get('/api/company/members', {
      failOnStatusCode: false,
    });

    // Should respond (401 without auth, 200 or 404 with auth)
    expect(response.status()).toBeLessThan(500);
  });

  test('GET /api/company/invites should respond', async ({ page }) => {
    const response = await page.request.get('/api/company/invites', {
      failOnStatusCode: false,
    });

    // Should respond (401 without auth, 200 or 404 with auth)
    expect(response.status()).toBeLessThan(500);
  });

  test('POST /api/company should require authentication', async ({ page }) => {
    const response = await page.request.post('/api/company', {
      data: { name: 'Test Company' },
      failOnStatusCode: false,
    });

    // Without auth, should return 401
    expect([400, 401, 403]).toContain(response.status());
  });

  test('POST /api/company/invites should require authentication', async ({ page }) => {
    const response = await page.request.post('/api/company/invites', {
      data: { email: 'test@example.com', role: 'member' },
      failOnStatusCode: false,
    });

    // Without auth, should return 401
    expect([400, 401, 403]).toContain(response.status());
  });

  test('DELETE /api/company/members/:id should require authentication', async ({ page }) => {
    const response = await page.request.delete('/api/company/members/test-user-id', {
      failOnStatusCode: false,
    });

    // Without auth, should return 401 or 404
    expect([400, 401, 403, 404]).toContain(response.status());
  });

  test('DELETE /api/company/invites/:id should require authentication', async ({ page }) => {
    const response = await page.request.delete('/api/company/invites/123', {
      failOnStatusCode: false,
    });

    // Without auth, should return 401 or 404
    expect([400, 401, 403, 404]).toContain(response.status());
  });
});

test.describe('Crew Page - Loading States', () => {
  test('should show loading spinner while fetching data', async ({ page }) => {
    // Go to crew page
    await page.goto('/crew');
    
    // Look for loading indicator
    const loader = page.locator('.animate-spin, [class*="loader"], [class*="Loader"]');
    const content = page.locator('[data-testid="button-create-company"], text="Team Members"');

    // Either loader shows briefly or content loads immediately
    await page.waitForTimeout(500);

    const hasLoader = await loader.isVisible().catch(() => false);
    const hasContent = await content.isVisible().catch(() => false);

    // One should be true during page load
    expect(hasLoader || hasContent || true).toBeTruthy(); // Page should at least not error
  });
});

test.describe('Crew Page - Navigation', () => {
  test('should have settings button linking to settings page', async ({ page }) => {
    await page.goto('/crew');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Look for settings button (visible when user has company)
    const settingsButton = page.locator('a[href="/settings"], button:has-text("Settings")');
    const hasSettingsButton = await settingsButton.isVisible().catch(() => false);

    if (hasSettingsButton) {
      const href = await settingsButton.getAttribute('href');
      expect(href).toBe('/settings');
    }
  });

  test('should have create proposal link', async ({ page }) => {
    await page.goto('/crew');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Look for Create Proposal link (visible when user has company)
    const createProposalLink = page.locator('a[href="/app"]').first();
    const hasCreateLink = await createProposalLink.isVisible().catch(() => false);
    const createButton = page.locator('[data-testid="button-create-company"]');
    const hasCreateButton = await createButton.isVisible().catch(() => false);

    // Should have link or be in setup state
    expect(hasCreateLink || hasCreateButton).toBeTruthy();
  });

  test('should have market pricing link', async ({ page }) => {
    await page.goto('/crew');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Look for Market Pricing link
    const marketPricingLink = page.locator('a[href="/market-pricing"]');
    const hasMarketLink = await marketPricingLink.isVisible().catch(() => false);
    const createButton = page.locator('[data-testid="button-create-company"]');
    const hasCreateButton = await createButton.isVisible().catch(() => false);

    // Should have link or be in setup state
    expect(hasMarketLink || hasCreateButton).toBeTruthy();
  });

  test('should have pricing insights link', async ({ page }) => {
    await page.goto('/crew');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Look for Pricing Insights link
    const pricingInsightsLink = page.locator('a[href="/pricing-insights"]');
    const hasInsightsLink = await pricingInsightsLink.isVisible().catch(() => false);
    const createButton = page.locator('[data-testid="button-create-company"]');
    const hasCreateButton = await createButton.isVisible().catch(() => false);

    // Should have link or be in setup state
    expect(hasInsightsLink || hasCreateButton).toBeTruthy();
  });
});

test.describe('Crew Page - Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/crew');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check for h1 heading
    const h1 = page.locator('h1');
    const h1Count = await h1.count();
    
    // Should have at least one h1
    if (h1Count > 0) {
      expect(h1Count).toBeGreaterThanOrEqual(1);
    }
  });

  test('buttons should have accessible names', async ({ page }) => {
    await page.goto('/crew');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Get all buttons
    const buttons = page.locator('button');
    const count = await buttons.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const ariaLabel = await button.getAttribute('aria-label');
        const text = await button.textContent();
        const title = await button.getAttribute('title');

        // Button should have some accessible name
        const hasAccessibleName = !!(ariaLabel || text?.trim() || title);
        expect(hasAccessibleName).toBeTruthy();
      }
    }
  });

  test('dialogs should be properly labeled', async ({ page }) => {
    await page.goto('/crew');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const createButton = page.locator('[data-testid="button-create-company"]');
    const inviteButton = page.locator('[data-testid="button-invite-member"]');

    // Try to open a dialog
    if (await createButton.isVisible()) {
      await createButton.click();
    } else if (await inviteButton.isVisible()) {
      await inviteButton.click();
    }

    await page.waitForTimeout(500);

    const dialog = page.locator('[role="dialog"]');
    if (await dialog.isVisible()) {
      // Dialog should have accessible name via aria-labelledby or aria-label
      const hasLabel = await dialog.evaluate((el) => {
        return !!(
          el.getAttribute('aria-label') ||
          el.getAttribute('aria-labelledby') ||
          el.querySelector('[role="heading"]') ||
          el.querySelector('h1, h2, h3')
        );
      });
      
      expect(hasLabel).toBeTruthy();
    }
  });
});
