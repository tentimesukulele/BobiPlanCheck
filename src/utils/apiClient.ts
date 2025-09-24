import API_CONFIG, { ApiResponse, ApiError } from '../config/api';
import { UserService } from '../services/UserService';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retry?: number;
}

interface ApiClientOptions {
  baseURL?: string;
  timeout?: number;
  defaultHeaders?: Record<string, string>;
  currentUserId?: number;
}

class ApiClient {
  private baseURL: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;
  private currentUserId?: number;

  constructor(options: ApiClientOptions = {}) {
    this.baseURL = options.baseURL || API_CONFIG.BASE_URL;
    this.timeout = options.timeout || API_CONFIG.TIMEOUT;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...options.defaultHeaders,
    };
    this.currentUserId = options.currentUserId;
  }

  // Set current user ID for requests
  setCurrentUserId(userId: number) {
    this.currentUserId = userId;
  }

  // Get current user ID
  getCurrentUserId(): number | undefined {
    return this.currentUserId;
  }

  // Make HTTP request with timeout and retry logic
  private async makeRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.timeout,
      retry = 0
    } = options;

    const url = `${this.baseURL}${endpoint}`;

    // Prepare headers
    const requestHeaders = {
      ...this.defaultHeaders,
      ...headers,
    };

      // Add current user ID to headers if available
    if (this.currentUserId) {
      requestHeaders['x-family-member-id'] = this.currentUserId.toString();
    } else {
      // Try to get user ID from UserService if not set
      try {
        const userId = await UserService.getCurrentUserId();
        if (userId) {
          this.currentUserId = userId;
          requestHeaders['x-family-member-id'] = userId.toString();
          console.log('🔧 Auto-loaded user ID from storage:', userId);
        }
      } catch (error) {
        console.warn('Could not load user ID from storage:', error);
      }
    }

    // Prepare request config
    const requestConfig: RequestInit = {
      method,
      headers: requestHeaders,
    };

    // Add body for non-GET requests
    if (body && method !== 'GET') {
      requestConfig.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      requestConfig.signal = controller.signal;

      console.log(`🌐 API ${method} ${url}`, {
        headers: requestHeaders,
        body: body && method !== 'GET' ? body : undefined,
      });

      const response = await fetch(url, requestConfig);
      clearTimeout(timeoutId);

      // Parse response
      let responseData: any;
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      console.log(`📨 API Response ${response.status}`, responseData);

      // Handle non-2xx responses
      if (!response.ok) {
        const errorMessage = responseData?.error || responseData?.message || `HTTP ${response.status}`;
        throw new ApiError(errorMessage, response.status, responseData?.details);
      }

      return responseData;
    } catch (error) {
      console.error(`❌ API Error ${method} ${url}:`, error);

      // Handle network errors with retry logic
      if (
        (error instanceof TypeError && error.message.includes('network')) ||
        error.name === 'AbortError' ||
        error.message.includes('timeout')
      ) {
        if (retry < API_CONFIG.RETRY_ATTEMPTS) {
          console.log(`🔄 Retrying request (${retry + 1}/${API_CONFIG.RETRY_ATTEMPTS})`);
          return this.makeRequest(endpoint, { ...options, retry: retry + 1 });
        }
      }

      // Re-throw ApiError as-is
      if (error instanceof ApiError) {
        throw error;
      }

      // Wrap other errors
      throw new ApiError(
        error instanceof Error ? error.message : 'Network request failed',
        undefined,
        error
      );
    }
  }

  // GET request
  async get<T>(endpoint: string, options: Omit<RequestOptions, 'method'> = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, body?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'POST', body });
  }

  // PUT request
  async put<T>(endpoint: string, body?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'PUT', body });
  }

  // DELETE request
  async delete<T>(endpoint: string, options: Omit<RequestOptions, 'method'> = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'DELETE' });
  }

  // PATCH request
  async patch<T>(endpoint: string, body?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  // Helper method for query parameters
  buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(item => searchParams.append(key, item.toString()));
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get('/health');
      return response.success !== false;
    } catch {
      return false;
    }
  }

  // Update base URL (useful for switching environments)
  updateBaseURL(newBaseURL: string) {
    this.baseURL = newBaseURL;
  }

  // Get current configuration
  getConfig() {
    return {
      baseURL: this.baseURL,
      timeout: this.timeout,
      defaultHeaders: this.defaultHeaders,
      currentUserId: this.currentUserId,
    };
  }
}

// Create and export singleton instance
const apiClient = new ApiClient();

export default apiClient;
export { ApiClient, ApiError };
export type { ApiResponse, RequestOptions, ApiClientOptions };