/**
 * Structured logger for HIMS application
 * Provides type-safe logging with proper sanitization for production
 * 
 * Usage:
 * import { logger } from '@/lib/logger';
 * 
 * logger.info('User logged in', { userId: user.id });
 * logger.error('Database query failed', error, { query: 'findMany' });
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  userId?: string;
  requestId?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    message: string;
    name: string;
    stack?: string;
  };
  environment: string;
}

class Logger {
  private readonly isDevelopment = process.env.NODE_ENV === 'development';
  private readonly isProduction = process.env.NODE_ENV === 'production';

  /**
   * Sanitize sensitive data from log context
   */
  private sanitize(context: LogContext): LogContext {
    const sanitized = { ...context };
    
    // Remove sensitive fields
    const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'ssn', 'passport'];
    
    Object.keys(sanitized).forEach(key => {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  /**
   * Format error object for logging
   */
  private formatError(error: Error) {
    return {
      message: error.message,
      name: error.name,
      // Only include stack trace in development
      ...(this.isDevelopment && { stack: error.stack })
    };
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, error?: Error, context?: LogContext) {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      environment: process.env.NODE_ENV || 'development',
      ...(context && { context: this.sanitize(context) }),
      ...(error && { error: this.formatError(error) })
    };

    // In production: Send to monitoring service
    if (this.isProduction) {
      // TODO: Integrate with Sentry, Datadog, or CloudWatch
      // Example for Sentry:
      // import * as Sentry from '@sentry/nextjs';
      // if (level === 'error') {
      //   Sentry.captureException(error, { contexts: { custom: context } });
      // }
      
      // For now, structured JSON to stdout (for container logging)
      console.error(JSON.stringify(logEntry));
    } else {
      // Development: Pretty print
      const color = {
        info: '\x1b[36m',    // Cyan
        warn: '\x1b[33m',    // Yellow
        error: '\x1b[31m',   // Red
        debug: '\x1b[90m'    // Gray
      }[level];
      
      const reset = '\x1b[0m';
      
      console[level === 'error' ? 'error' : 'log'](
        `${color}[${level.toUpperCase()}]${reset} ${message}`,
        context ? `\nContext: ${JSON.stringify(context, null, 2)}` : '',
        error ? `\nError: ${error.message}\n${error.stack}` : ''
      );
    }
  }

  /**
   * Log informational messages (successful operations)
   */
  info(message: string, context?: LogContext) {
    this.log('info', message, undefined, context);
  }

  /**
   * Log warnings (recoverable issues)
   */
  warn(message: string, context?: LogContext) {
    this.log('warn', message, undefined, context);
  }

  /**
   * Log errors (failed operations)
   */
  error(message: string, error: Error, context?: LogContext) {
    this.log('error', message, error, context);
  }

  /**
   * Log debug information (development only)
   */
  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      this.log('debug', message, undefined, context);
    }
  }

  /**
   * Create a child logger with preset context (e.g., for a specific request)
   */
  child(defaultContext: LogContext) {
    return {
      info: (message: string, context?: LogContext) => 
        this.info(message, { ...defaultContext, ...context }),
      warn: (message: string, context?: LogContext) => 
        this.warn(message, { ...defaultContext, ...context }),
      error: (message: string, error: Error, context?: LogContext) => 
        this.error(message, error, { ...defaultContext, ...context }),
      debug: (message: string, context?: LogContext) => 
        this.debug(message, { ...defaultContext, ...context })
    };
  }
}

// Export singleton instance
export const logger = new Logger();

/**
 * Usage Examples:
 * 
 * // Basic logging
 * logger.info('Application started');
 * logger.warn('Rate limit approaching', { userId: '123', requests: 95 });
 * 
 * // Error logging (auto-sanitizes sensitive data)
 * try {
 *   await prisma.crew.create({ data });
 * } catch (error) {
 *   logger.error('Failed to create crew', error as Error, { 
 *     userId: session.user.id,
 *     operation: 'crew.create'
 *   });
 * }
 * 
 * // Request-scoped logging
 * const requestLogger = logger.child({ 
 *   requestId: req.headers.get('x-request-id'),
 *   endpoint: req.url,
 *   method: req.method
 * });
 * 
 * requestLogger.info('Processing request');
 * requestLogger.error('Request failed', error);
 */
