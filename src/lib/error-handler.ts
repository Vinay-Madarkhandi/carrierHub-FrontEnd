/**
 * Enhanced Error Handling Utilities
 * Provides consistent error handling patterns across the application
 */

import { toast } from "sonner";
import { logger } from "./logger";

export interface ErrorDetails {
  code?: string;
  field?: string;
  message: string;
  suggestion?: string;
}

export interface AppError {
  type: 'network' | 'validation' | 'auth' | 'payment' | 'server' | 'client';
  message: string;
  details?: ErrorDetails[];
  originalError?: any;
  context?: string;
}

class ErrorHandler {
  // Network-related errors
  static handleNetworkError(error: any, context?: string): AppError {
    let message = "Network connection error. Please check your internet connection.";
    
    if (error?.message) {
      if (error.message.includes('Failed to fetch')) {
        message = "Unable to connect to the server. Please try again later.";
      } else if (error.message.includes('timeout')) {
        message = "Request timed out. The server may be busy, please try again.";
      }
    }

    const appError: AppError = {
      type: 'network',
      message,
      originalError: error,
      context
    };

    logger.error('Network Error', { error: appError, originalError: error });
    return appError;
  }

  // Authentication errors
  static handleAuthError(error: any, context?: string): AppError {
    let message = "Authentication failed. Please log in again.";
    
    if (error?.message) {
      if (error.message.includes('invalid_token') || error.message.includes('expired')) {
        message = "Your session has expired. Please log in again.";
      } else if (error.message.includes('unauthorized')) {
        message = "You don't have permission to perform this action.";
      } else if (error.message.includes('invalid_credentials')) {
        message = "Invalid email or password. Please check and try again.";
      }
    }

    const appError: AppError = {
      type: 'auth',
      message,
      originalError: error,
      context
    };

    logger.error('Auth Error', { error: appError, originalError: error });
    return appError;
  }

  // Payment-related errors
  static handlePaymentError(error: any, context?: string): AppError {
    let message = "Payment processing failed. Please try again.";
    
    if (error?.message) {
      if (error.message.includes('insufficient_funds')) {
        message = "Insufficient funds. Please check your account balance.";
      } else if (error.message.includes('invalid_card')) {
        message = "Invalid card details. Please check and try again.";
      } else if (error.message.includes('declined')) {
        message = "Payment was declined. Please try a different payment method.";
      } else if (error.message.includes('timeout')) {
        message = "Payment timed out. Please check your payment status in your account.";
      }
    }

    const appError: AppError = {
      type: 'payment',
      message,
      originalError: error,
      context
    };

    logger.error('Payment Error', { error: appError, originalError: error });
    return appError;
  }

  // Validation errors
  static handleValidationError(error: any, context?: string): AppError {
    let message = "Please check your input and try again.";
    let details: ErrorDetails[] = [];

    if (error?.details && Array.isArray(error.details)) {
      details = error.details.map((detail: any) => ({
        field: detail.field || detail.path?.[0],
        message: detail.message,
        suggestion: this.getFieldSuggestion(detail.field || detail.path?.[0])
      }));
      
      if (details.length > 0) {
        message = `Please fix the following: ${details.map(d => d.message).join(', ')}`;
      }
    }

    const appError: AppError = {
      type: 'validation',
      message,
      details,
      originalError: error,
      context
    };

    logger.error('Validation Error', { error: appError, originalError: error });
    return appError;
  }

  // Server errors
  static handleServerError(error: any, context?: string): AppError {
    let message = "Server error occurred. Please try again later.";
    
    if (error?.status) {
      if (error.status >= 500) {
        message = "Server is temporarily unavailable. Please try again later.";
      } else if (error.status === 429) {
        message = "Too many requests. Please wait a moment before trying again.";
      } else if (error.status === 404) {
        message = "The requested resource was not found.";
      }
    }

    const appError: AppError = {
      type: 'server',
      message,
      originalError: error,
      context
    };

    logger.error('Server Error', { error: appError, originalError: error });
    return appError;
  }

  // Generic error handler that determines error type
  static handle(error: any, context?: string): AppError {
    // Check error type and route to appropriate handler
    if (error?.name === 'NetworkError' || error?.message?.includes('fetch')) {
      return this.handleNetworkError(error, context);
    }
    
    if (error?.status === 401 || error?.message?.includes('unauthorized') || error?.message?.includes('auth')) {
      return this.handleAuthError(error, context);
    }
    
    if (error?.type === 'payment' || error?.message?.includes('payment') || error?.message?.includes('razorpay')) {
      return this.handlePaymentError(error, context);
    }
    
    if (error?.type === 'validation' || error?.details || error?.message?.includes('validation')) {
      return this.handleValidationError(error, context);
    }
    
    if (error?.status >= 500) {
      return this.handleServerError(error, context);
    }

    // Default client error
    const appError: AppError = {
      type: 'client',
      message: error?.message || 'An unexpected error occurred. Please try again.',
      originalError: error,
      context
    };

    logger.error('Client Error', { error: appError, originalError: error });
    return appError;
  }

  // Display error to user with appropriate UI
  static show(error: AppError | any, fallbackMessage?: string): void {
    const appError = error.type ? error : this.handle(error);
    
    // Show toast based on error type
    switch (appError.type) {
      case 'network':
        toast.error(appError.message, {
          description: "Check your connection and try again",
          action: {
            label: "Retry",
            onClick: () => window.location.reload()
          }
        });
        break;
        
      case 'auth':
        toast.error(appError.message, {
          description: "You may need to log in again",
          action: {
            label: "Login",
            onClick: () => window.location.href = '/login'
          }
        });
        break;
        
      case 'payment':
        toast.error(appError.message, {
          description: "Contact support if amount was deducted",
          duration: 8000
        });
        break;
        
      case 'validation':
        if (appError.details && appError.details.length > 0) {
          appError.details.forEach((detail: ErrorDetails) => {
            toast.error(detail.message, {
              description: detail.suggestion
            });
          });
        } else {
          toast.error(appError.message);
        }
        break;
        
      default:
        toast.error(appError.message || fallbackMessage || "Something went wrong");
    }
  }

  // Get suggestion for field validation errors
  private static getFieldSuggestion(field: string): string {
    const suggestions: Record<string, string> = {
      email: "Please enter a valid email address",
      phone: "Please enter a valid phone number with country code",
      password: "Password should be at least 8 characters long",
      name: "Please enter your full name",
      query: "Please provide more details about your request"
    };
    
    return suggestions[field] || "Please check this field";
  }

  // Wrap async functions with error handling
  static async wrap<T>(
    fn: () => Promise<T>, 
    context?: string,
    showToast: boolean = true
  ): Promise<{ data?: T; error?: AppError }> {
    try {
      const data = await fn();
      return { data };
    } catch (error) {
      const appError = this.handle(error, context);
      
      if (showToast) {
        this.show(appError);
      }
      
      return { error: appError };
    }
  }
}

// Convenience functions
export const handleError = ErrorHandler.handle.bind(ErrorHandler);
export const showError = ErrorHandler.show.bind(ErrorHandler);
export const withErrorHandling = ErrorHandler.wrap.bind(ErrorHandler);

export default ErrorHandler;
