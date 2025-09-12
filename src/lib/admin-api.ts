/**
 * Admin API Client
 * Dedicated client for admin-specific operations
 */

import { logger } from './logger'

// Admin-specific interfaces
export interface AdminStats {
  totalBookings: number;
  pendingBookings: number;
  successBookings: number;
  completedBookings: number;
  totalRevenue: number;
  monthlyBookings: number;
}

export interface AdminBooking {
  id: number;
  studentId: number;
  consultantType: string;
  status: string;
  amount: number;
  paymentStatus: string;
  createdAt: string;
  student: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface AdminApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: string[];
}

class AdminApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private getAdminToken(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem('adminToken');
    } catch {
      return null;
    }
  }

  private async request<T = unknown>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<AdminApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getAdminToken();

    if (!token) {
      logger.error('No admin token available');
      return {
        success: false,
        error: 'Authentication required'
      };
    }

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
      mode: 'cors',
      credentials: 'omit',
      ...options,
    };

    try {
      logger.debug(`Admin API: ${options.method || 'GET'} ${endpoint}`);
      
      const response = await fetch(url, config);
      const data = await response.json();

      if (response.ok) {
        logger.debug(`Admin API Response: ${response.status}`, data);
        return {
          success: true,
          data: data.data || data,
          message: data.message
        };
      } else {
        logger.error(`Admin API Error: ${response.status}`, data);
        return {
          success: false,
          error: data.message || data.error || `Request failed with status ${response.status}`,
          details: data.details || []
        };
      }
    } catch (error) {
      logger.error('Admin API Network Error', error);
      return {
        success: false,
        error: 'Network error occurred'
      };
    }
  }

  // Admin authentication
  async login(credentials: { 
    email: string; 
    password: string; 
  }): Promise<AdminApiResponse<{ admin: Record<string, unknown>; token: string }>> {
    return this.request('/admin/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  // Dashboard stats
  async getDashboardStats(): Promise<AdminApiResponse<AdminStats>> {
    return this.request('/admin/dashboard/stats');
  }

  // Booking management
  async getAllBookings(): Promise<AdminApiResponse<{ bookings: AdminBooking[] }>> {
    return this.request('/admin/bookings');
  }

  async updateBookingStatus(
    bookingId: number, 
    status: string
  ): Promise<AdminApiResponse<{ booking: AdminBooking }>> {
    return this.request(`/admin/bookings/${bookingId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Student management
  async getAllStudents(): Promise<AdminApiResponse<{ students: Record<string, unknown>[] }>> {
    return this.request('/admin/students');
  }

  // Payments management  
  async getAllPayments(): Promise<AdminApiResponse<{ payments: Record<string, unknown>[] }>> {
    return this.request('/admin/payments');
  }

  // Revenue analytics
  async getRevenueStats(): Promise<AdminApiResponse<Record<string, unknown>>> {
    return this.request('/admin/revenue/stats');
  }

  async getRevenueBreakdown(): Promise<AdminApiResponse<Record<string, unknown>>> {
    return this.request('/admin/revenue/breakdown');
  }

  // Health check
  async healthCheck(): Promise<AdminApiResponse<{ status: string }>> {
    return this.request('/admin/health');
  }
}

// Export singleton instance
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://carrierhub-backend.onrender.com/api';
export const adminApiClient = new AdminApiClient(API_BASE_URL);
