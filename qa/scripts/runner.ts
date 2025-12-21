#!/usr/bin/env npx tsx
/**
 * QA Agent Runner
 * 
 * Orchestrates all QA checks:
 * 1. Lint (if configured)
 * 2. TypeScript check
 * 3. Unit tests (if present)
 * 4. Playwright E2E tests
 * 5. Lighthouse CI
 * 
 * Generates a summary report at qa/reports/summary.md
 */

import { execSync, spawn, SpawnOptions } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface StageResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  duration: number;
  message?: string;
}

const results: StageResult[] = [];
const startTime = Date.now();
const baseUrl = process.env.QA_BASE_URL || 'http://localhost:3000';

/**
 * Run a command and return success status.
 */
function runCommand(
  command: string,
  args: string[],
  options?: SpawnOptions
): Promise<{ success: boolean; output: string; duration: number }> {
  return new Promise((resolve) => {
    const start = Date.now();
    let output = '';
    
    const proc = spawn(command, args, {
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: true,
      ...options,
    });

    proc.stdout?.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stdout.write(text);
    });

    proc.stderr?.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stderr.write(text);
    });

    proc.on('close', (code) => {
      resolve({
        success: code === 0,
        output,
        duration: Date.now() - start,
      });
    });

    proc.on('error', () => {
      resolve({
        success: false,
        output,
        duration: Date.now() - start,
      });
    });
  });
}

/**
 * Check if a command exists.
 */
