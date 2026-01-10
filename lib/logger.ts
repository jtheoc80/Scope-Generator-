/**
 * Structured Logger Utility
 * 
 * Provides consistent logging across the application with:
 * - JSON output in production (for log aggregation services)
 * - Human-readable output in development
 * - Log levels: debug, info, warn, error
 * - Context support for adding metadata
 * 
 * Usage:
 * ```ts
 * import { logger } from '@/lib/logger';
 * 
 * logger.info('User signed in', { userId: 'abc123' });
 * logger.error('Payment failed', { error: err, orderId: '123' });
 * logger.warn('Rate limit approaching', { remaining: 10 });
 * ```
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Default to 'info' in production, 'debug' in development
const MIN_LOG_LEVEL = process.env.LOG_LEVEL as LogLevel || 
  (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LOG_LEVEL];
}

function formatError(error: unknown): LogEntry['error'] | undefined {
  if (!error) return undefined;
  
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    };
  }
  
  return {
    name: 'UnknownError',
    message: String(error),
  };
}

function createLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: unknown
): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(context && Object.keys(context).length > 0 ? { context } : {}),
    ...(error ? { error: formatError(error) } : {}),
  };
}

function output(entry: LogEntry): void {
  const consoleFn = entry.level === 'error' ? console.error :
                    entry.level === 'warn' ? console.warn :
                    entry.level === 'debug' ? console.debug :
                    console.log;

  if (process.env.NODE_ENV === 'production') {
    // JSON output for production (log aggregation services)
    consoleFn(JSON.stringify(entry));
  } else {
    // Human-readable output for development
    const prefix = `[${entry.level.toUpperCase()}]`;
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
    const errorStr = entry.error ? `\n  Error: ${entry.error.message}${entry.error.stack ? `\n${entry.error.stack}` : ''}` : '';
    consoleFn(`${prefix} ${entry.message}${contextStr}${errorStr}`);
  }
}

function log(level: LogLevel, message: string, contextOrError?: LogContext | Error, maybeError?: unknown): void {
  if (!shouldLog(level)) return;

  let context: LogContext | undefined;
  let error: unknown;

  // Handle overloaded signatures:
  // log(level, message)
  // log(level, message, context)
  // log(level, message, error)
  // log(level, message, context, error)
  if (contextOrError instanceof Error) {
    error = contextOrError;
  } else if (contextOrError) {
    context = contextOrError;
    error = maybeError;
  }

  const entry = createLogEntry(level, message, context, error);
  output(entry);
}

/**
 * Logger instance with methods for each log level.
 * 
 * @example
 * // Simple logging
 * logger.info('Server started');
 * 
 * // With context
 * logger.info('User action', { userId: '123', action: 'login' });
 * 
 * // Error logging
 * logger.error('Database connection failed', error);
 * logger.error('Request failed', { requestId: 'abc' }, error);
 */
export const logger = {
  /**
   * Debug level - verbose information for debugging.
   * Only shown when LOG_LEVEL=debug or in development.
   */
  debug: (message: string, context?: LogContext) => log('debug', message, context),
  
  /**
   * Info level - general operational information.
   * Default minimum level in production.
   */
  info: (message: string, context?: LogContext) => log('info', message, context),
  
  /**
   * Warn level - potentially harmful situations.
   * Should be investigated but not immediately critical.
   */
  warn: (message: string, contextOrError?: LogContext | Error, maybeError?: unknown) => 
    log('warn', message, contextOrError, maybeError),
  
  /**
   * Error level - error events that might still allow the app to continue.
   * Should be investigated and fixed.
   */
  error: (message: string, contextOrError?: LogContext | Error, maybeError?: unknown) => 
    log('error', message, contextOrError, maybeError),

  /**
   * Create a child logger with preset context.
   * Useful for adding request IDs or user IDs to all logs.
   * 
   * @example
   * const reqLogger = logger.child({ requestId: 'abc123' });
   * reqLogger.info('Processing request'); // includes requestId in context
   */
  child: (baseContext: LogContext) => ({
    debug: (message: string, context?: LogContext) => 
      log('debug', message, { ...baseContext, ...context }),
    info: (message: string, context?: LogContext) => 
      log('info', message, { ...baseContext, ...context }),
    warn: (message: string, contextOrError?: LogContext | Error, maybeError?: unknown) => {
      if (contextOrError instanceof Error) {
        log('warn', message, baseContext, contextOrError);
      } else {
        log('warn', message, { ...baseContext, ...contextOrError }, maybeError);
      }
    },
    error: (message: string, contextOrError?: LogContext | Error, maybeError?: unknown) => {
      if (contextOrError instanceof Error) {
        log('error', message, baseContext, contextOrError);
      } else {
        log('error', message, { ...baseContext, ...contextOrError }, maybeError);
      }
    },
  }),
};

export default logger;
