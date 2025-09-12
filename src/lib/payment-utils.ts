/**
 * Payment utilities for Razorpay integration
 * Centralizes all payment-related types and helper functions
 */

// Razorpay TypeScript declarations
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color: string;
  };
  modal?: {
    ondismiss?: () => void;
    confirm_close?: boolean;
  };
  retry?: {
    enabled: boolean;
    max_count: number;
  };
  timeout?: number;
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayInstance {
  open: () => void;
  close?: () => void;
}

export interface PaymentOrder {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

/**
 * Validates if Razorpay is properly loaded and configured
 */
export const validateRazorpaySetup = (): { isValid: boolean; error?: string } => {
  // Check if Razorpay script is loaded
  if (!window.Razorpay) {
    return {
      isValid: false,
      error: "Payment system not loaded. Please refresh the page and try again."
    };
  }

  return { isValid: true };
};

/**
 * Formats amount from paise to rupees for display
 */
export const formatCurrency = (amountInPaise: number): string => {
  return `₹${(amountInPaise / 100).toLocaleString('en-IN')}`;
};

/**
 * Converts amount from rupees to paise
 */
export const rupeesToPaise = (amount: number): number => {
  return Math.round(amount * 100);
};

/**
 * Validates payment form data before processing
 */
export const validatePaymentData = (data: {
  name: string;
  email: string;
  phone: string;
  amount: number;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length < 2) {
    errors.push("Name must be at least 2 characters");
  }

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push("Invalid email address");
  }

  if (!data.phone || !/^\d{10,}$/.test(data.phone.replace(/\D/g, ''))) {
    errors.push("Phone number must be at least 10 digits");
  }

  if (!data.amount || data.amount <= 0) {
    errors.push("Invalid payment amount");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Creates standardized Razorpay options with enhanced error handling
 */
export const createRazorpayOptions = (
  order: PaymentOrder,
  prefillData: {
    name: string;
    email: string;
    phone: string;
  },
  callbacks: {
    onSuccess: (response: RazorpayResponse) => void;
    onDismiss?: () => void;
    onError?: (error: any) => void;
  },
  description: string = "Payment for CarrierHub services"
): RazorpayOptions => {
  return {
    key: order.keyId,
    amount: order.amount,
    currency: order.currency,
    name: "CarrierHub",
    description,
    order_id: order.orderId,
    handler: callbacks.onSuccess,
    prefill: {
      name: prefillData.name.trim(),
      email: prefillData.email.trim(),
      contact: prefillData.phone.replace(/\D/g, ''), // Clean phone number
    },
    theme: {
      color: "#2563eb", // Blue theme matching the site
    },
    modal: {
      ondismiss: callbacks.onDismiss || (() => {}),
      confirm_close: true, // Ask for confirmation before closing
    },
    retry: {
      enabled: true,
      max_count: 3,
    },
    timeout: 300, // 5 minutes timeout
  };
};

/**
 * Enhanced payment error messages for different scenarios
 */
export const PaymentErrors = {
  RAZORPAY_NOT_LOADED: "Payment system not loaded. Please refresh the page and try again.",
  INVALID_CONFIGURATION: "Payment system is not configured. Please contact support.",
  PAYMENT_CANCELLED: "Payment cancelled. You can retry payment from your dashboard.",
  PAYMENT_FAILED: "Payment failed. Please try again or contact support if amount was deducted.",
  NETWORK_ERROR: "Network error. Please check your connection and try again.",
  VERIFICATION_FAILED: "Payment verification failed. Please contact support if amount was deducted.",
  TIMEOUT: "Payment timed out. Please try again.",
  INVALID_AMOUNT: "Invalid payment amount. Please refresh and try again.",
  DECLINED: "Payment was declined by your bank. Please try a different payment method.",
  INSUFFICIENT_FUNDS: "Insufficient funds. Please check your account balance.",
  INVALID_CARD: "Invalid card details. Please check and try again.",
} as const;

/**
 * Maps Razorpay error codes to user-friendly messages
 */
export const mapRazorpayError = (errorCode: string): string => {
  const errorMap: Record<string, string> = {
    'BAD_REQUEST_ERROR': PaymentErrors.PAYMENT_FAILED,
    'GATEWAY_ERROR': PaymentErrors.NETWORK_ERROR,
    'NETWORK_ERROR': PaymentErrors.NETWORK_ERROR,
    'SERVER_ERROR': 'Server error. Please try again later.',
    'INVALID_REQUEST_ERROR': 'Invalid request. Please contact support.',
    'AUTHENTICATION_ERROR': PaymentErrors.INVALID_CONFIGURATION,
  };

  return errorMap[errorCode] || PaymentErrors.PAYMENT_FAILED;
};

/**
 * Utility to safely initialize and open Razorpay payment
 */
export const initializeRazorpayPayment = async (
  options: RazorpayOptions
): Promise<{ success: boolean; error?: string }> => {
  try {
    const validation = validateRazorpaySetup();
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    const razorpay = new window.Razorpay(options);
    razorpay.open();
    
    return { success: true };
  } catch (error) {
    console.error('Razorpay initialization error:', error);
    return { 
      success: false, 
      error: "Failed to initialize payment. Please try again." 
    };
  }
};

/**
 * Utility function to retry failed payments
 */
export const retryPayment = (
  orderId: string,
  maxRetries: number = 3
): Promise<boolean> => {
  return new Promise((resolve) => {
    let attempts = 0;
    
    const attemptPayment = () => {
      attempts++;
      
      // Simulate retry logic (in real implementation, you'd call your payment API)
      setTimeout(() => {
        if (attempts < maxRetries) {
          attemptPayment();
        } else {
          resolve(false); // Max retries reached
        }
      }, 1000 * attempts); // Exponential backoff
    };
    
    attemptPayment();
  });
};
