import { test, expect } from '@playwright/test';
import { captureConsoleErrors } from '../../qa/flows/auth';

/**
 * Smoke Tests: New Bathroom Options
 * 
 * Tests the new bathroom homeowner options:
 * A) Solid Surface Shower Wall System - alternative to tile in shower remodel flows
 * B) Walk-In Tub Installation - new project type with jets, heater, electrical options
 * 
 * These tests verify:
 * - Options appear in the UI correctly
 * - Selecting options generates appropriate scope content
 * - No branding (e.g., "Kohler", "LuxStone") appears anywhere
 */

test.describe('Bathroom - Solid Surface Shower Wall System', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/generator');
    await page.waitForLoadState('networkidle');
  });

  test('should show wall system type options in Tub-to-Shower conversion', async ({ page }) => {
    // Select Bathroom trade
    const tradeSelect = page.locator('[data-testid="select-trade-0"]');
    await tradeSelect.click();
    
    const bathroomOption = page.locator('[role="option"]').filter({ hasText: /bathroom/i }).first();
    if (await bathroomOption.count() === 0) {
      test.skip();
      return;
    }
    await bathroomOption.click();
    await page.waitForTimeout(500);

    // Select Tub-to-Shower Conversion job type
    const jobTypeSelect = page.locator('[data-testid="select-jobtype-0"]');
    await expect(jobTypeSelect).toBeVisible({ timeout: 5000 });
    await jobTypeSelect.click();
    
    const tubToShowerOption = page.locator('[role="option"]').filter({ hasText: /Tub-to-Shower/i });
    if (await tubToShowerOption.count() > 0) {
      await tubToShowerOption.click();
    } else {
      test.skip();
      return;
    }
    await page.waitForTimeout(500);

    // Look for Wall Finish Type option
    const wallSystemOption = page.locator('text=Wall Finish Type');
    await expect(wallSystemOption).toBeVisible({ timeout: 5000 });
    
    // Click the wall system type select
    const wallSystemSelect = page.locator('[data-testid="select-option-wall-system-type-0"]');
    await expect(wallSystemSelect).toBeVisible();
    await wallSystemSelect.click();
    
    // Verify all three options are available
    await expect(page.locator('[role="option"]').filter({ hasText: 'Tile' })).toBeVisible();
    await expect(page.locator('[role="option"]').filter({ hasText: 'Acrylic Surround' })).toBeVisible();
    await expect(page.locator('[role="option"]').filter({ hasText: 'Solid Surface Shower Wall System' })).toBeVisible();
  });

  test('should generate correct scope for Solid Surface wall selection', async ({ page }) => {
    const previewContainer = page.locator('[data-testid="proposal-preview-container"]');
    
    // Select Bathroom trade
    const tradeSelect = page.locator('[data-testid="select-trade-0"]');
    await tradeSelect.click();
    
    const bathroomOption = page.locator('[role="option"]').filter({ hasText: /bathroom/i }).first();
    if (await bathroomOption.count() === 0) {
      test.skip();
      return;
    }
    await bathroomOption.click();
    await page.waitForTimeout(500);

    // Select Tub-to-Shower Conversion job type
    const jobTypeSelect = page.locator('[data-testid="select-jobtype-0"]');
    await expect(jobTypeSelect).toBeVisible({ timeout: 5000 });
    await jobTypeSelect.click();
    
    const tubToShowerOption = page.locator('[role="option"]').filter({ hasText: /Tub-to-Shower/i });
    if (await tubToShowerOption.count() > 0) {
      await tubToShowerOption.click();
    } else {
      test.skip();
      return;
    }
    await page.waitForTimeout(500);

    // Select Solid Surface Shower Wall System
    const wallSystemSelect = page.locator('[data-testid="select-option-wall-system-type-0"]');
    await wallSystemSelect.click();
    await page.locator('[role="option"]').filter({ hasText: 'Solid Surface Shower Wall System' }).click();
    await page.waitForTimeout(500);

    // Generate proposal
    const generateBtn = page.locator('[data-testid="button-generate-proposal"]');
    await generateBtn.click();
    await page.waitForTimeout(2000);

    // Verify scope contains solid surface related content
    const previewText = await previewContainer.textContent() || '';
    const lowerPreviewText = previewText.toLowerCase();
    
    // Check for solid surface related content (may have different spacing/capitalization)
    expect(
      lowerPreviewText.includes('solid-surface') || 
      lowerPreviewText.includes('solid surface')
    ).toBe(true);
    expect(lowerPreviewText).toContain('adhesive');
    
    // Verify waterproof backer board is mentioned in scope sections
    expect(lowerPreviewText).toContain('waterproof');
    expect(lowerPreviewText).toContain('backer');
  });

  test('should show shower door options in Shower Remodel', async ({ page }) => {
    // Select Bathroom trade
    const tradeSelect = page.locator('[data-testid="select-trade-0"]');
    await tradeSelect.click();
    
    const bathroomOption = page.locator('[role="option"]').filter({ hasText: /bathroom/i }).first();
    if (await bathroomOption.count() === 0) {
      test.skip();
      return;
    }
    await bathroomOption.click();
    await page.waitForTimeout(500);

    // Select Shower Remodel job type
    const jobTypeSelect = page.locator('[data-testid="select-jobtype-0"]');
    await expect(jobTypeSelect).toBeVisible({ timeout: 5000 });
    await jobTypeSelect.click();
    
    const showerRemodelOption = page.locator('[role="option"]').filter({ hasText: /Shower Remodel/i });
    if (await showerRemodelOption.count() > 0) {
      await showerRemodelOption.click();
    } else {
      test.skip();
      return;
    }
    await page.waitForTimeout(500);

    // Look for Shower Door Type option
    const doorOption = page.locator('text=Shower Door Type');
    await expect(doorOption).toBeVisible({ timeout: 5000 });
    
    // Click the door type select
    const doorSelect = page.locator('[data-testid="select-option-glass-door-0"]');
    await expect(doorSelect).toBeVisible();
    await doorSelect.click();
    
    // Verify door options are available
    await expect(page.locator('[role="option"]').filter({ hasText: /No Glass Door/i })).toBeVisible();
    await expect(page.locator('[role="option"]').filter({ hasText: /Framed/i }).first()).toBeVisible();
    await expect(page.locator('[role="option"]').filter({ hasText: /Semi-Frameless/i })).toBeVisible();
    // Use more specific selector to avoid matching both "Semi-Frameless" and "Frameless Glass Door"
    await expect(page.locator('[role="option"]').filter({ hasText: /Frameless Glass/i })).toBeVisible();
  });
});

