import { Page, expect } from '@playwright/test';

/**
 * Proposal management flow helpers for QA tests.
 * 
 * Handles proposal creation, photo upload, and management.
 */

export interface ProposalData {
  clientName: string;
  address: string;
  trade?: string;
  jobType?: string;
}

/**
 * Default proposal data for testing.
 */
export function getDefaultProposalData(runId?: string): ProposalData {
  const timestamp = runId || Date.now().toString();
  return {
    clientName: `QA Test Client ${timestamp.slice(-4)}`,
    address: '123 Test Street, Austin, TX 78701',
    trade: 'bathroom',
    jobType: 'full-remodel',
  };
}

/**
 * Create a new proposal through the UI.
 */
export async function createProposal(page: Page, data: ProposalData): Promise<number | null> {
  // Navigate to generator
  await page.goto('/generator');
  await page.waitForLoadState('networkidle');
  
  // Fill client info
  const clientNameInput = page.locator('[data-testid="input-client-name"]');
  await expect(clientNameInput).toBeVisible({ timeout: 10000 });
  await clientNameInput.fill(data.clientName);
  
  const addressInput = page.locator('[data-testid="input-address"]');
  await addressInput.fill(data.address);
  
  // Select trade (first service card)
  const tradeSelect = page.locator('[data-testid="select-trade-0"]');
  await tradeSelect.click();
  
  // Select bathroom or first available trade
  const tradeOption = page.locator(`[role="option"]:has-text("Bathroom")`).first();
  if (await tradeOption.isVisible()) {
    await tradeOption.click();
  } else {
    // Select first available option
    await page.locator('[role="option"]').first().click();
  }
  
  await page.waitForTimeout(500);
  
  // Select job type
  const jobTypeSelect = page.locator('[data-testid="select-jobtype-0"]');
  await expect(jobTypeSelect).toBeVisible({ timeout: 5000 });
  await jobTypeSelect.click();
  
  // Select full remodel or first available
  const jobTypeOption = page.locator(`[role="option"]`).first();
  await jobTypeOption.click();
  
  await page.waitForTimeout(500);
  
  // Generate proposal
  const generateButton = page.locator('[data-testid="button-generate-proposal"]');
  await expect(generateButton).toBeEnabled({ timeout: 5000 });
  await generateButton.click();
  
  // Wait for generation
  await page.waitForTimeout(2000);
  
  // Save draft
  const saveDraftButton = page.locator('[data-testid="button-save-draft"]');
  if (await saveDraftButton.isVisible()) {
    await saveDraftButton.click();
    await page.waitForTimeout(2000);
  }
  
  // Navigate to dashboard to get proposal ID
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  
  // Get the first proposal from the list
  const proposalRow = page.locator('[data-testid^="row-proposal-"], [data-testid^="card-proposal-mobile-"]').first();
  const testId = await proposalRow.getAttribute('data-testid');
  
  if (testId) {
    const match = testId.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
  }
  
  return null;
}

/**
 * Navigate to proposal edit page.
 */
export async function editProposal(page: Page, proposalId: number): Promise<void> {
  await page.goto(`/app?edit=${proposalId}`);
  await page.waitForLoadState('networkidle');
}

/**
 * Upload photos to a proposal.
 * Uses test fixture images from /tests/fixtures/images/
 */
export async function uploadPhotos(
  page: Page,
  proposalId: number,
  photoCount: number = 3
): Promise<boolean> {
  // This is typically done from the proposal edit page
  // Navigate to the app with edit mode
  await page.goto(`/app?edit=${proposalId}`);
  await page.waitForLoadState('networkidle');
  
  // Look for photo upload area
  const uploadArea = page.locator('.photo-upload, [data-testid="photo-upload-area"]');
  
  if (await uploadArea.isVisible()) {
    // Create dummy files for upload
    const fileChooserPromise = page.waitForEvent('filechooser');
    await uploadArea.click();
    const fileChooser = await fileChooserPromise;
    
    // Use test fixture images
    const testImages = [];
    for (let i = 0; i < photoCount; i++) {
      testImages.push(`./tests/fixtures/images/test-photo-${i + 1}.jpg`);
    }
    
    await fileChooser.setFiles(testImages);
    await page.waitForTimeout(2000);
    
    return true;
  }
  
  return false;
}

/**
 * Get proposal by ID from dashboard.
 */
export async function getProposalFromDashboard(page: Page, proposalId: number): Promise<boolean> {
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  
  const proposalRow = page.locator(`[data-testid="row-proposal-${proposalId}"], [data-testid="card-proposal-mobile-${proposalId}"]`);
  return await proposalRow.isVisible();
}

/**
 * Open email proposal modal.
 */
export async function openEmailModal(page: Page, proposalId: number): Promise<void> {
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  
  // Click email button for the proposal
  const emailButton = page.locator(`[data-testid="button-email-proposal-${proposalId}"], [data-testid="button-quick-send-${proposalId}"]`);
  await emailButton.click();
  
  // Wait for modal
  await expect(page.locator('[data-testid="input-recipient-email"]')).toBeVisible({ timeout: 5000 });
}

/**
 * Send proposal email (after modal is open).
 */
export async function sendProposalEmail(
  page: Page,
  recipientEmail: string,
  recipientName?: string,
  message?: string
): Promise<boolean> {
  // Fill email
  const emailInput = page.locator('[data-testid="input-recipient-email"]');
  await emailInput.fill(recipientEmail);
  
  // Fill name if provided
  if (recipientName) {
    const nameInput = page.locator('[data-testid="input-recipient-name"]');
    await nameInput.fill(recipientName);
  }
  
  // Fill message if provided
  if (message) {
    const messageInput = page.locator('[data-testid="input-email-message"]');
    await messageInput.fill(message);
  }
  
  // Send
  const sendButton = page.locator('[data-testid="email-pdf"]');
  await sendButton.click();
  
  // Wait for success (toast or modal close)
  await page.waitForTimeout(3000);
  
  // Check for success toast or closed modal
  const modalVisible = await page.locator('[data-testid="input-recipient-email"]').isVisible();
  return !modalVisible; // Modal should close on success
}

/**
 * Download proposal PDF (if unlocked).
 */
export async function downloadPDF(page: Page, proposalId: number): Promise<boolean> {
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  
  // Click download button
  const downloadButton = page.locator(`[data-testid="button-download-proposal-${proposalId}"]`);
  
  if (await downloadButton.isVisible()) {
    // Set up download handler
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
    await downloadButton.click();
    
    const download = await downloadPromise;
    return download !== null;
  }
  
  return false;
}

/**
 * View public proposal page.
 */
export async function viewPublicProposal(page: Page, token: string): Promise<boolean> {
  await page.goto(`/p/${token}`);
  await page.waitForLoadState('networkidle');
  
  // Check that proposal content is visible
  const proposalContent = page.locator('.proposal-preview, [data-testid="proposal-content"]');
  return await proposalContent.isVisible();
}
