/**
 * Intelligent Persistent Build Agent
 * 
 * This agent runs builds continuously until success, analyzing errors
 * and providing detailed diagnostics to help fix issues.
 * 
 * Supports pulling GitHub PRs and working on them.
 */

import { spawn, execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface BuildError {
  file: string;
  line?: number;
  column?: number;
  code?: string;
  message: string;
  severity: 'error' | 'warning';
}

interface BuildResult {
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  errors: BuildError[];
  duration: number;
}

interface PRInfo {
  number: number;
  title: string;
  branch: string;
  state: string;
  url: string;
}

interface AgentConfig {
  maxAttempts: number;
  buildCmd: string;
  lintCmd: string;
  logDir: string;
  workspaceRoot: string;
  retryDelay: number;
  prRef?: string; // PR number or URL
}

class PersistentBuildAgent {
  private config: AgentConfig;
  private attempt: number = 0;
  private startTime: Date;
  private errors: Map<string, BuildError[]> = new Map();
  private prInfo?: PRInfo;

  constructor(config: Partial<AgentConfig> = {}) {
    this.config = {
      maxAttempts: config.maxAttempts ?? 50,
      buildCmd: config.buildCmd ?? 'npm run build',
      lintCmd: config.lintCmd ?? 'npm run lint',
      logDir: config.logDir ?? './build-logs',
      workspaceRoot: config.workspaceRoot ?? process.cwd(),
      retryDelay: config.retryDelay ?? 2000,
      prRef: config.prRef,
    };
    this.startTime = new Date();
    
    // Ensure log directory exists
    if (!fs.existsSync(this.config.logDir)) {
      fs.mkdirSync(this.config.logDir, { recursive: true });
    }
  }

  private log(message: string, level: 'info' | 'success' | 'error' | 'warning' = 'info'): void {
    const colors = {
      info: '\x1b[34m',
      success: '\x1b[32m',
      error: '\x1b[31m',
      warning: '\x1b[33m',
    };
    const reset = '\x1b[0m';
    const prefix = {
      info: '[BUILD-AGENT]',
      success: '[SUCCESS]',
      error: '[ERROR]',
      warning: '[WARNING]',
    };
    console.log(`${colors[level]}${prefix[level]}${reset} ${message}`);
  }

  private async runCommand(cmd: string): Promise<BuildResult> {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const [command, ...args] = cmd.split(' ');
      const proc = spawn(command, args, {
        cwd: this.config.workspaceRoot,
        shell: true,
        stdio: ['inherit', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      proc.stdout?.on('data', (data) => {
        const text = data.toString();
        stdout += text;
        process.stdout.write(text);
      });

      proc.stderr?.on('data', (data) => {
        const text = data.toString();
        stderr += text;
        process.stderr.write(text);
      });

      proc.on('close', (code) => {
        const duration = Date.now() - startTime;
        const errors = this.parseErrors(stdout + stderr);
        
        resolve({
          success: code === 0,
          exitCode: code ?? 1,
          stdout,
          stderr,
          errors,
          duration,
        });
      });
    });
  }

  private parseErrors(output: string): BuildError[] {
    const errors: BuildError[] = [];
    const lines = output.split('\n');
    
    // TypeScript error pattern: file(line,col): error TSxxxx: message
    const tsErrorRegex = /^(.+?)\((\d+),(\d+)\):\s*(error|warning)\s+(TS\d+):\s*(.+)$/;
    
    // Next.js/webpack error pattern
    const nextErrorRegex = /^(.+?):(\d+):(\d+)\s*-?\s*(error|warning)?\s*(.+)$/;
    
    // Module not found pattern
    const moduleNotFoundRegex = /Module not found:\s*(.+)/;
    
    // Type error pattern
    const typeErrorRegex = /Type error:\s*(.+)/;

    for (const line of lines) {
      let match = line.match(tsErrorRegex);
      if (match) {
        errors.push({
          file: match[1],
          line: parseInt(match[2]),
          column: parseInt(match[3]),
          severity: match[4] as 'error' | 'warning',
          code: match[5],
          message: match[6],
        });
        continue;
      }

      match = line.match(nextErrorRegex);
      if (match && match[4]) {
        errors.push({
          file: match[1],
          line: parseInt(match[2]),
          column: parseInt(match[3]),
          severity: match[4] as 'error' | 'warning',
          message: match[5],
        });
        continue;
      }

      match = line.match(moduleNotFoundRegex);
      if (match) {
        errors.push({
          file: 'unknown',
          severity: 'error',
          message: `Module not found: ${match[1]}`,
        });
        continue;
      }

      match = line.match(typeErrorRegex);
      if (match) {
        errors.push({
          file: 'unknown',
          severity: 'error',
          message: `Type error: ${match[1]}`,
        });
      }
    }

    return errors;
  }

  private groupErrorsByFile(errors: BuildError[]): Map<string, BuildError[]> {
    const grouped = new Map<string, BuildError[]>();
    for (const error of errors) {
      const existing = grouped.get(error.file) ?? [];
      existing.push(error);
      grouped.set(error.file, existing);
    }
    return grouped;
  }

  private saveLog(attempt: number, result: BuildResult): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `build_attempt_${attempt}_${timestamp}.json`;
    const filepath = path.join(this.config.logDir, filename);
    
    const logData = {
      attempt,
      timestamp: new Date().toISOString(),
      success: result.success,
      exitCode: result.exitCode,
      duration: result.duration,
      errors: result.errors,
      errorsByFile: Object.fromEntries(this.groupErrorsByFile(result.errors)),
    };
    
    fs.writeFileSync(filepath, JSON.stringify(logData, null, 2));
    return filepath;
  }

  private printErrorSummary(errors: BuildError[]): void {
    if (errors.length === 0) return;
    
    console.log('\n' + '─'.repeat(60));
    this.log(`Found ${errors.length} error(s)`, 'error');
    console.log('─'.repeat(60));
    
    const grouped = this.groupErrorsByFile(errors);
    
    for (const [file, fileErrors] of grouped) {
      console.log(`\n📁 ${file}:`);
      for (const error of fileErrors.slice(0, 5)) {
        const location = error.line ? `Line ${error.line}` : '';
        const code = error.code ? `[${error.code}]` : '';
        console.log(`   ${location} ${code} ${error.message}`);
      }
      if (fileErrors.length > 5) {
        console.log(`   ... and ${fileErrors.length - 5} more errors`);
      }
    }
    console.log('');
  }

  private async checkDependencies(): Promise<boolean> {
    const nodeModulesPath = path.join(this.config.workspaceRoot, 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
      this.log('node_modules not found, installing dependencies...', 'warning');
      try {
        execSync('npm install', { 
          cwd: this.config.workspaceRoot, 
          stdio: 'inherit' 
        });
        return true;
      } catch {
        this.log('Failed to install dependencies', 'error');
        return false;
      }
    }
    return true;
  }

  private extractPRNumber(ref: string): string | null {
    // Check if it's a URL like https://github.com/owner/repo/pull/123
    const urlMatch = ref.match(/github\.com\/[^/]+\/[^/]+\/pull\/(\d+)/);
    if (urlMatch) {
      return urlMatch[1];
    }
    // Check if it's just a number
    if (/^\d+$/.test(ref)) {
      return ref;
    }
    return null;
  }

  private async pullPR(prRef: string): Promise<boolean> {
    console.log('\n' + '─'.repeat(60));
    this.log(`Pulling PR: ${prRef}`, 'info');
    console.log('─'.repeat(60));

    // Check if gh is available
    try {
      execSync('gh --version', { stdio: 'pipe' });
    } catch {
      this.log('GitHub CLI (gh) is not installed', 'error');
      return false;
    }

    // Check if authenticated
    try {
      execSync('gh auth status', { stdio: 'pipe', cwd: this.config.workspaceRoot });
    } catch {
      this.log('GitHub CLI is not authenticated. Run "gh auth login" first.', 'error');
      return false;
    }

    const prNumber = this.extractPRNumber(prRef);
    if (!prNumber) {
      this.log(`Invalid PR reference: ${prRef} (use PR number or GitHub URL)`, 'error');
      return false;
    }

    // Get PR details
    this.log(`Fetching PR #${prNumber} details...`, 'info');
    try {
      const prJson = execSync(`gh pr view ${prNumber} --json number,title,headRefName,state,url`, {
        cwd: this.config.workspaceRoot,
        encoding: 'utf-8',
      });
      
      const prData = JSON.parse(prJson);
      this.prInfo = {
        number: prData.number,
        title: prData.title,
        branch: prData.headRefName,
        state: prData.state,
        url: prData.url,
      };

      console.log(`\n\x1b[36m[PR]\x1b[0m PR #${this.prInfo.number}: ${this.prInfo.title}`);
      console.log(`\x1b[36m[PR]\x1b[0m Branch: ${this.prInfo.branch}`);
      console.log(`\x1b[36m[PR]\x1b[0m State: ${this.prInfo.state}`);
      console.log(`\x1b[36m[PR]\x1b[0m URL: ${this.prInfo.url}\n`);

    } catch (err) {
      this.log(`Failed to fetch PR #${prNumber}`, 'error');
      return false;
    }

    // Checkout the PR
    this.log(`Checking out PR #${prNumber}...`, 'info');
    try {
      execSync(`gh pr checkout ${prNumber}`, {
        cwd: this.config.workspaceRoot,
        stdio: 'inherit',
      });
      this.log(`Successfully checked out PR #${prNumber}`, 'success');
    } catch {
      this.log(`Failed to checkout PR #${prNumber}`, 'error');
      return false;
    }

    // Check if package.json changed and reinstall if needed
    try {
      const changedFiles = execSync('git diff HEAD~1 --name-only', {
        cwd: this.config.workspaceRoot,
        encoding: 'utf-8',
      });
      
      if (changedFiles.includes('package.json')) {
        this.log('package.json changed, reinstalling dependencies...', 'info');
        execSync('npm install', {
          cwd: this.config.workspaceRoot,
          stdio: 'inherit',
        });
      }
    } catch {
      // Ignore errors from git diff (might be first commit)
    }

    console.log('');
    this.log(`PR #${prNumber} is ready for building`, 'success');
    console.log('');

    return true;
  }

  async run(): Promise<boolean> {
    console.log('\n' + '═'.repeat(60));
    this.log('Starting Persistent Build Agent');
    console.log('═'.repeat(60));
    this.log(`Max attempts: ${this.config.maxAttempts}`);
    this.log(`Build command: ${this.config.buildCmd}`);
    this.log(`Workspace: ${this.config.workspaceRoot}`);
    this.log(`Log directory: ${this.config.logDir}`);
    if (this.config.prRef) {
      this.log(`PR: ${this.config.prRef}`);
    }
    console.log('');

    // Pull PR if specified
    if (this.config.prRef) {
      if (!await this.pullPR(this.config.prRef)) {
        this.log('Failed to pull PR, aborting', 'error');
        return false;
      }
    }

    // Check dependencies
    if (!await this.checkDependencies()) {
      return false;
    }

    while (this.attempt < this.config.maxAttempts) {
      this.attempt++;
      
      console.log('\n' + '━'.repeat(60));
      this.log(`Attempt ${this.attempt} of ${this.config.maxAttempts}`);
      console.log('━'.repeat(60) + '\n');

      const result = await this.runCommand(this.config.buildCmd);
      const logFile = this.saveLog(this.attempt, result);

      if (result.success) {
        console.log('\n' + '═'.repeat(60));
        this.log('BUILD SUCCEEDED!', 'success');
        console.log('═'.repeat(60));
        this.log(`Total attempts: ${this.attempt}`, 'success');
        this.log(`Duration: ${(result.duration / 1000).toFixed(2)}s`, 'success');
        this.log(`Log file: ${logFile}`, 'success');
        
        // Run lint check
        this.log('\nRunning lint check...', 'info');
        const lintResult = await this.runCommand(this.config.lintCmd);
        
        if (lintResult.success) {
          this.log('Lint check passed!', 'success');
        } else {
          this.log('Lint check has warnings (non-blocking)', 'warning');
        }

        // Save final status
        this.saveFinalStatus(true);
        
        console.log('\n' + '═'.repeat(60));
        this.log('BUILD AGENT COMPLETED SUCCESSFULLY', 'success');
        console.log('═'.repeat(60) + '\n');
        
        return true;
      }

      this.log(`Build failed (attempt ${this.attempt})`, 'error');
      this.log(`Log saved to: ${logFile}`, 'info');
      this.printErrorSummary(result.errors);

      // Store errors for tracking
      for (const error of result.errors) {
        const existing = this.errors.get(error.file) ?? [];
        existing.push(error);
        this.errors.set(error.file, existing);
      }

      if (this.attempt < this.config.maxAttempts) {
        this.log(`Waiting ${this.config.retryDelay / 1000}s before retry...`, 'warning');
        await this.delay(this.config.retryDelay);
      }
    }

    // Max attempts reached
    console.log('\n' + '═'.repeat(60));
    this.log(`BUILD FAILED after ${this.config.maxAttempts} attempts`, 'error');
    console.log('═'.repeat(60));
    this.saveFinalStatus(false);
    
    return false;
  }

  private saveFinalStatus(success: boolean): void {
    const statusFile = path.join(this.config.logDir, 'build_status.json');
    const status = {
      success,
      attempts: this.attempt,
      startTime: this.startTime.toISOString(),
      endTime: new Date().toISOString(),
      totalDuration: Date.now() - this.startTime.getTime(),
      uniqueErrorFiles: Array.from(this.errors.keys()),
      totalErrors: Array.from(this.errors.values()).flat().length,
    };
    fs.writeFileSync(statusFile, JSON.stringify(status, null, 2));
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// CLI Entry Point
async function main() {
  const args = process.argv.slice(2);
  
  const config: Partial<AgentConfig> = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '-m':
      case '--max':
        config.maxAttempts = parseInt(args[++i]);
        break;
      case '-c':
      case '--cmd':
        config.buildCmd = args[++i];
        break;
      case '-d':
      case '--delay':
        config.retryDelay = parseInt(args[++i]);
        break;
      case '-p':
      case '--pr':
        config.prRef = args[++i];
        break;
      case '-h':
      case '--help':
        console.log(`
Persistent Build Agent

Usage: npx ts-node script/build-agent.ts [options] [PR_NUMBER_OR_URL]

Options:
  -m, --max N      Maximum build attempts (default: 50)
  -c, --cmd CMD    Build command (default: 'npm run build')
  -d, --delay MS   Delay between retries in ms (default: 2000)
  -p, --pr PR      Pull request number or GitHub URL
  -h, --help       Show this help message

Examples:
  npx ts-node script/build-agent.ts                    # Build current branch
  npx ts-node script/build-agent.ts --pr 123           # Pull PR #123 and build
  npx ts-node script/build-agent.ts --pr https://github.com/org/repo/pull/123
  npx ts-node script/build-agent.ts 123                # Shorthand for --pr 123
`);
        process.exit(0);
      default:
        // Check if it's a PR number or URL (positional argument)
        if (/^\d+$/.test(arg) || arg.includes('github.com') && arg.includes('/pull/')) {
          config.prRef = arg;
        }
    }
  }

  const agent = new PersistentBuildAgent(config);
  const success = await agent.run();
  process.exit(success ? 0 : 1);
}

main().catch((err: unknown) => {
  console.error('Build agent crashed:', err);
  process.exit(1);
});