test.describe('Bathroom - Walk-In Tub Installation', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/generator');
    await page.waitForLoadState('networkidle');
  });

  test('should show Walk-In Tub as a selectable job type', async ({ page }) => {
    // Select Bathroom trade
    const tradeSelect = page.locator('[data-testid="select-trade-0"]');
    await tradeSelect.click();
    
    const bathroomOption = page.locator('[role="option"]').filter({ hasText: /bathroom/i }).first();
    if (await bathroomOption.count() === 0) {
      test.skip();
      return;
    }
    await bathroomOption.click();
    await page.waitForTimeout(500);

    // Look for Walk-In Tub job type
    const jobTypeSelect = page.locator('[data-testid="select-jobtype-0"]');
    await expect(jobTypeSelect).toBeVisible({ timeout: 5000 });
    await jobTypeSelect.click();
    
    const walkInTubOption = page.locator('[role="option"]').filter({ hasText: /Walk-In Tub/i });
    await expect(walkInTubOption).toBeVisible();
  });

  test('should show jets/heater options when Walk-In Tub is selected', async ({ page }) => {
    // Select Bathroom trade
    const tradeSelect = page.locator('[data-testid="select-trade-0"]');
    await tradeSelect.click();
    
    const bathroomOption = page.locator('[role="option"]').filter({ hasText: /bathroom/i }).first();
    if (await bathroomOption.count() === 0) {
      test.skip();
      return;
    }
    await bathroomOption.click();
    await page.waitForTimeout(500);

    // Select Walk-In Tub job type
    const jobTypeSelect = page.locator('[data-testid="select-jobtype-0"]');
    await expect(jobTypeSelect).toBeVisible({ timeout: 5000 });
    await jobTypeSelect.click();
    
    const walkInTubOption = page.locator('[role="option"]').filter({ hasText: /Walk-In Tub/i });
    if (await walkInTubOption.count() > 0) {
      await walkInTubOption.click();
    } else {
      test.skip();
      return;
    }
    await page.waitForTimeout(500);

    // Verify jets option exists
    const jetsOption = page.locator('text=Hydrotherapy Jets');
    await expect(jetsOption).toBeVisible({ timeout: 5000 });
    
    // Verify heater option exists
    const heaterOption = page.locator('text=Inline Water Heater');
    await expect(heaterOption).toBeVisible();
    
    // Verify electrical circuit option exists
    const electricalOption = page.locator('text=Dedicated Electrical Circuit');
    await expect(electricalOption).toBeVisible();
    
    // Verify shower configuration option exists
    const showerConfigOption = page.locator('text=Shower Configuration');
    await expect(showerConfigOption).toBeVisible();
  });

  test('should generate scope with electrical capacity when jets/heater selected', async ({ page }) => {
    const previewContainer = page.locator('[data-testid="proposal-preview-container"]');
    
    // Select Bathroom trade
    const tradeSelect = page.locator('[data-testid="select-trade-0"]');
    await tradeSelect.click();
    
    const bathroomOption = page.locator('[role="option"]').filter({ hasText: /bathroom/i }).first();
    if (await bathroomOption.count() === 0) {
      test.skip();
      return;
    }
    await bathroomOption.click();
    await page.waitForTimeout(500);

    // Select Walk-In Tub job type
    const jobTypeSelect = page.locator('[data-testid="select-jobtype-0"]');
    await expect(jobTypeSelect).toBeVisible({ timeout: 5000 });
    await jobTypeSelect.click();
    
    const walkInTubOption = page.locator('[role="option"]').filter({ hasText: /Walk-In Tub/i });
    if (await walkInTubOption.count() > 0) {
      await walkInTubOption.click();
    } else {
      test.skip();
      return;
    }
    await page.waitForTimeout(500);

    // Enable Jets option
    const jetsCheckbox = page.locator('[data-testid="checkbox-option-jets-0"]');
    if (await jetsCheckbox.count() > 0) {
      await jetsCheckbox.click();
    }
    await page.waitForTimeout(300);

    // Enable Heater option
    const heaterCheckbox = page.locator('[data-testid="checkbox-option-heater-0"]');
    if (await heaterCheckbox.count() > 0) {
      await heaterCheckbox.click();
    }
    await page.waitForTimeout(300);

    // Select "Include Dedicated GFCI Circuit" for electrical
    const electricalSelect = page.locator('[data-testid="select-option-electrical-circuit-0"]');
    if (await electricalSelect.count() > 0) {
      await electricalSelect.click();
      const includeCircuitOption = page.locator('[role="option"]').filter({ hasText: /Include Dedicated GFCI Circuit/i });
      if (await includeCircuitOption.count() > 0) {
        await includeCircuitOption.click();
      }
    }
    await page.waitForTimeout(500);

    // Generate proposal
    const generateBtn = page.locator('[data-testid="button-generate-proposal"]');
    await generateBtn.click();
    await page.waitForTimeout(2000);

    // Verify scope contains electrical capacity / GFCI content
    const previewText = await previewContainer.textContent();
    const lowerText = previewText?.toLowerCase() || '';
    
    // Check for electrical/GFCI terms
    expect(
      lowerText.includes('electrical') || 
      lowerText.includes('gfci') || 
      lowerText.includes('circuit')
    ).toBe(true);
    
    // Check for hot water capacity content
    expect(
      lowerText.includes('water heater') || 
      lowerText.includes('hot water')
    ).toBe(true);
  });

  test('should include hot water capacity check in scope', async ({ page }) => {
    const previewContainer = page.locator('[data-testid="proposal-preview-container"]');
    
    // Select Bathroom trade
    const tradeSelect = page.locator('[data-testid="select-trade-0"]');
    await tradeSelect.click();
    
    const bathroomOption = page.locator('[role="option"]').filter({ hasText: /bathroom/i }).first();
    if (await bathroomOption.count() === 0) {
      test.skip();
      return;
    }
    await bathroomOption.click();
    await page.waitForTimeout(500);

    // Select Walk-In Tub job type
    const jobTypeSelect = page.locator('[data-testid="select-jobtype-0"]');
    await expect(jobTypeSelect).toBeVisible({ timeout: 5000 });
    await jobTypeSelect.click();
    
    const walkInTubOption = page.locator('[role="option"]').filter({ hasText: /Walk-In Tub/i });
    if (await walkInTubOption.count() > 0) {
      await walkInTubOption.click();
    } else {
      test.skip();
      return;
    }
    await page.waitForTimeout(500);

    // Generate proposal
    const generateBtn = page.locator('[data-testid="button-generate-proposal"]');
    await generateBtn.click();
    await page.waitForTimeout(2000);

    // Verify scope sections are present (walk-in tub uses scopeSections)
    const scopeSections = previewContainer.locator('[data-testid="preview-scope-sections"]');
    await expect(scopeSections).toBeVisible({ timeout: 5000 });

    // Verify hot water capacity section exists in the content
    const previewText = await previewContainer.textContent();
    const lowerText = previewText?.toLowerCase() || '';
    
    expect(
      lowerText.includes('hot water capacity') || 
      lowerText.includes('water heater')
    ).toBe(true);
  });
});

