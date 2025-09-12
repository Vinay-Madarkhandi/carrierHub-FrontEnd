/**
 * Development logging utility
 * Provides structured logging that can be easily disabled in production
 */

export interface LogLevel {
  DEBUG: 'debug';
  INFO: 'info';  
  WARN: 'warn';
  ERROR: 'error';
}

export const LOG_LEVELS: LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn', 
  ERROR: 'error'
};

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private enabledLevels = new Set(['error', 'warn', 'info']);

  constructor() {
    // In development, enable debug logging
    if (this.isDevelopment) {
      this.enabledLevels.add('debug');
    }
  }

  private log(level: string, message: string, data?: unknown) {
    if (!this.enabledLevels.has(level)) return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    if (data) {
      console.log(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }

  debug(message: string, data?: unknown) {
    this.log(LOG_LEVELS.DEBUG, message, data);
  }

  info(message: string, data?: unknown) {
    this.log(LOG_LEVELS.INFO, message, data);
  }

  warn(message: string, data?: unknown) {
    this.log(LOG_LEVELS.WARN, message, data);
  }

  error(message: string, data?: unknown) {
    this.log(LOG_LEVELS.ERROR, message, data);
  }

  // API specific logging
  apiRequest(method: string, url: string, config?: unknown) {
    this.debug(`🌐 API Request: ${method} ${url}`, config);
  }

  apiResponse(status: number, url: string, data?: unknown) {
    this.debug(`📡 API Response: ${status} ${url}`, data);
  }

  apiError(error: unknown, context?: string) {
    this.error(`❌ API Error${context ? ` (${context})` : ''}`, error);
  }

  // Auth specific logging  
  authAction(action: string, data?: unknown) {
    this.info(`🔐 Auth: ${action}`, data);
  }

  // Payment specific logging
  paymentAction(action: string, data?: unknown) {
    this.info(`💳 Payment: ${action}`, data);
  }
}

// Export singleton instance
export const logger = new Logger();

// Convenience functions for compatibility
export const logDebug = (message: string, data?: unknown) => logger.debug(message, data);
export const logInfo = (message: string, data?: unknown) => logger.info(message, data);
export const logWarn = (message: string, data?: unknown) => logger.warn(message, data);
export const logError = (message: string, data?: unknown) => logger.error(message, data);
