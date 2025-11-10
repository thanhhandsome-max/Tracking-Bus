import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

if (!process.env.NEXT_PUBLIC_API_BASE && !process.env.NEXT_PUBLIC_API_URL) {
  console.warn('⚠️ NEXT_PUBLIC_API_BASE not set, using default:', API_BASE);
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Request interceptor: add token
    this.client.interceptors.request.use(
      (config) => {
        if (typeof window !== 'undefined') {
          // Luôn lấy token mới nhất từ localStorage trong mỗi request
          const storedToken = localStorage.getItem('ssb_token') || localStorage.getItem('token');
          if (storedToken) {
            this.token = storedToken;
            config.headers.Authorization = `Bearer ${storedToken}`;
          } else if (this.token) {
            // Nếu không có trong localStorage nhưng có trong memory, vẫn dùng
            config.headers.Authorization = `Bearer ${this.token}`;
          }
        } else if (this.token) {
          // Server-side: dùng token trong memory
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor: handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401 && typeof window !== 'undefined') {
          // Kiểm tra lại token trước khi refresh
          const currentToken = localStorage.getItem('ssb_token') || localStorage.getItem('token');
          if (!currentToken && this.token) {
            // Token có trong memory nhưng không có trong localStorage, thử lại với token trong memory
            if (error.config) {
              error.config.headers.Authorization = `Bearer ${this.token}`;
              try {
                return await this.client.request(error.config);
              } catch (retryError) {
                // Nếu vẫn lỗi, tiếp tục refresh
              }
            }
          }

          const refreshToken = localStorage.getItem('ssb_refresh_token');
          if (refreshToken && !this.isRefreshing) {
            try {
              this.isRefreshing = true;
              const refreshResponse = await axios.post(`${baseURL}/auth/refresh`, {}, {
                headers: { Authorization: `Bearer ${refreshToken}` },
              });
              const newToken = refreshResponse.data?.data?.token || refreshResponse.data?.token;
              if (newToken) {
                this.setToken(newToken);
                // Retry original request
                if (error.config) {
                  error.config.headers.Authorization = `Bearer ${newToken}`;
                  return this.client.request(error.config);
                }
              }
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError);
              this.clearToken();
              // Chỉ redirect nếu không phải đang ở trang login
              if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                window.location.href = '/login';
              }
            } finally {
              this.isRefreshing = false;
            }
          } else if (!refreshToken) {
            // Không có refresh token, redirect về login
            console.warn('No refresh token available, redirecting to login');
            this.clearToken();
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
              window.location.href = '/login';
            }
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private isRefreshing = false;

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('ssb_token', token);
      localStorage.setItem('token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ssb_token');
      localStorage.removeItem('token');
      localStorage.removeItem('ssb_refresh_token');
    }
  }

  // Generic request method
  async request<T>(config: {
    method: 'get' | 'post' | 'put' | 'patch' | 'delete';
    url: string;
    data?: any;
    params?: any;
    signal?: AbortSignal;
  }): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.request<ApiResponse<T>>({
        method: config.method,
        url: config.url,
        data: config.data,
        params: config.params,
        signal: config.signal,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiResponse>;
        if (axiosError.response?.data) {
          return axiosError.response.data;
        }
        throw new Error(axiosError.message || 'API request failed');
      }
      throw error;
    }
  }

  // Routes
  async getRoutes(params?: { page?: number; limit?: number; search?: string; trangThai?: boolean }) {
    return this.request({ method: 'get', url: '/routes', params });
  }

  async getRouteById(id: string | number, signal?: AbortSignal) {
    return this.request({ method: 'get', url: `/routes/${id}`, signal });
  }

  async createRoute(data: any) {
    return this.request({ method: 'post', url: '/routes', data });
  }

  async updateRoute(id: string | number, data: any) {
    return this.request({ method: 'put', url: `/routes/${id}`, data });
  }

  async deleteRoute(id: string | number) {
    return this.request({ method: 'delete', url: `/routes/${id}` });
  }

  async getRouteStops(routeId: string | number, signal?: AbortSignal) {
    return this.request({ method: 'get', url: `/routes/${routeId}/stops`, signal });
  }

  async addStopToRoute(routeId: string | number, data: {
    stop_id?: number;
    sequence?: number;
    dwell_seconds?: number;
    tenDiem?: string;
    viDo?: number;
    kinhDo?: number;
    address?: string;
    scheduled_time?: string;
  }) {
    return this.request({ method: 'post', url: `/routes/${routeId}/stops`, data });
  }

  async reorderStops(routeId: string | number, items: Array<{ stop_id: number; sequence: number }>) {
    return this.request({ method: 'patch', url: `/routes/${routeId}/stops/reorder`, data: { items } });
  }

  async removeStopFromRoute(routeId: string | number, stopId: number) {
    return this.request({ method: 'delete', url: `/routes/${routeId}/stops/${stopId}` });
  }

  

  // Stops
  async getStops(params?: { page?: number; limit?: number; search?: string }) {
    return this.request({ method: 'get', url: '/stops', params });
  }

  async createStop(data: { tenDiem: string; viDo?: number; kinhDo?: number; address?: string; scheduled_time?: string }) {
    return this.request({ method: 'post', url: '/stops', data });
  }

  async updateStop(id: number, data: Partial<{ tenDiem: string; viDo: number; kinhDo: number; address: string; scheduled_time: string }>) {
    return this.request({ method: 'put', url: `/stops/${id}`, data });
  }

  async deleteStop(id: number) {
    return this.request({ method: 'delete', url: `/stops/${id}` });
  }

  async addRouteStop(routeId: number | string, data: any) {
    return this.request({ method: 'post', url: `/routes/${routeId}/stops`, data });
  }

  async rebuildPolyline(routeId: number | string) {
    return this.request({ method: 'post', url: `/routes/${routeId}/rebuild-polyline` });
  }

  // Maps (via backend proxy)
  async getDirections(data: {
    origin: string;
    destination: string;
    waypoints?: Array<{ location: string }>;
    mode?: string;
    language?: string;
    units?: string;
  }) {
    return this.request({ method: 'post', url: '/maps/directions', data });
  }

  async getDistanceMatrix(data: {
    origins: string[];
    destinations: string[];
    mode?: string;
    language?: string;
    units?: string;
  }) {
    return this.request({ method: 'post', url: '/maps/distance-matrix', data });
  }

  async geocode(data: { address: string; language?: string }) {
    return this.request({ method: 'post', url: '/maps/geocode', data });
  }

  async reverseGeocode(data: { latlng: string; language?: string }) {
    return this.request({ method: 'post', url: '/maps/reverse-geocode', data });
  }

  async snapToRoads(data: { path: Array<{ lat: number; lng: number }>; interpolate?: boolean }) {
    return this.request({ method: 'post', url: '/maps/roads/snap', data });
  }
}

export const apiClient = new ApiClient(API_BASE);
export default apiClient;

