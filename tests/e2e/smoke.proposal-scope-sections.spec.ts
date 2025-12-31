import { test, expect } from '@playwright/test';
import { captureConsoleErrors } from '../../qa/flows/auth';

/**
 * Smoke Test: Proposal Scope Sections
 * 
 * Tests the new grouped scope sections feature:
 * - HVAC proposals show multiple section headings with bullets
 * - Legacy templates (without scopeSections) render as flat bullet lists
 * - Both formats render without errors
 */

test.describe('Proposal Scope Sections', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/generator');
    await page.waitForLoadState('networkidle');
  });

  test('HVAC proposal should display grouped scope sections with headings', async ({ page }) => {
    // Scope all locators to the desktop preview container to avoid duplicate element issues
    const previewContainer = page.locator('[data-testid="proposal-preview-container"]');
    
    // Select HVAC trade
    const tradeSelect = page.locator('[data-testid="select-trade-0"]');
    await tradeSelect.click();
    
    // Try to find and click HVAC option
    const hvacOption = page.locator('[role="option"]').filter({ hasText: 'HVAC' });
    if (await hvacOption.count() === 0) {
      // Skip test if HVAC is not available (user's selectedTrades filter)
      test.skip();
      return;
    }
    await hvacOption.click();
    await page.waitForTimeout(500);

    // Select "Full System Replacement – Split (AC + Furnace)" job type
    const jobTypeSelect = page.locator('[data-testid="select-jobtype-0"]');
    await expect(jobTypeSelect).toBeVisible({ timeout: 5000 });
    await jobTypeSelect.click();
    
    const fullSystemOption = page.locator('[role="option"]').filter({ hasText: /Full System Replacement.*Split/i });
    if (await fullSystemOption.count() === 0) {
      // Fall back to first option if specific job type not found
      await page.locator('[role="option"]').first().click();
    } else {
      await fullSystemOption.click();
    }
    await page.waitForTimeout(500);

    // Verify the preview container is visible
    await expect(previewContainer).toBeVisible({ timeout: 5000 });

    // Check for scope sections container (new format) - scoped to desktop preview
    const scopeSections = previewContainer.locator('[data-testid="preview-scope-sections"]');
    await expect(scopeSections).toBeVisible({ timeout: 5000 });

    // Verify at least some section headings are present
    // These are the expected section titles from the HVAC template
    const expectedSections = [
      'Removal & Demolition',
      'Outdoor Unit Installation', 
      'Indoor Unit Installation',
      'Refrigerant System',
      'Electrical & Controls',
      'Commissioning & Testing',
      'Closeout & Handover'
    ];

    // Check that at least 3 section headings exist (flexible test)
    const sectionHeadings = previewContainer.locator('[data-testid^="preview-scope-section-heading-"]');
    const headingCount = await sectionHeadings.count();
    expect(headingCount).toBeGreaterThanOrEqual(3);

    // Verify at least one expected section heading is visible
    let foundExpectedHeading = false;
    for (const sectionTitle of expectedSections) {
      const heading = scopeSections.locator('h3').filter({ hasText: sectionTitle });
      if (await heading.count() > 0) {
        foundExpectedHeading = true;
        await expect(heading).toBeVisible();
        break;
      }
    }
    expect(foundExpectedHeading).toBe(true);

    // Verify sections have bullet items
    const firstSectionItems = previewContainer.locator('[data-testid="preview-scope-section-items-0"]');
    await expect(firstSectionItems).toBeVisible();
    
    // Check there are actual list items in the section
    const listItems = firstSectionItems.locator('li');
    const itemCount = await listItems.count();
    expect(itemCount).toBeGreaterThan(0);

    // Verify Assumptions section is displayed (HVAC template has assumptions)
    const assumptionsList = previewContainer.locator('[data-testid="preview-assumptions-list"]');
    await expect(assumptionsList).toBeVisible({ timeout: 5000 });

    // Verify Add-ons section is displayed (HVAC template has addons)
    const addonsList = previewContainer.locator('[data-testid="preview-addons-list"]');
    await expect(addonsList).toBeVisible({ timeout: 5000 });
  });

  test('Legacy template (Bathroom) should render as flat bullet list without errors', async ({ page }) => {
    const errors = captureConsoleErrors(page);
    
    // Scope all locators to the desktop preview container
    const previewContainer = page.locator('[data-testid="proposal-preview-container"]');

    // Select Bathroom trade (legacy flat scope format)
    const tradeSelect = page.locator('[data-testid="select-trade-0"]');
    await tradeSelect.click();
    
    // Find bathroom option (case insensitive)
    const bathroomOption = page.locator('[role="option"]').filter({ hasText: /bathroom/i }).first();
    if (await bathroomOption.count() === 0) {
      // Fall back to first available trade
      await page.locator('[role="option"]').first().click();
    } else {
      await bathroomOption.click();
    }
    await page.waitForTimeout(500);

    // Select a job type that still uses legacy flat scope format
    // (Tub-to-Shower and Shower Remodel now use scopeSections, so select Half Bath)
    const jobTypeSelect = page.locator('[data-testid="select-jobtype-0"]');
    await expect(jobTypeSelect).toBeVisible({ timeout: 5000 });
    await jobTypeSelect.click();
    
    // Look for Half Bath or Full Bathroom Gut which still use flat scope
    const halfBathOption = page.locator('[role="option"]').filter({ hasText: /Half Bath|Powder Room/i });
    if (await halfBathOption.count() > 0) {
      await halfBathOption.click();
    } else {
      // Fallback to Full Bathroom Gut which also uses flat scope
      const fullGutOption = page.locator('[role="option"]').filter({ hasText: /Full.*Gut|Gut.*Remodel/i });
      if (await fullGutOption.count() > 0) {
        await fullGutOption.click();
      } else {
        // Skip test if no legacy format job type found
        test.skip();
        return;
      }
    }
    await page.waitForTimeout(500);

    // Verify the preview container is visible
    await expect(previewContainer).toBeVisible({ timeout: 5000 });

    // Check for legacy flat scope list (NOT sections) - scoped to desktop preview
    const scopeList = previewContainer.locator('[data-testid="preview-scope-list"]');
    await expect(scopeList).toBeVisible({ timeout: 5000 });

    // Verify it has scope items
    const scopeItems = previewContainer.locator('[data-testid^="preview-scope-item-"]');
    const itemCount = await scopeItems.count();
    expect(itemCount).toBeGreaterThan(0);

    // The sections container should NOT be visible for legacy templates
    const scopeSections = previewContainer.locator('[data-testid="preview-scope-sections"]');
    await expect(scopeSections).not.toBeVisible();

    // Check no console errors
    await page.waitForTimeout(1000);
    const severeErrors = errors.filter(e => 
      !e.includes('ResizeObserver') && 
      !e.includes('favicon') &&
      !e.includes('manifest') &&
      !e.includes('hydrat')
    );
    expect(severeErrors.length).toBe(0);
  });

  test('Should switch between section format and legacy format correctly', async ({ page }) => {
    // Scope all locators to the desktop preview container
    const previewContainer = page.locator('[data-testid="proposal-preview-container"]');
    
    // First select HVAC (has scopeSections)
    const tradeSelect = page.locator('[data-testid="select-trade-0"]');
    await tradeSelect.click();
    
    const hvacOption = page.locator('[role="option"]').filter({ hasText: 'HVAC' });
    if (await hvacOption.count() === 0) {
      test.skip();
      return;
    }
    await hvacOption.click();
    await page.waitForTimeout(500);

    const jobTypeSelect = page.locator('[data-testid="select-jobtype-0"]');
    await expect(jobTypeSelect).toBeVisible({ timeout: 5000 });
    await jobTypeSelect.click();
    
    const fullSystemOption = page.locator('[role="option"]').filter({ hasText: /Full System Replacement.*Split/i });
    if (await fullSystemOption.count() > 0) {
      await fullSystemOption.click();
    } else {
      await page.locator('[role="option"]').first().click();
    }
    await page.waitForTimeout(500);

    // Verify sections are shown
    const scopeSections = previewContainer.locator('[data-testid="preview-scope-sections"]');
    await expect(scopeSections).toBeVisible({ timeout: 5000 });

    // Now switch to Bathroom (legacy format - select Half Bath which uses flat scope)
    await tradeSelect.click();
    const bathroomOption = page.locator('[role="option"]').filter({ hasText: /bathroom/i }).first();
    if (await bathroomOption.count() > 0) {
      await bathroomOption.click();
    } else {
      await page.locator('[role="option"]').first().click();
    }
    await page.waitForTimeout(500);

    await jobTypeSelect.click();
    // Select Half Bath which still uses legacy flat scope format
    const halfBathOption = page.locator('[role="option"]').filter({ hasText: /Half Bath|Powder Room/i });
    if (await halfBathOption.count() > 0) {
      await halfBathOption.click();
    } else {
      await page.locator('[role="option"]').first().click();
    }
    await page.waitForTimeout(500);

    // Verify flat list is now shown instead of sections
    const scopeList = previewContainer.locator('[data-testid="preview-scope-list"]');
    await expect(scopeList).toBeVisible({ timeout: 5000 });
    await expect(scopeSections).not.toBeVisible();
  });

  test('Scope sections should have proper structure and styling', async ({ page }) => {
    // Scope all locators to the desktop preview container
    const previewContainer = page.locator('[data-testid="proposal-preview-container"]');
    
    // Select HVAC trade
    const tradeSelect = page.locator('[data-testid="select-trade-0"]');
    await tradeSelect.click();
    
    const hvacOption = page.locator('[role="option"]').filter({ hasText: 'HVAC' });
    if (await hvacOption.count() === 0) {
      test.skip();
      return;
    }
    await hvacOption.click();
    await page.waitForTimeout(500);

    // Select Full System Replacement job type
    const jobTypeSelect = page.locator('[data-testid="select-jobtype-0"]');
    await expect(jobTypeSelect).toBeVisible({ timeout: 5000 });
    await jobTypeSelect.click();
    
    const fullSystemOption = page.locator('[role="option"]').filter({ hasText: /Full System Replacement.*Split/i });
    if (await fullSystemOption.count() > 0) {
      await fullSystemOption.click();
    } else {
      await page.locator('[role="option"]').first().click();
    }
    await page.waitForTimeout(500);

    // Wait for preview
    await expect(previewContainer).toBeVisible({ timeout: 5000 });

    // Check section structure - scoped to desktop preview
    const sectionContainers = previewContainer.locator('.scope-section');
    const containerCount = await sectionContainers.count();
    expect(containerCount).toBeGreaterThanOrEqual(3);

    // Each section should have a heading (h3) and a list (ul)
    for (let i = 0; i < Math.min(containerCount, 3); i++) {
      const section = sectionContainers.nth(i);
      
      // Should have a heading
      const heading = section.locator('h3');
      await expect(heading).toBeVisible();
      
      // Heading should not be empty
      const headingText = await heading.textContent();
      expect(headingText?.trim().length).toBeGreaterThan(0);
      
      // Should have a list
      const list = section.locator('ul');
      await expect(list).toBeVisible();
      
      // List should have items
      const items = list.locator('li');
      const itemCount = await items.count();
      expect(itemCount).toBeGreaterThan(0);
    }
  });

  test('Should not have console errors when rendering scope sections', async ({ page }) => {
    const errors = captureConsoleErrors(page);
    
    // Select HVAC with scope sections
    const tradeSelect = page.locator('[data-testid="select-trade-0"]');
    await tradeSelect.click();
    
    const hvacOption = page.locator('[role="option"]').filter({ hasText: 'HVAC' });
    if (await hvacOption.count() === 0) {
      test.skip();
      return;
    }
    await hvacOption.click();
    await page.waitForTimeout(500);

    const jobTypeSelect = page.locator('[data-testid="select-jobtype-0"]');
    await expect(jobTypeSelect).toBeVisible({ timeout: 5000 });
    await jobTypeSelect.click();
    
    const fullSystemOption = page.locator('[role="option"]').filter({ hasText: /Full System Replacement.*Split/i });
    if (await fullSystemOption.count() > 0) {
      await fullSystemOption.click();
    } else {
      await page.locator('[role="option"]').first().click();
    }
    await page.waitForTimeout(2000);

    // Check no severe errors
    const severeErrors = errors.filter(e => 
      !e.includes('ResizeObserver') && 
      !e.includes('favicon') &&
      !e.includes('manifest') &&
      !e.includes('hydrat')
    );
    expect(severeErrors.length).toBe(0);
  });
});
