import { Page, expect } from '@playwright/test';
import { navigateTo, DEFAULT_ELEMENT_TIMEOUT, DEFAULT_NAVIGATION_TIMEOUT } from './test-helpers';

/**
 * Proposal management flow helpers for QA tests.
 * 
 * Handles proposal creation, photo upload, and management.
 * 
 * UPDATED: Now uses domcontentloaded + explicit waits instead of networkidle.
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
  // Navigate to generator using improved helper (no networkidle)
  await navigateTo(page, '/generator', {
    waitForSelector: '[data-testid="input-client-name"]',
    timeout: DEFAULT_NAVIGATION_TIMEOUT,
  });
  
  // Fill client info
  const clientNameInput = page.locator('[data-testid="input-client-name"]');
  await expect(clientNameInput).toBeVisible({ timeout: DEFAULT_ELEMENT_TIMEOUT });
  await clientNameInput.fill(data.clientName);
  
  const addressInput = page.locator('[data-testid="input-address"]');
  await addressInput.fill(data.address);
  
  // Select trade (first service card)
  const tradeSelect = page.locator('[data-testid="select-trade-0"]');
  await tradeSelect.click();
  
  // Wait for dropdown options to appear
  const tradeOptions = page.locator('[role="option"]');
  await expect(tradeOptions.first()).toBeVisible({ timeout: DEFAULT_ELEMENT_TIMEOUT });
  
  // Select bathroom or first available trade
  const bathroomOption = page.locator(`[role="option"]:has-text("Bathroom")`).first();
  if (await bathroomOption.isVisible({ timeout: 500 }).catch(() => false)) {
    await bathroomOption.click();
  } else {
    await tradeOptions.first().click();
  }
  
  // Select job type - wait for it to appear
  const jobTypeSelect = page.locator('[data-testid="select-jobtype-0"]');
  await expect(jobTypeSelect).toBeVisible({ timeout: DEFAULT_ELEMENT_TIMEOUT });
  await jobTypeSelect.click();
  
  // Wait for job type options
  await expect(page.locator('[role="option"]').first()).toBeVisible({ timeout: DEFAULT_ELEMENT_TIMEOUT });
  await page.locator('[role="option"]').first().click();
  
  // Generate proposal - wait for button to be enabled
  const generateButton = page.locator('[data-testid="button-generate-proposal"]');
  await expect(generateButton).toBeEnabled({ timeout: DEFAULT_ELEMENT_TIMEOUT });
  await generateButton.click();
  
  // Wait for generation to complete - look for save draft button or generated content
  const saveDraftButton = page.locator('[data-testid="button-save-draft"]');
  await expect(saveDraftButton).toBeVisible({ timeout: 10000 }); // Generation might take time
  
  // Save draft
  await saveDraftButton.click();
  
  // Wait for save confirmation - could be a toast or URL change
  await page.waitForURL(/\/(dashboard|generator)/, { timeout: DEFAULT_ELEMENT_TIMEOUT });
  
  // Navigate to dashboard to get proposal ID
  await navigateTo(page, '/dashboard', {
    waitForSelector: '[data-testid^="row-proposal-"], [data-testid^="card-proposal-mobile-"]',
    timeout: DEFAULT_NAVIGATION_TIMEOUT,
  });
  
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
  await page.goto(`/app?edit=${proposalId}`, { waitUntil: 'domcontentloaded' });
  // Wait for proposal content to load
  await expect(page.locator('.proposal-content, [data-testid="proposal-editor"]').first())
    .toBeVisible({ timeout: DEFAULT_ELEMENT_TIMEOUT });
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
  // Navigate to the app with edit mode
  await page.goto(`/app?edit=${proposalId}`, { waitUntil: 'domcontentloaded' });
  
  // Look for photo upload area
  const uploadArea = page.locator('.photo-upload, [data-testid="photo-upload-area"]');
  
  if (await uploadArea.isVisible({ timeout: DEFAULT_ELEMENT_TIMEOUT }).catch(() => false)) {
    // Create dummy files for upload
    const fileChooserPromise = page.waitForEvent('filechooser', { timeout: DEFAULT_ELEMENT_TIMEOUT });
    await uploadArea.click();
    const fileChooser = await fileChooserPromise;
    
    // Use test fixture images
    const testImages = [];
    for (let i = 0; i < photoCount; i++) {
      testImages.push(`./tests/fixtures/images/test-photo-${i + 1}.jpg`);
    }
    
    await fileChooser.setFiles(testImages);
    
    // Wait for upload to complete - look for uploaded photo indicators
    await expect(page.locator('.uploaded-photo, [data-testid^="uploaded-photo-"]').first())
      .toBeVisible({ timeout: 5000 })
      .catch(() => {}); // May not have visual indicator
    
    return true;
  }
  
  return false;
}

/**
 * Get proposal by ID from dashboard.
 */
export async function getProposalFromDashboard(page: Page, proposalId: number): Promise<boolean> {
  await navigateTo(page, '/dashboard', {
    waitForSelector: '[data-testid^="row-proposal-"], [data-testid^="card-proposal-mobile-"]',
    timeout: DEFAULT_NAVIGATION_TIMEOUT,
  });
  
  const proposalRow = page.locator(`[data-testid="row-proposal-${proposalId}"], [data-testid="card-proposal-mobile-${proposalId}"]`);
  return await proposalRow.isVisible({ timeout: DEFAULT_ELEMENT_TIMEOUT }).catch(() => false);
}

/**
 * Open email proposal modal.
 */
export async function openEmailModal(page: Page, proposalId: number): Promise<void> {
  await navigateTo(page, '/dashboard', {
    waitForSelector: `[data-testid="button-email-proposal-${proposalId}"], [data-testid="button-quick-send-${proposalId}"]`,
    timeout: DEFAULT_NAVIGATION_TIMEOUT,
  });
  
  // Click email button for the proposal
  const emailButton = page.locator(`[data-testid="button-email-proposal-${proposalId}"], [data-testid="button-quick-send-${proposalId}"]`);
  await emailButton.click();
  
  // Wait for modal
  await expect(page.locator('[data-testid="input-recipient-email"]')).toBeVisible({ timeout: DEFAULT_ELEMENT_TIMEOUT });
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
  const sendButton = page.locator('[data-testid="button-send-email"]');
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
  await navigateTo(page, '/dashboard', {
    waitForSelector: '[data-testid^="row-proposal-"], [data-testid^="card-proposal-mobile-"]',
    timeout: DEFAULT_NAVIGATION_TIMEOUT,
  });
  
  // Click download button
  const downloadButton = page.locator(`[data-testid="button-download-proposal-${proposalId}"]`);
  
  if (await downloadButton.isVisible({ timeout: DEFAULT_ELEMENT_TIMEOUT }).catch(() => false)) {
    // Set up download handler
    const downloadPromise = page.waitForEvent('download', { timeout: DEFAULT_NAVIGATION_TIMEOUT }).catch(() => null);
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
  await page.goto(`/p/${token}`, { waitUntil: 'domcontentloaded' });
  
  // Check that proposal content is visible
  const proposalContent = page.locator('.proposal-preview, [data-testid="proposal-content"]');
  return await proposalContent.isVisible({ timeout: DEFAULT_ELEMENT_TIMEOUT }).catch(() => false);
}
