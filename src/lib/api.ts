import { getToken } from './auth-utils'
import { clientCache, CACHE_KEYS, CACHE_TTL, withCache } from './cache'
import { logger } from './logger'

// API URL configuration - use exact URL from environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://carrierhub-backend.onrender.com/api'

// Log API configuration in development
logger.debug('API Configuration', {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  API_BASE_URL: API_BASE_URL,
  isClient: typeof window !== 'undefined',
  environment: process.env.NODE_ENV,
  userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'Server'
})

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
  details?: unknown[]
}

// Backend Consultant Types (matching Prisma enum)
export type ConsultantType = 
  | 'CAREER_GUIDANCE'
  | 'COLLEGE_COURSE'
  | 'EXAM_PREPARATION'
  | 'STUDY_ABROAD'
  | 'SKILL_MENTORSHIP'
  | 'JOB_PLACEMENT'
  | 'GOVERNMENT_JOBS'
  | 'PERSONAL_GROWTH'
  | 'ALTERNATIVE_CAREERS'

// Backend Booking Status (matching Prisma enum)
export type BookingStatus = 
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED'
  | 'COMPLETED'

export interface Student {
  id: number
  name: string
  email: string
  phone: string
  createdAt: string
  updatedAt: string
}

export interface Booking {
  id: number
  studentId: number
  consultantType: ConsultantType
  details: string
  amount: number // in paise
  currency: string
  status: BookingStatus
  razorpayOrderId?: string
  payment?: Payment
  student?: Student // Include student details
  createdAt: string
  updatedAt: string
}

export interface Payment {
  id: number
  bookingId: number
  razorpayPaymentId: string
  razorpayOrderId: string
  razorpaySignature: string
  amount: number
  currency: string
  status: BookingStatus
  createdAt: string
}

export interface Category {
  type: ConsultantType
  title: string
  description: string
}