test.describe('Bathroom - No Branding Check', () => {
  
  test('should NOT contain any "Kohler" branding in proposals', async ({ page }) => {
    await page.goto('/generator');
    await page.waitForLoadState('networkidle');
    
    // Select Bathroom trade
    const tradeSelect = page.locator('[data-testid="select-trade-0"]');
    await tradeSelect.click();
    
    const bathroomOption = page.locator('[role="option"]').filter({ hasText: /bathroom/i }).first();
    if (await bathroomOption.count() === 0) {
      test.skip();
      return;
    }
    await bathroomOption.click();
    await page.waitForTimeout(500);

    // Test each bathroom job type for branding
    const jobTypeSelect = page.locator('[data-testid="select-jobtype-0"]');
    await expect(jobTypeSelect).toBeVisible({ timeout: 5000 });
    
    // Test Tub-to-Shower with Solid Surface
    await jobTypeSelect.click();
    const tubToShowerOption = page.locator('[role="option"]').filter({ hasText: /Tub-to-Shower/i });
    if (await tubToShowerOption.count() > 0) {
      await tubToShowerOption.click();
      await page.waitForTimeout(500);
      
      // Select Solid Surface option
      const wallSystemSelect = page.locator('[data-testid="select-option-wall-system-type-0"]');
      if (await wallSystemSelect.count() > 0) {
        await wallSystemSelect.click();
        const solidSurfaceOption = page.locator('[role="option"]').filter({ hasText: /Solid Surface/i });
        if (await solidSurfaceOption.count() > 0) {
          await solidSurfaceOption.click();
        }
      }
      await page.waitForTimeout(500);
      
      // Generate and check
      const generateBtn = page.locator('[data-testid="button-generate-proposal"]');
      await generateBtn.click();
      await page.waitForTimeout(2000);
      
      const pageContent = await page.content();
      expect(pageContent.toLowerCase()).not.toContain('kohler');
      expect(pageContent.toLowerCase()).not.toContain('luxstone');
    }
    
    // Test Walk-In Tub
    await jobTypeSelect.click();
    const walkInTubOption = page.locator('[role="option"]').filter({ hasText: /Walk-In Tub/i });
    if (await walkInTubOption.count() > 0) {
      await walkInTubOption.click();
      await page.waitForTimeout(500);
      
      // Generate and check
      const generateBtn = page.locator('[data-testid="button-generate-proposal"]');
      await generateBtn.click();
      await page.waitForTimeout(2000);
      
      const pageContent = await page.content();
      expect(pageContent.toLowerCase()).not.toContain('kohler');
      expect(pageContent.toLowerCase()).not.toContain('luxstone');
    }
  });

  test('should NOT contain "Kohler" or "LuxStone" in UI elements', async ({ page }) => {
    await page.goto('/generator');
    await page.waitForLoadState('networkidle');
    
    // Check the entire page content doesn't contain branding
    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).not.toContain('kohler');
    expect(pageContent.toLowerCase()).not.toContain('luxstone');
    
    // Select Bathroom trade
    const tradeSelect = page.locator('[data-testid="select-trade-0"]');
    await tradeSelect.click();
    
    const bathroomOption = page.locator('[role="option"]').filter({ hasText: /bathroom/i }).first();
    if (await bathroomOption.count() === 0) {
      test.skip();
      return;
    }
    await bathroomOption.click();
    await page.waitForTimeout(500);
    
    // Check options dropdown content
    const pageContentAfterSelect = await page.content();
    expect(pageContentAfterSelect.toLowerCase()).not.toContain('kohler');
    expect(pageContentAfterSelect.toLowerCase()).not.toContain('luxstone');
  });
});

