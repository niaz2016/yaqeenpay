// src/utils/logger.ts

/**
 * Production-safe logging utility
 * In development: logs to console with timestamps
 * In production: no-ops (silent) unless critical errors
 */

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogOptions {
  timestamp?: boolean;
  context?: string;
}

class Logger {
  private formatMessage(level: LogLevel, message: string, context?: string): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';
    return `[${timestamp}] ${level.toUpperCase()} ${contextStr} ${message}`;
  }

  /**
   * Debug logs - only in development
   */
  debug(message: string, data?: unknown, options?: LogOptions): void {
    if (!isDevelopment) return;
    
    const formatted = this.formatMessage('debug', message, options?.context);
    console.log(formatted, data !== undefined ? data : '');
  }

  /**
   * Info logs - only in development
   */
  info(message: string, data?: unknown, options?: LogOptions): void {
    if (!isDevelopment) return;
    
    const formatted = this.formatMessage('info', message, options?.context);
    console.info(formatted, data !== undefined ? data : '');
  }

  /**
   * Warning logs - only in development
   */
  warn(message: string, data?: unknown, options?: LogOptions): void {
    if (!isDevelopment) return;
    
    const formatted = this.formatMessage('warn', message, options?.context);
    console.warn(formatted, data !== undefined ? data : '');
  }

  /**
   * Error logs - always logged (even in production)
   * In production, sends to error tracking service (future enhancement)
   */
  error(message: string, error?: Error | unknown, options?: LogOptions): void {
    const formatted = this.formatMessage('error', message, options?.context);
    
    if (isDevelopment) {
      console.error(formatted, error);
    } else if (isProduction) {
      // In production, log critical errors silently
      // Future: Send to Sentry, LogRocket, or other error tracking service
      console.error(formatted);
      
      // Example: Send to error tracking service
      // if (window.Sentry) {
      //   window.Sentry.captureException(error, {
      //     tags: { context: options?.context || 'app' },
      //     extra: { message }
      //   });
      // }
    }
  }

  /**
   * Group logs for better organization (development only)
   */
  group(label: string): void {
    if (!isDevelopment) return;
    console.group(label);
  }

  groupEnd(): void {
    if (!isDevelopment) return;
    console.groupEnd();
  }

  /**
   * Table display for structured data (development only)
   */
  table(data: unknown): void {
    if (!isDevelopment) return;
    console.table(data);
  }
}

// Export singleton instance
const logger = new Logger();
export default logger;
