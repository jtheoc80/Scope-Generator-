/**
 * QA Email Sink - Captures email data for testing purposes.
 * 
 * When QA_EMAIL_SINK=file or NODE_ENV=test, emails are captured
 * to JSON files instead of being sent through the real email provider.
 * 
 * This allows E2E tests to verify email sending without real delivery.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface EmailRecord {
  id: string;
  to: string;
  from?: string;
  subject: string;
  templateName?: string;
  pdfFileName?: string;
  pdfByteLength?: number;
  proposalId?: number;
  timestamp: string;
  runId: string;
  metadata?: Record<string, unknown>;
}

/**
 * Check if QA email sink mode is active.
 */
export function isQAEmailSinkEnabled(): boolean {
  return (
    process.env.QA_EMAIL_SINK === 'file' ||
    process.env.NODE_ENV === 'test' ||
    !!process.env.QA_TEST_SECRET
  );
}

/**
 * Get the QA reports directory path.
 */
function getReportsDir(): string {
  return path.join(process.cwd(), 'qa', 'reports');
}

/**
 * Ensure the reports directories exist.
 */
function ensureDirectories(): void {
  const reportsDir = getReportsDir();
  const emailsDir = path.join(reportsDir, 'emails');
  const pdfsDir = path.join(reportsDir, 'pdfs');

  for (const dir of [reportsDir, emailsDir, pdfsDir]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

/**
 * Generate a unique run ID.
 */
export function generateRunId(): string {
  return `run-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}

/**
 * Save email record to the QA sink.
 */
export async function saveEmailRecord(record: Omit<EmailRecord, 'id' | 'timestamp'>): Promise<EmailRecord> {
  ensureDirectories();

  const fullRecord: EmailRecord = {
    ...record,
    id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    timestamp: new Date().toISOString(),
  };

  const emailsDir = path.join(getReportsDir(), 'emails');
  const filename = `${record.runId}.json`;
  const filepath = path.join(emailsDir, filename);

  // Load existing records for this run
  let records: EmailRecord[] = [];
  if (fs.existsSync(filepath)) {
    try {
      const content = fs.readFileSync(filepath, 'utf-8');
      records = JSON.parse(content);
    } catch {
      records = [];
    }
  }

  // Append new record
  records.push(fullRecord);

  // Save
  fs.writeFileSync(filepath, JSON.stringify(records, null, 2));

  return fullRecord;
}

/**
 * Save PDF to the QA sink.
 */
export async function savePDFRecord(
  proposalId: number,
  pdfBuffer: Buffer,
  filename: string
): Promise<{ path: string; byteLength: number }> {
  ensureDirectories();

  const pdfsDir = path.join(getReportsDir(), 'pdfs');
  const filepath = path.join(pdfsDir, `${proposalId}-${filename}`);

  fs.writeFileSync(filepath, pdfBuffer);

  return {
    path: filepath,
    byteLength: pdfBuffer.length,
  };
}

/**
 * Get email records for a specific run.
 */
export function getEmailRecords(runId: string): EmailRecord[] {
  const emailsDir = path.join(getReportsDir(), 'emails');
  const filepath = path.join(emailsDir, `${runId}.json`);

  if (!fs.existsSync(filepath)) {
    return [];
  }

  try {
    const content = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

/**
 * Get all email records (all runs).
 */
export function getAllEmailRecords(): EmailRecord[] {
  const emailsDir = path.join(getReportsDir(), 'emails');

  if (!fs.existsSync(emailsDir)) {
    return [];
  }

  const files = fs.readdirSync(emailsDir).filter((f) => f.endsWith('.json'));
  const allRecords: EmailRecord[] = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(emailsDir, file), 'utf-8');
      const records = JSON.parse(content);
      allRecords.push(...records);
    } catch {
      // Skip invalid files
    }
  }

  return allRecords.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

/**
 * Check if PDF exists for a proposal.
 */
export function pdfExists(proposalId: number): boolean {
  const pdfsDir = path.join(getReportsDir(), 'pdfs');

  if (!fs.existsSync(pdfsDir)) {
    return false;
  }

  const files = fs.readdirSync(pdfsDir);
  return files.some((f) => f.startsWith(`${proposalId}-`));
}

/**
 * Get PDF info for a proposal.
 */
export function getPDFInfo(proposalId: number): { filename: string; byteLength: number } | null {
  const pdfsDir = path.join(getReportsDir(), 'pdfs');

  if (!fs.existsSync(pdfsDir)) {
    return null;
  }

  const files = fs.readdirSync(pdfsDir).filter((f) => f.startsWith(`${proposalId}-`));
  
  if (files.length === 0) {
    return null;
  }

  const filepath = path.join(pdfsDir, files[0]);
  const stats = fs.statSync(filepath);

  return {
    filename: files[0],
    byteLength: stats.size,
  };
}

/**
 * Clean up old QA records.
 */
export function cleanupOldRecords(maxAgeDays: number = 7): void {
  const cutoffTime = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
  const reportsDir = getReportsDir();

  for (const subdir of ['emails', 'pdfs']) {
    const dir = path.join(reportsDir, subdir);
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filepath = path.join(dir, file);
      const stats = fs.statSync(filepath);
      if (stats.mtimeMs < cutoffTime) {
        fs.unlinkSync(filepath);
      }
    }
  }
}