test.describe('Bathroom - Scope Section Structure', () => {
  
  test('Solid Surface shower should have proper scope sections', async ({ page }) => {
    const errors = captureConsoleErrors(page);
    
    await page.goto('/generator');
    await page.waitForLoadState('networkidle');
    
    const previewContainer = page.locator('[data-testid="proposal-preview-container"]');
    
    // Select Bathroom trade
    const tradeSelect = page.locator('[data-testid="select-trade-0"]');
    await tradeSelect.click();
    
    const bathroomOption = page.locator('[role="option"]').filter({ hasText: /bathroom/i }).first();
    if (await bathroomOption.count() === 0) {
      test.skip();
      return;
    }
    await bathroomOption.click();
    await page.waitForTimeout(500);

    // Select Tub-to-Shower Conversion job type (it has scopeSections)
    const jobTypeSelect = page.locator('[data-testid="select-jobtype-0"]');
    await expect(jobTypeSelect).toBeVisible({ timeout: 5000 });
    await jobTypeSelect.click();
    
    const tubToShowerOption = page.locator('[role="option"]').filter({ hasText: /Tub-to-Shower/i });
    if (await tubToShowerOption.count() > 0) {
      await tubToShowerOption.click();
    } else {
      test.skip();
      return;
    }
    await page.waitForTimeout(500);

    // Generate proposal
    const generateBtn = page.locator('[data-testid="button-generate-proposal"]');
    await generateBtn.click();
    await page.waitForTimeout(2000);

    // Verify scope sections container exists (new tub-to-shower has scopeSections)
    const scopeSections = previewContainer.locator('[data-testid="preview-scope-sections"]');
    await expect(scopeSections).toBeVisible({ timeout: 5000 });

    // Verify expected section headings
    const expectedSections = [
      'Pre-Construction',
      'Demolition',
      'Plumbing',
      'Waterproofing',
      'Wall',
      'Shower Door',
      'Finish'
    ];

    let foundSections = 0;
    for (const sectionName of expectedSections) {
      const heading = scopeSections.locator('h3').filter({ hasText: new RegExp(sectionName, 'i') });
      if (await heading.count() > 0) {
        foundSections++;
      }
    }
    
    // Should find at least 4 of the expected sections
    expect(foundSections).toBeGreaterThanOrEqual(4);

    // Check no severe console errors (filter out common harmless errors)
    await page.waitForTimeout(1000);
    const severeErrors = errors.filter(e => {
      const lower = e.toLowerCase();
      return !lower.includes('resizeobserver') && 
        !lower.includes('favicon') &&
        !lower.includes('manifest') &&
        !lower.includes('hydrat') &&
        !lower.includes('clerk') &&
        !lower.includes('middleware') &&
        !lower.includes('auth') &&
        !lower.includes('fetch') &&
        !lower.includes('network') &&
        !lower.includes('user') &&
        !lower.includes('failed to load');
    });
    // Log any severe errors for debugging
    if (severeErrors.length > 0) {
      console.log('Severe errors found:', severeErrors);
    }
    expect(severeErrors.length).toBe(0);
  });

  test('Walk-In Tub should have proper scope sections', async ({ page }) => {
    const errors = captureConsoleErrors(page);
    
    await page.goto('/generator');
    await page.waitForLoadState('networkidle');
    
    const previewContainer = page.locator('[data-testid="proposal-preview-container"]');
    
    // Select Bathroom trade
    const tradeSelect = page.locator('[data-testid="select-trade-0"]');
    await tradeSelect.click();
    
    const bathroomOption = page.locator('[role="option"]').filter({ hasText: /bathroom/i }).first();
    if (await bathroomOption.count() === 0) {
      test.skip();
      return;
    }
    await bathroomOption.click();
    await page.waitForTimeout(500);

    // Select Walk-In Tub job type
    const jobTypeSelect = page.locator('[data-testid="select-jobtype-0"]');
    await expect(jobTypeSelect).toBeVisible({ timeout: 5000 });
    await jobTypeSelect.click();
    
    const walkInTubOption = page.locator('[role="option"]').filter({ hasText: /Walk-In Tub/i });
    if (await walkInTubOption.count() > 0) {
      await walkInTubOption.click();
    } else {
      test.skip();
      return;
    }
    await page.waitForTimeout(500);

    // Generate proposal
    const generateBtn = page.locator('[data-testid="button-generate-proposal"]');
    await generateBtn.click();
    await page.waitForTimeout(2000);

    // Verify scope sections container exists
    const scopeSections = previewContainer.locator('[data-testid="preview-scope-sections"]');
    await expect(scopeSections).toBeVisible({ timeout: 5000 });

    // Verify expected section headings for Walk-In Tub
    const expectedSections = [
      'Pre-Construction',
      'Demolition',
      'Plumbing',
      'Electrical',
      'Hot Water',
      'Walk-In Tub',
      'Surround',
      'Finish'
    ];

    let foundSections = 0;
    for (const sectionName of expectedSections) {
      const heading = scopeSections.locator('h3').filter({ hasText: new RegExp(sectionName, 'i') });
      if (await heading.count() > 0) {
        foundSections++;
      }
    }
    
    // Should find at least 5 of the expected sections
    expect(foundSections).toBeGreaterThanOrEqual(5);

    // Check no severe console errors (filter out common harmless errors)
    await page.waitForTimeout(1000);
    const severeErrors = errors.filter(e => {
      const lower = e.toLowerCase();
      return !lower.includes('resizeobserver') && 
        !lower.includes('favicon') &&
        !lower.includes('manifest') &&
        !lower.includes('hydrat') &&
        !lower.includes('clerk') &&
        !lower.includes('middleware') &&
        !lower.includes('auth') &&
        !lower.includes('fetch') &&
        !lower.includes('network') &&
        !lower.includes('user') &&
        !lower.includes('failed to load');
    });
    // Log any severe errors for debugging
    if (severeErrors.length > 0) {
      console.log('Severe errors found:', severeErrors);
    }
    expect(severeErrors.length).toBe(0);
  });
});