function commandExists(cmd: string): boolean {
  try {
    execSync(`which ${cmd}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Print stage header.
 */
function printStage(name: string): void {
  console.log('\n' + '='.repeat(60));
  console.log(`🔄 ${name}`);
  console.log('='.repeat(60) + '\n');
}

/**
 * Print stage result.
 */
function printResult(result: StageResult): void {
  const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
  const durationSec = (result.duration / 1000).toFixed(1);
  console.log(`\n${icon} ${result.name}: ${result.status} (${durationSec}s)`);
  if (result.message) {
    console.log(`   ${result.message}`);
  }
}

/**
 * Run lint check.
 */
async function runLint(): Promise<void> {
  printStage('LINT CHECK');
  
  // Check if eslint is configured
  const hasEslint = fs.existsSync(path.join(process.cwd(), '.eslintrc.json')) ||
                    fs.existsSync(path.join(process.cwd(), '.eslintrc.js')) ||
                    fs.existsSync(path.join(process.cwd(), 'eslint.config.js'));
  
  if (!hasEslint) {
    const result: StageResult = {
      name: 'Lint',
      status: 'SKIP',
      duration: 0,
      message: 'No ESLint config found',
    };
    results.push(result);
    printResult(result);
    return;
  }

  const { success, duration } = await runCommand('npm', ['run', 'lint', '--', '--max-warnings=0']);
  
  const result: StageResult = {
    name: 'Lint',
    status: success ? 'PASS' : 'FAIL',
    duration,
  };
  results.push(result);
  printResult(result);
}

/**
 * Run TypeScript check.
 */
async function runTypeCheck(): Promise<void> {
  printStage('TYPESCRIPT CHECK');
  
  const hasTsConfig = fs.existsSync(path.join(process.cwd(), 'tsconfig.json'));
  
  if (!hasTsConfig) {
    const result: StageResult = {
      name: 'TypeScript',
      status: 'SKIP',
      duration: 0,
      message: 'No tsconfig.json found',
    };
    results.push(result);
    printResult(result);
    return;
  }

  const { success, duration } = await runCommand('npx', ['tsc', '--noEmit']);
  
  const result: StageResult = {
    name: 'TypeScript',
    status: success ? 'PASS' : 'FAIL',
    duration,
  };
  results.push(result);
  printResult(result);
}

/**
 * Run unit tests (if present).
 */
async function runUnitTests(): Promise<void> {
  printStage('UNIT TESTS');
  
  // Check for common test runners
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  const hasJest = packageJson.devDependencies?.jest || packageJson.dependencies?.jest;
  const hasVitest = packageJson.devDependencies?.vitest || packageJson.dependencies?.vitest;
  const hasTestScript = packageJson.scripts?.test;
  
  if (!hasJest && !hasVitest && !hasTestScript) {
    const result: StageResult = {
      name: 'Unit Tests',
      status: 'SKIP',
      duration: 0,
      message: 'No unit test framework detected',
    };
    results.push(result);
    printResult(result);
    return;
  }

  const { success, duration } = await runCommand('npm', ['test', '--', '--passWithNoTests']);
  
  const result: StageResult = {
    name: 'Unit Tests',
    status: success ? 'PASS' : 'FAIL',
    duration,
  };
  results.push(result);
  printResult(result);
}

/**
 * Run Playwright E2E tests.
 */
async function runE2ETests(): Promise<void> {
  printStage('E2E TESTS (Playwright)');
  
  const { success, duration } = await runCommand('npx', [
    'playwright',
    'test',
    '--reporter=list',
  ], {
    env: {
      ...process.env,
      QA_BASE_URL: baseUrl,
    },
  });
  
  const result: StageResult = {
    name: 'E2E Tests',
    status: success ? 'PASS' : 'FAIL',
    duration,
  };
  results.push(result);
  printResult(result);
}

/**
 * Run Lighthouse CI.
 */
async function runLighthouse(): Promise<void> {
  printStage('LIGHTHOUSE CI');
  
  const hasLhciConfig = fs.existsSync(path.join(process.cwd(), 'lighthouserc.js')) ||
                        fs.existsSync(path.join(process.cwd(), 'lighthouserc.json'));
  
  if (!hasLhciConfig) {
    const result: StageResult = {
      name: 'Lighthouse',
      status: 'SKIP',
      duration: 0,
      message: 'No Lighthouse config found',
    };
    results.push(result);
    printResult(result);
    return;
  }

  // Ensure reports directory exists
  fs.mkdirSync(path.join(process.cwd(), 'qa', 'reports', 'lighthouse'), { recursive: true });

  const { success, duration } = await runCommand('npx', [
    'lhci',
    'autorun',
    `--collect.url=${baseUrl}`,
    `--collect.url=${baseUrl}/sign-in`,
    `--collect.url=${baseUrl}/sign-up`,
  ], {
    env: {
      ...process.env,
      LHCI_BUILD_CONTEXT__CURRENT_HASH: process.env.GITHUB_SHA || 'local',
    },
  });
  
  const result: StageResult = {
    name: 'Lighthouse',
    status: success ? 'PASS' : 'FAIL',
    duration,
  };
  results.push(result);
  printResult(result);
}

/**
 * Generate summary report.
 */
function generateSummary(): void {
  const totalDuration = Date.now() - startTime;
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;
  const total = results.length;
  
  const allPassed = failed === 0;
  
  const summary = `# QA Agent Summary

**Run Date:** ${new Date().toISOString()}
**Base URL:** ${baseUrl}
**Total Duration:** ${(totalDuration / 1000).toFixed(1)}s

## Overall Status: ${allPassed ? '✅ PASS' : '❌ FAIL'}

| Stage | Status | Duration |
|-------|--------|----------|
${results.map(r => {
  const icon = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '⏭️';
  const dur = (r.duration / 1000).toFixed(1) + 's';
  const msg = r.message ? ` (${r.message})` : '';
  return `| ${r.name} | ${icon} ${r.status}${msg} | ${dur} |`;
}).join('\n')}

## Summary

- **Passed:** ${passed}/${total}
- **Failed:** ${failed}/${total}
- **Skipped:** ${skipped}/${total}

## Environment

- **NODE_ENV:** ${process.env.NODE_ENV || 'development'}
- **CI:** ${process.env.CI || 'false'}
- **QA_BASE_URL:** ${baseUrl}
- **QA_EMAIL_SINK:** ${process.env.QA_EMAIL_SINK || 'not set'}
- **QA_STRIPE_MODE:** ${process.env.QA_STRIPE_MODE || 'redirect'}

## Artifacts

- Playwright Report: \`qa/reports/playwright-html/index.html\`
- Playwright Results: \`qa/reports/playwright-results.json\`
- Lighthouse Reports: \`qa/reports/lighthouse/\`
- Email Records: \`qa/reports/emails/\`
- PDF Artifacts: \`qa/reports/pdfs/\`

---
*Generated by QA Agent*
`;

  // Write summary
  const reportsDir = path.join(process.cwd(), 'qa', 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(path.join(reportsDir, 'summary.md'), summary);
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 QA SUMMARY');
  console.log('='.repeat(60));
  console.log(`\nOverall: ${allPassed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Passed: ${passed}/${total}, Failed: ${failed}/${total}, Skipped: ${skipped}/${total}`);
  console.log(`Duration: ${(totalDuration / 1000).toFixed(1)}s`);
  console.log(`\nReport: qa/reports/summary.md`);
}

/**
 * Main entry point.
 */
async function main(): Promise<void> {
  console.log('🤖 QA Agent Starting...');
  console.log(`📍 Base URL: ${baseUrl}`);
  console.log(`⏰ Started: ${new Date().toISOString()}`);

  // Run all stages
  await runLint();
  await runTypeCheck();
  await runUnitTests();
  await runE2ETests();
  await runLighthouse();

  // Generate summary
  generateSummary();

  // Exit with appropriate code
  const failed = results.filter(r => r.status === 'FAIL').length;
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('QA Agent failed:', error);
  process.exit(1);
});