export class ApiClient {
  private baseURL: string

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    useAdminToken: boolean = false
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    
    // Use admin token for admin endpoints, user token for others
    const token = useAdminToken 
      ? (typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null)
      : getToken()

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      mode: 'cors', // Explicitly set CORS mode
      credentials: 'omit', // Don't send credentials by default
      ...options,
    }

    // Log API request in development
    logger.apiRequest(options.method || 'GET', `${this.baseURL}${endpoint}`, {
      hasToken: !!token,
      useAdminToken,
      endpoint
    })

    // Retry mechanism with exponential backoff
    const maxRetries = 3
    let retryCount = 0
    
    while (retryCount <= maxRetries) {
      try {
        // Add timeout to prevent infinite loading
        const controller = new AbortController()
        const timeoutDuration = 15000 + (retryCount * 5000) // Increase timeout with retries
        const timeoutId = setTimeout(() => controller.abort(), timeoutDuration)

        logger.debug(`Making fetch request to: ${url} (attempt ${retryCount + 1}/${maxRetries + 1})`)
        logger.debug('Request config', config)

        const response = await fetch(url, {
          ...config,
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        logger.debug('Response status:', response.status)
        logger.debug('Response headers:', Object.fromEntries(response.headers.entries()))
        
        if (!response.ok) {
          logger.error('Response not OK', { status: response.status, statusText: response.statusText })
          
          // Don't retry for client errors (4xx), only server errors (5xx) and network issues
          if (response.status >= 400 && response.status < 500) {
            const data = await response.json().catch(() => ({ message: 'Client error' }))
            return {
              success: false,
              error: data.message || data.error || `Request failed with status ${response.status}`,
              details: data.details || []
            }
          }
          
          // For server errors, try to get error message but continue to retry logic
          if (retryCount === maxRetries) {
            const data = await response.json().catch(() => ({ message: 'Server error' }))
            return {
              success: false,
              error: data.message || data.error || `Server error (${response.status}). Please try again later.`,
              details: data.details || []
            }
          }
        } else {
          // Success case
          const data = await response.json()

          logger.apiResponse(response.status, url, data)

          return {
            success: true,
            data: data.data || data,
            message: data.message
          }
        }
      } catch (error) {
        logger.apiError(error, `attempt ${retryCount + 1}/${maxRetries + 1}`)
        
        // If this is the last retry, return the error
        if (retryCount === maxRetries) {
          let errorMessage = 'Network error - server may be temporarily unavailable'
          if (error instanceof Error) {
            if (error.name === 'AbortError') {
              errorMessage = 'Request timeout - server is taking too long to respond. Please try again later.'
            } else if (error.message.includes('Failed to fetch')) {
              errorMessage = 'Cannot connect to server - please check your internet connection or try again later'
            } else if (error.message.includes('CORS')) {
              errorMessage = 'CORS error - please contact support if this persists'
            } else if (error.message.includes('NetworkError')) {
              errorMessage = 'Network error - please check your connection and try again'
            } else {
              errorMessage = `Connection error: ${error.message}. Please try again later.`
            }
          }
          
          return {
            success: false,
            error: errorMessage,
            details: []
          }
        }
      }
      
      // Wait before retrying (exponential backoff)
      if (retryCount < maxRetries) {
        const waitTime = Math.min(1000 * Math.pow(2, retryCount), 10000) // Cap at 10 seconds
        logger.debug(`Retrying in ${waitTime}ms...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
      
      retryCount++
    }
    
    // This should never be reached, but just in case
    return {
      success: false,
      error: 'Maximum retry attempts exceeded. Please try again later.',
      details: []
    }
  }

  // Auth endpoints
  async signup(userData: { 
    name: string
    email: string
    phone: string
    password: string
  }): Promise<ApiResponse<{ student: Student; token: string }>> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  async login(credentials: { 
    email: string
    password: string
  }): Promise<ApiResponse<{ student: Student; token: string }>> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  }

  async getProfile(): Promise<ApiResponse<{ student: Student }>> {
    return this.request('/auth/me')
  }

  // Categories endpoint with caching
  async getCategories(): Promise<ApiResponse<{ categories: Category[] }>> {
    return withCache(
      CACHE_KEYS.CATEGORIES,
      () => this.request('/categories'),
      CACHE_TTL.LONG
    )
  }

  // Booking endpoints
  async createBooking(bookingData: {
    consultantType: ConsultantType
    details: string
    amount: number
  }): Promise<ApiResponse<{ booking: Booking }>> {
    const result = await this.request<{ booking: Booking }>('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    })
    
    // Invalidate bookings cache after creating new booking
    if (result.success) {
      clientCache.delete(CACHE_KEYS.BOOKINGS)
      // Clear all booking-related cache entries
      const keys = clientCache.keys()
      keys.forEach(key => {
        if (key.startsWith(CACHE_KEYS.BOOKINGS)) {
          clientCache.delete(key)
        }
      })
    }
    
    return result
  }

  async getBookings(params?: {
    page?: number
    limit?: number
  }): Promise<ApiResponse<{ bookings: Booking[]; pagination?: { page: number; limit: number; total: number; totalPages: number } }>> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    
    const endpoint = `/bookings/me${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const cacheKey = `${CACHE_KEYS.BOOKINGS}_${queryParams.toString() || 'default'}`
    
    return withCache(
      cacheKey,
      () => this.request(endpoint),
      CACHE_TTL.SHORT
    )
  }

  async getBooking(bookingId: number): Promise<ApiResponse<{ booking: Booking }>> {
    return this.request(`/bookings/${bookingId}`)
  }

  // Payment endpoints
  async createPaymentOrder(bookingId: number): Promise<ApiResponse<{
    orderId: string
    amount: number
    currency: string
    keyId: string
  }>> {
    return this.request('/payments/create', {
      method: 'POST',
      body: JSON.stringify({ bookingId }),
    })
  }

  async verifyPayment(paymentData: {
    razorpay_payment_id: string
    razorpay_order_id: string
    razorpay_signature: string
    bookingId: number
  }): Promise<ApiResponse<{ payment: Payment; booking: Booking }>> {
    return this.request('/payments/verify', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    })
  }

  // Admin endpoints
  async adminLogin(credentials: { 
    email: string
    password: string
  }): Promise<ApiResponse<{ admin: { id: number; email: string; name: string }; token: string }>> {
    return this.request('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  }

  async getAdminBookings(params?: {
    status?: BookingStatus
    consultantType?: ConsultantType
    page?: number
    limit?: number
    dateFrom?: string
    dateTo?: string
  }): Promise<ApiResponse<{ bookings: Booking[]; pagination?: { page: number; limit: number; total: number; totalPages: number } }>> {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.append('status', params.status)
    if (params?.consultantType) queryParams.append('consultantType', params.consultantType)
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom)
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo)
    
    const endpoint = `/admin/bookings${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return this.request(endpoint, {}, true) // Use admin token
  }

  async updateBookingStatus(bookingId: number, status: BookingStatus): Promise<ApiResponse<{ booking: Booking }>> {
    return this.request(`/admin/bookings/${bookingId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }, true) // Use admin token
  }

  async exportBookings(): Promise<ApiResponse<Blob>> {
    return this.request('/admin/bookings/export', {}, true) // Use admin token
  }

  async getAdminStats(): Promise<ApiResponse<{
    totalBookings: number
    pendingBookings: number
    successBookings: number
    completedBookings: number
    totalRevenue: number
    monthlyBookings: number
  }>> {
    return this.request('/admin/dashboard/stats', {}, true) // Use admin token
  }

  // Test connectivity method
  async testConnection(): Promise<ApiResponse<unknown>> {
    logger.debug('Testing connection to:', this.baseURL)
    return this.request('/categories')
  }

  // Health check endpoint
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    try {
      // Use a simple GET request with shorter timeout for health checks
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout for health checks
      
      // Health endpoint is at root level, not under /api
      const healthUrl = this.baseURL.replace('/api', '') + '/health'
      
      const response = await fetch(healthUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const data = await response.json()
        return {
          success: true,
          data: data.data || { status: 'ok', timestamp: new Date().toISOString() }
        }
      } else {
        return {
          success: false,
          error: 'Health check failed'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Health check failed'
      }
    }
  }

  // Get all bookings for admin (with filters)
  async getAllBookings(params?: {
    status?: BookingStatus
    consultantType?: ConsultantType
    page?: number
    limit?: number
    dateFrom?: string
    dateTo?: string
    search?: string
  }): Promise<ApiResponse<{ bookings: Booking[]; pagination?: { page: number; limit: number; total: number; totalPages: number } }>> {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.append('status', params.status)
    if (params?.consultantType) queryParams.append('consultantType', params.consultantType)
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom)
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo)
    if (params?.search) queryParams.append('search', params.search)
    
    const endpoint = `/admin/bookings${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return this.request(endpoint, {}, true) // Use admin token
  }

  // Get booking by ID for admin
  async getAdminBooking(bookingId: number): Promise<ApiResponse<{ booking: Booking }>> {
    return this.request(`/admin/bookings/${bookingId}`, {}, true) // Use admin token
  }

  // Delete booking (admin only)
  async deleteBooking(bookingId: number): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/admin/bookings/${bookingId}`, {
      method: 'DELETE'
    }, true) // Use admin token
  }

  // Get revenue analytics
  async getRevenueAnalytics(params?: {
    period?: 'daily' | 'weekly' | 'monthly' | 'yearly'
    dateFrom?: string
    dateTo?: string
  }): Promise<ApiResponse<{
    totalRevenue: number
    periodRevenue: number
    growth: number
    chartData: Array<{ date: string; revenue: number }>
  }>> {
    const queryParams = new URLSearchParams()
    if (params?.period) queryParams.append('period', params.period)
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom)
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo)
    
    const endpoint = `/admin/analytics/revenue${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return this.request(endpoint, {}, true) // Use admin token
  }

  // Get booking analytics
  async getBookingAnalytics(params?: {
    period?: 'daily' | 'weekly' | 'monthly' | 'yearly'
    dateFrom?: string
    dateTo?: string
  }): Promise<ApiResponse<{
    totalBookings: number
    periodBookings: number
    growth: number
    chartData: Array<{ date: string; bookings: number }>
    categoryBreakdown: Array<{ type: ConsultantType; count: number; percentage: number }>
  }>> {
    const queryParams = new URLSearchParams()
    if (params?.period) queryParams.append('period', params.period)
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom)
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo)
    
    const endpoint = `/admin/analytics/bookings${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return this.request(endpoint, {}, true) // Use admin token
  }

  // Get user analytics
  async getUserAnalytics(): Promise<ApiResponse<{
    totalUsers: number
    newUsers: number
    activeUsers: number
    userGrowth: number
    chartData: Array<{ date: string; users: number }>
  }>> {
    return this.request('/admin/analytics/users', {}, true) // Use admin token
  }

  // Send notification to user
  async sendNotification(userId: number, notification: {
    title: string
    message: string
    type: 'info' | 'success' | 'warning' | 'error'
  }): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/admin/users/${userId}/notify`, {
      method: 'POST',
      body: JSON.stringify(notification)
    }, true) // Use admin token
  }

  // Get all users (admin)
  async getAllUsers(params?: {
    page?: number
    limit?: number
    search?: string
    sortBy?: 'name' | 'email' | 'createdAt'
    sortOrder?: 'asc' | 'desc'
  }): Promise<ApiResponse<{ users: Student[]; pagination?: { page: number; limit: number; total: number; totalPages: number } }>> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.search) queryParams.append('search', params.search)
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder)
    
    const endpoint = `/admin/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return this.request(endpoint, {}, true) // Use admin token
  }

  // Get user by ID (admin)
  async getUserById(userId: number): Promise<ApiResponse<{ user: Student; bookings: Booking[] }>> {
    return this.request(`/admin/users/${userId}`, {}, true) // Use admin token
  }

  // Update user (admin)
  async updateUser(userId: number, userData: {
    name?: string
    email?: string
    phone?: string
    isActive?: boolean
  }): Promise<ApiResponse<{ user: Student }>> {
    return this.request(`/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(userData)
    }, true) // Use admin token
  }

  // Delete user (admin)
  async deleteUser(userId: number): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/admin/users/${userId}`, {
      method: 'DELETE'
    }, true) // Use admin token
  }

  // Get payment history
  async getPaymentHistory(params?: {
    page?: number
    limit?: number
    status?: BookingStatus
    dateFrom?: string
    dateTo?: string
  }): Promise<ApiResponse<{ payments: Payment[]; pagination?: { page: number; limit: number; total: number; totalPages: number } }>> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.status) queryParams.append('status', params.status)
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom)
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo)
    
    const endpoint = `/admin/payments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return this.request(endpoint, {}, true) // Use admin token
  }

  // Get payment by ID
  async getPaymentById(paymentId: number): Promise<ApiResponse<{ payment: Payment; booking: Booking }>> {
    return this.request(`/admin/payments/${paymentId}`, {}, true) // Use admin token
  }

  // Refund payment
  async refundPayment(paymentId: number, reason: string): Promise<ApiResponse<{ message: string; refundId: string }>> {
    return this.request(`/admin/payments/${paymentId}/refund`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    }, true) // Use admin token
  }

  // Get system settings
  async getSystemSettings(): Promise<ApiResponse<{
    siteName: string
    siteDescription: string
    contactEmail: string
    contactPhone: string
    socialLinks: Record<string, string>
    maintenanceMode: boolean
    registrationEnabled: boolean
  }>> {
    return this.request('/admin/settings', {}, true) // Use admin token
  }

  // Update system settings
  async updateSystemSettings(settings: {
    siteName?: string
    siteDescription?: string
    contactEmail?: string
    contactPhone?: string
    socialLinks?: Record<string, string>
    maintenanceMode?: boolean
    registrationEnabled?: boolean
  }): Promise<ApiResponse<{ message: string }>> {
    return this.request('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    }, true) // Use admin token
  }

  // Get backup data
  async getBackupData(): Promise<ApiResponse<Blob>> {
    return this.request('/admin/backup', {}, true) // Use admin token
  }

  // Restore backup data
  async restoreBackupData(backupFile: File): Promise<ApiResponse<{ message: string }>> {
    const formData = new FormData()
    formData.append('backup', backupFile)
    
    return this.request('/admin/restore', {
      method: 'POST',
      body: formData,
      headers: {} // Let browser set Content-Type for FormData
    }, true) // Use admin token
  }

}

export const apiClient = new ApiClient()