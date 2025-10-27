/**
 * API Client for SSB Frontend
 * Handles all REST API calls with interceptors, error handling, and authentication
 */

interface ApiResponse<T = any> {
  data: T
  message?: string
  success: boolean
}

interface ApiError {
  message: string
  status: number
  code?: string
}

class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor() {
    // Use API v1 by default to match backend routes
    // Default to port 4000 if backend env sets PORT=4000 during dev
    this.baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1'
    
    // Get token from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('ssb_token')
    }
  }

  /**
   * Set authentication token
   */
  setToken(token: string | null) {
    this.token = token
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('ssb_token', token)
      } else {
        localStorage.removeItem('ssb_token')
      }
    }
  }

  /**
   * Get authentication headers
   */
  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    return headers
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): ApiError {
    if (error.response) {
      // Server responded with error status
      return {
        message: error.response.data?.message || 'Server error',
        status: error.response.status,
        code: error.response.data?.code,
      }
    } else if (error.request) {
      // Network error
      return {
        message: 'Network error - please check your connection',
        status: 0,
        code: 'NETWORK_ERROR',
      }
    } else {
      // Other error
      return {
        message: error.message || 'Unknown error occurred',
        status: 0,
        code: 'UNKNOWN_ERROR',
      }
    }
  }

  /**
   * Make HTTP request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    }

    try {
      const response = await fetch(url, config)
      
      // Handle HTTP errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw {
          response: {
            data: errorData,
            status: response.status,
          },
        }
      }

      const data = await response.json()
      return data
    } catch (error) {
      const apiError = this.handleError(error)
      throw apiError
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }
}

// Create singleton instance
export const api = new ApiClient()

// Export types
export type { ApiResponse, ApiError }
