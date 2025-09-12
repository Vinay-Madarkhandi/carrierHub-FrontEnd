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

  private log(level: string, message: string, data?: any) {
    if (!this.enabledLevels.has(level)) return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    if (data) {
      console.log(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }

  debug(message: string, data?: any) {
    this.log(LOG_LEVELS.DEBUG, message, data);
  }

  info(message: string, data?: any) {
    this.log(LOG_LEVELS.INFO, message, data);
  }

  warn(message: string, data?: any) {
    this.log(LOG_LEVELS.WARN, message, data);
  }

  error(message: string, data?: any) {
    this.log(LOG_LEVELS.ERROR, message, data);
  }

  // API specific logging
  apiRequest(method: string, url: string, config?: any) {
    this.debug(`🌐 API Request: ${method} ${url}`, config);
  }

  apiResponse(status: number, url: string, data?: any) {
    this.debug(`📡 API Response: ${status} ${url}`, data);
  }

  apiError(error: any, context?: string) {
    this.error(`❌ API Error${context ? ` (${context})` : ''}`, error);
  }

  // Auth specific logging  
  authAction(action: string, data?: any) {
    this.info(`🔐 Auth: ${action}`, data);
  }

  // Payment specific logging
  paymentAction(action: string, data?: any) {
    this.info(`💳 Payment: ${action}`, data);
  }
}

// Export singleton instance
export const logger = new Logger();

// Convenience functions for compatibility
export const logDebug = (message: string, data?: any) => logger.debug(message, data);
export const logInfo = (message: string, data?: any) => logger.info(message, data);
export const logWarn = (message: string, data?: any) => logger.warn(message, data);
export const logError = (message: string, data?: any) => logger.error(message, data);
