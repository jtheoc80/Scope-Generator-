import * as fs from "fs";
import * as path from "path";

// Error log file path - uses build-logs directory for consistency
const ERROR_LOG_DIR = path.join(process.cwd(), "build-logs");
const ERROR_LOG_FILE = path.join(ERROR_LOG_DIR, "vision_errors.log");

export type ErrorCategory = 
  | "VISION_REKOGNITION"
  | "VISION_GPT"
  | "VISION_ALL_FAILED"
  | "VISION_FORMAT"
  | "DRAFT_GENERATION"
  | "DRAFT_TEMPLATE"
  | "DRAFT_USER"
  | "NETWORK"
  | "CONFIG"
  | "UNKNOWN";

export interface ErrorLogEntry {
  timestamp: string;
  category: ErrorCategory;
  jobId?: number;
  photoId?: number;
  draftId?: number;
  error: string;
  details?: Record<string, unknown>;
  stack?: string;
}

/**
 * Ensures the log directory exists
 */
function ensureLogDir(): void {
  try {
    if (!fs.existsSync(ERROR_LOG_DIR)) {
      fs.mkdirSync(ERROR_LOG_DIR, { recursive: true });
    }
  } catch (e) {
    // Silently fail - we don't want logging to break the app
    console.warn("error-logger: Could not create log directory", e);
  }
}

/**
 * Formats an error log entry as a single line JSON for easy parsing
 */
function formatLogEntry(entry: ErrorLogEntry): string {
  return JSON.stringify(entry) + "\n";
}

/**
 * Appends an error to the log file
 */
export function logError(params: {
  category: ErrorCategory;
  error: string | Error;
  jobId?: number;
  photoId?: number;
  draftId?: number;
  details?: Record<string, unknown>;
}): void {
  const { category, error, jobId, photoId, draftId, details } = params;
  
  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : undefined;

  const entry: ErrorLogEntry = {
    timestamp: new Date().toISOString(),
    category,
    jobId,
    photoId,
    draftId,
    error: errorMessage,
    details,
    stack: errorStack,
  };

  // Also log to console for immediate visibility
  console.error(`[${category}]`, entry);

  // Append to file
  try {
    ensureLogDir();
    fs.appendFileSync(ERROR_LOG_FILE, formatLogEntry(entry));
  } catch (e) {
    // Don't let logging failures break the application
    console.warn("error-logger: Could not write to log file", e);
  }
}

/**
 * Log a vision pipeline error (Rekognition or GPT)
 */
export function logVisionError(params: {
  photoId: number;
  jobId: number;
  provider: "rekognition" | "gpt" | "all";
  error: string | Error;
  imageUrl?: string;
  details?: Record<string, unknown>;
}): void {
  const categoryMap = {
    rekognition: "VISION_REKOGNITION" as ErrorCategory,
    gpt: "VISION_GPT" as ErrorCategory,
    all: "VISION_ALL_FAILED" as ErrorCategory,
  };

  logError({
    category: categoryMap[params.provider],
    error: params.error,
    jobId: params.jobId,
    photoId: params.photoId,
    details: {
      imageUrl: params.imageUrl?.substring(0, 100),
      ...params.details,
    },
  });
}

/**
 * Log an image format error
 */
export function logFormatError(params: {
  photoId: number;
  jobId: number;
  detectedFormat?: string;
  imageUrl?: string;
  error: string;
}): void {
  logError({
    category: "VISION_FORMAT",
    error: params.error,
    jobId: params.jobId,
    photoId: params.photoId,
    details: {
      detectedFormat: params.detectedFormat,
      imageUrl: params.imageUrl?.substring(0, 100),
    },
  });
}

/**
 * Log a draft generation error
 */
export function logDraftError(params: {
  jobId: number;
  draftId: number;
  error: string | Error;
  attempts?: number;
  details?: Record<string, unknown>;
}): void {
  logError({
    category: "DRAFT_GENERATION",
    error: params.error,
    jobId: params.jobId,
    draftId: params.draftId,
    details: {
      attempts: params.attempts,
      ...params.details,
    },
  });
}

/**
 * Log a configuration error (missing API keys, etc.)
 */
export function logConfigError(params: {
  service: string;
  error: string;
  details?: Record<string, unknown>;
}): void {
  logError({
    category: "CONFIG",
    error: params.error,
    details: {
      service: params.service,
      ...params.details,
    },
  });
}

/**
 * Get recent errors from the log file
 * @param limit Maximum number of errors to return (default: 100)
 * @param category Optional category filter
 */
export function getRecentErrors(limit = 100, category?: ErrorCategory): ErrorLogEntry[] {
  try {
    if (!fs.existsSync(ERROR_LOG_FILE)) {
      return [];
    }

    const content = fs.readFileSync(ERROR_LOG_FILE, "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);
    
    // Parse from end (most recent first)
    const entries: ErrorLogEntry[] = [];
    for (let i = lines.length - 1; i >= 0 && entries.length < limit; i--) {
      try {
        const entry = JSON.parse(lines[i]) as ErrorLogEntry;
        if (!category || entry.category === category) {
          entries.push(entry);
        }
      } catch {
        // Skip malformed lines
      }
    }

    return entries;
  } catch (e) {
    console.warn("error-logger: Could not read log file", e);
    return [];
  }
}

/**
 * Get error counts by category for monitoring/alerting
 * @param since Only count errors after this timestamp
 */
export function getErrorCounts(since?: Date): Record<ErrorCategory, number> {
  const counts: Record<ErrorCategory, number> = {
    VISION_REKOGNITION: 0,
    VISION_GPT: 0,
    VISION_ALL_FAILED: 0,
    VISION_FORMAT: 0,
    DRAFT_GENERATION: 0,
    DRAFT_TEMPLATE: 0,
    DRAFT_USER: 0,
    NETWORK: 0,
    CONFIG: 0,
    UNKNOWN: 0,
  };

  try {
    if (!fs.existsSync(ERROR_LOG_FILE)) {
      return counts;
    }

    const content = fs.readFileSync(ERROR_LOG_FILE, "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);
    const sinceTime = since?.getTime() ?? 0;

    for (const line of lines) {
      try {
        const entry = JSON.parse(line) as ErrorLogEntry;
        const entryTime = new Date(entry.timestamp).getTime();
        
        if (entryTime >= sinceTime && entry.category in counts) {
          counts[entry.category]++;
        }
      } catch {
        // Skip malformed lines
      }
    }
  } catch (e) {
    console.warn("error-logger: Could not read log file for counts", e);
  }

  return counts;
}

/**
 * Clear old log entries (keeps last N entries)
 * @param keepCount Number of entries to keep (default: 10000)
 */
export function rotateLogFile(keepCount = 10000): void {
  try {
    if (!fs.existsSync(ERROR_LOG_FILE)) {
      return;
    }

    const content = fs.readFileSync(ERROR_LOG_FILE, "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);

    if (lines.length <= keepCount) {
      return;
    }

    // Keep only the most recent entries
    const keepLines = lines.slice(-keepCount);
    fs.writeFileSync(ERROR_LOG_FILE, keepLines.join("\n") + "\n");
    
    console.log(`error-logger: Rotated log file, kept ${keepCount} of ${lines.length} entries`);
  } catch (e) {
    console.warn("error-logger: Could not rotate log file", e);
  }
}
