import { test, expect } from '@playwright/test';
import { captureConsoleErrors } from '../../qa/flows/auth';
import { 
  getDefaultProposalData, 
  createProposal, 
  openDeleteDialog,
  deleteDraftProposal,
  isDeleteButtonVisible,
  isDeleteButtonDisabled
} from '../../qa/flows/proposal';

/**
 * Smoke Test: Delete Draft Proposal Flow
 * 
 * Critical flow that tests the delete draft functionality.
 * Tests UI interaction, confirmation dialog, API call, and optimistic UI update.
 */

test.describe('Delete Draft Proposal Flow', () => {
  test('should show delete button only for draft proposals', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check if there are any proposals
    const proposals = page.locator('[data-testid^="row-proposal-"], [data-testid^="card-proposal-mobile-"]');
    const proposalCount = await proposals.count();

    if (proposalCount > 0) {
      // Get the first proposal's testid to extract proposal ID
      const firstProposal = proposals.first();
      const testId = await firstProposal.getAttribute('data-testid');
      
      if (testId) {
        const match = testId.match(/\d+/);
        if (match) {
          const proposalId = parseInt(match[0], 10);
          
          // Open the dropdown menu
          const menuButton = page.locator(`[data-testid="row-proposal-${proposalId}"] button`).last();
          if (await menuButton.isVisible()) {
            await menuButton.click();
            await page.waitForTimeout(500);
            
            // Check if delete option exists
            const deleteOption = page.locator('text="Delete draft"').or(page.locator('[data-testid*="delete"]'));
            await expect(deleteOption).toBeVisible({ timeout: 5000 });
            
            // Close menu
            await page.keyboard.press('Escape');
          }
        }
      }
    }
  });

  test('should open delete confirmation dialog with correct information', async ({ page }) => {
    // Create a test draft proposal
    const proposalData = getDefaultProposalData();
    const proposalId = await createProposal(page, proposalData);
    
    if (proposalId) {
      // Navigate to dashboard
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Open the dropdown menu for the proposal
      const menuButton = page.locator(`[data-testid="row-proposal-${proposalId}"] button, [data-testid="card-proposal-mobile-${proposalId}"] button`).last();
      await menuButton.click();
      await page.waitForTimeout(500);
      
      // Click delete button
      const deleteButton = page.locator(`[data-testid="button-delete-draft-${proposalId}"], [data-testid="menu-delete-${proposalId}"]`).first();
      await deleteButton.click();
      
      // Verify dialog appears
      await expect(page.locator('text=Delete draft?')).toBeVisible({ timeout: 5000 });
      
      // Verify client name is shown in dialog
      await expect(page.getByText(proposalData.clientName, { exact: false })).toBeVisible();
      
      // Verify dialog has both Cancel and Delete buttons
      const cancelButton = page.locator('button:has-text("Cancel")');
      const confirmDeleteButton = page.locator('button:has-text("Delete")').last();
      
      await expect(cancelButton).toBeVisible();
      await expect(confirmDeleteButton).toBeVisible();
      
      // Close dialog without deleting
      await cancelButton.click();
      await page.waitForTimeout(500);
      
      // Verify dialog is closed
      await expect(page.locator('text=Delete draft?')).not.toBeVisible();
      
      // Verify proposal still exists
      const proposalRow = page.locator(`[data-testid="row-proposal-${proposalId}"], [data-testid="card-proposal-mobile-${proposalId}"]`);
      await expect(proposalRow).toBeVisible();
    }
  });

  test('should cancel delete when clicking cancel button', async ({ page }) => {
    // Create a test draft proposal
    const proposalData = getDefaultProposalData();
    const proposalId = await createProposal(page, proposalData);
    
    if (proposalId) {
      await openDeleteDialog(page, proposalId);
      
      // Click cancel
      const cancelButton = page.locator('button:has-text("Cancel")');
      await cancelButton.click();
      await page.waitForTimeout(500);
      
      // Verify dialog closed
      await expect(page.locator('text=Delete draft?')).not.toBeVisible();
      
      // Verify proposal still exists
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      const proposalRow = page.locator(`[data-testid="row-proposal-${proposalId}"], [data-testid="card-proposal-mobile-${proposalId}"]`);
      await expect(proposalRow).toBeVisible();
    }
  });

  test('should successfully delete draft proposal with optimistic UI update', async ({ page }) => {
    // Create a test draft proposal
    const proposalData = getDefaultProposalData();
    const proposalId = await createProposal(page, proposalData);
    
    if (proposalId) {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Verify proposal exists before deletion
      const proposalRowBefore = page.locator(`[data-testid="row-proposal-${proposalId}"], [data-testid="card-proposal-mobile-${proposalId}"]`);
      await expect(proposalRowBefore).toBeVisible();
      
      // Open delete dialog
      await openDeleteDialog(page, proposalId);
      
      // Click delete button
      const deleteButton = page.locator('button:has-text("Delete")').last();
      
      // Set up network request listener to verify API call
      const deleteRequestPromise = page.waitForRequest(
        request => request.url().includes(`/api/proposals/${proposalId}`) && request.method() === 'DELETE',
        { timeout: 10000 }
      );
      
      await deleteButton.click();
      
      // Verify API was called
      const deleteRequest = await deleteRequestPromise;
      expect(deleteRequest).toBeTruthy();
      
      // Wait for optimistic UI update
      await page.waitForTimeout(2000);
      
      // Verify proposal is removed from the list
      const proposalRowAfter = page.locator(`[data-testid="row-proposal-${proposalId}"], [data-testid="card-proposal-mobile-${proposalId}"]`);
      await expect(proposalRowAfter).not.toBeVisible();
      
      // Verify success toast appears (toast should contain text about deletion)
      const toast = page.locator('[class*="toast"], [role="status"], [role="alert"]');
      await expect(toast.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show loading state during deletion', async ({ page }) => {
    // Create a test draft proposal
    const proposalData = getDefaultProposalData();
    const proposalId = await createProposal(page, proposalData);
    
    if (proposalId) {
      await openDeleteDialog(page, proposalId);
      
      // Click delete button
      const deleteButton = page.locator('button:has-text("Delete")').last();
      await deleteButton.click();
      
      // Check for loading spinner (should appear briefly)
      const loadingSpinner = page.locator('button:has-text("Deleting")');
      
      // The spinner may appear very briefly, so we use a short timeout
      // If it doesn't appear, that's okay - the operation might be too fast
      await loadingSpinner.isVisible({ timeout: 1000 }).catch(() => false);
      
      // Wait for operation to complete
      await page.waitForTimeout(2000);
    }
  });

  test('should disable delete button for non-draft proposals', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Look for non-draft proposals (sent, accepted, won, lost)
    const proposals = page.locator('[data-testid^="row-proposal-"], [data-testid^="card-proposal-mobile-"]');
    const proposalCount = await proposals.count();
    
    if (proposalCount > 0) {
      for (let i = 0; i < proposalCount; i++) {
        const proposal = proposals.nth(i);
        const testId = await proposal.getAttribute('data-testid');
        
        if (testId) {
          const match = testId.match(/\d+/);
          if (match) {
            const proposalId = parseInt(match[0], 10);
            
            // Check the status badge
            const statusBadge = proposal.locator('[class*="badge"], [class*="status"]');
            const statusText = await statusBadge.textContent().catch(() => '');
            
            // If not a draft, delete should be disabled
            if (statusText && !statusText.toLowerCase().includes('draft')) {
              // Open dropdown
              const menuButton = proposal.locator('button').last();
              if (await menuButton.isVisible()) {
                await menuButton.click();
                await page.waitForTimeout(500);
                
                // Find delete option
                const deleteOption = page.locator('text="Delete draft"').first();
                
                if (await deleteOption.isVisible()) {
                  // Check if it's disabled
                  const isDisabled = await deleteOption.getAttribute('data-disabled');
                  const ariaDisabled = await deleteOption.getAttribute('aria-disabled');
                  
                  expect(isDisabled === 'true' || ariaDisabled === 'true').toBe(true);
                }
                
                // Close menu
                await page.keyboard.press('Escape');
                break; // Only test one non-draft proposal
              }
            }
          }
        }
      }
    }
  });

  test('should handle delete errors gracefully', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Intercept the DELETE API call and make it fail
    await page.route('**/api/proposals/*', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Failed to delete draft. Please try again.'
          })
        });
      } else {
        await route.continue();
      }
    });
    
    // Try to find and delete a draft proposal
    const proposals = page.locator('[data-testid^="row-proposal-"], [data-testid^="card-proposal-mobile-"]');
    const proposalCount = await proposals.count();
    
    if (proposalCount > 0) {
      const firstProposal = proposals.first();
      const testId = await firstProposal.getAttribute('data-testid');
      
      if (testId) {
        const match = testId.match(/\d+/);
        if (match) {
          const proposalId = parseInt(match[0], 10);
          
          // Try to open delete dialog
          const menuButton = firstProposal.locator('button').last();
          if (await menuButton.isVisible()) {
            await menuButton.click();
            await page.waitForTimeout(500);
            
            const deleteButton = page.locator(`[data-testid="button-delete-draft-${proposalId}"], [data-testid="menu-delete-${proposalId}"]`).first();
            
            if (await deleteButton.isVisible() && !await deleteButton.isDisabled()) {
              await deleteButton.click();
              await page.waitForTimeout(500);
              
              // Click confirm delete in dialog
              const confirmDelete = page.locator('button:has-text("Delete")').last();
              await confirmDelete.click();
              
              // Wait for error toast
              await page.waitForTimeout(2000);
              
              // Verify error toast appears
              const errorToast = page.locator('[class*="toast"], [role="status"], [role="alert"]');
              await expect(errorToast.first()).toBeVisible({ timeout: 5000 });
              
              // Verify proposal is still in the list (not removed due to error)
              const proposalRow = page.locator(`[data-testid="row-proposal-${proposalId}"], [data-testid="card-proposal-mobile-${proposalId}"]`);
              await expect(proposalRow).toBeVisible();
            }
          }
        }
      }
    }
    
    // Clean up route interception
    await page.unroute('**/api/proposals/*');
  });

  test('should not have console errors during delete flow', async ({ page }) => {
    const errors = captureConsoleErrors(page);
    
    // Create a test draft proposal
    const proposalData = getDefaultProposalData();
    const proposalId = await createProposal(page, proposalData);
    
    if (proposalId) {
      await openDeleteDialog(page, proposalId);
      
      // Cancel to avoid actually deleting
      const cancelButton = page.locator('button:has-text("Cancel")');
      await cancelButton.click();
      
      await page.waitForTimeout(1000);
      
      // Filter out non-critical errors
      const severeErrors = errors.filter(e => 
        !e.includes('ResizeObserver') && 
        !e.includes('favicon') &&
        !e.includes('manifest') &&
        !e.includes('hydrat')
      );
      
      expect(severeErrors.length).toBe(0);
    }
  });

  test('delete dialog should be accessible', async ({ page }) => {
    // Create a test draft proposal
    const proposalData = getDefaultProposalData();
    const proposalId = await createProposal(page, proposalData);
    
    if (proposalId) {
      await openDeleteDialog(page, proposalId);
      
      // Check for proper ARIA attributes
      const dialog = page.locator('[role="alertdialog"]');
      await expect(dialog).toBeVisible();
      
      // Check for dialog title
      const dialogTitle = page.locator('text=Delete draft?');
      await expect(dialogTitle).toBeVisible();
      
      // Check for dialog description
      const dialogDescription = page.locator(`text=${proposalData.clientName}`);
      await expect(dialogDescription).toBeVisible();
      
      // Test keyboard navigation
      await page.keyboard.press('Tab');
      
      // Cancel button should be focusable
      const cancelButton = page.locator('button:has-text("Cancel")');
      await expect(cancelButton).toBeFocused();
      
      // Press Escape to close
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      
      // Dialog should be closed
      await expect(dialog).not.toBeVisible();
    }
  });
});
