// src/services/api.ts
import axios from 'axios';
import type { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import type { TokenResponse } from '../types/auth';

// API base URL from environment.
// Default to '/api' so that when the app is served behind Nginx (same origin),
// requests are proxied to the backend container via the /api location block.
// You can override at build time with VITE_API_URL, e.g. VITE_API_URL=https://staging.example.com/api
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiService {
  private api: AxiosInstance;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      // Remove global Content-Type so FormData can set multipart automatically
      headers: {
        // Intentionally left blank; will set per request
      },
      withCredentials: false,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token) {
          // Ensure headers object exists and set Authorization in a type-safe way
          if (!config.headers) {
            config.headers = {} as any;
          }

          const headersAny = config.headers as any;
          if (typeof headersAny.set === 'function') {
            // AxiosHeaders instance
            headersAny.set('Authorization', `Bearer ${token}`);
          } else {
            headersAny['Authorization'] = `Bearer ${token}`;
          }
        } else {
          console.warn(`No token available for request to ${config.url}`);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
        const status = error.response?.status;
                
        // If error is 401 and not already retrying, attempt token refresh
        if (
          status === 401 &&
          !originalRequest._retry &&
          this.getRefreshToken()
        ) {
          originalRequest._retry = true;

          try {
            // Handle concurrent refresh requests
            if (!this.refreshPromise) {
              this.refreshPromise = this.refreshAccessToken();
            }
            
            // Wait for the refresh to complete
            const newToken = await this.refreshPromise;
            
            // Reset for next refresh
            this.refreshPromise = null;
            
            // Update the failed request with new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            
            // Retry the original request
            return this.api(originalRequest);
          } catch (refreshError) {
            // If refresh fails, clear tokens and reject
            console.error('Token refresh failed, clearing tokens:', refreshError);
            this.clearTokens();
            this.refreshPromise = null;
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Extract a meaningful error message from Axios/ASP.NET responses
  private extractErrorMessage(error: any): string {
    const axErr = error as AxiosError<any>;
    const data = axErr?.response?.data;
    if (!data) return axErr?.message || 'Request failed';

    // ApiResponse wrapper with Message or Errors array
    if (typeof data === 'object') {
      // Check for Message field first
      if ('Message' in data && data.Message) {
        return String(data.Message);
      }
      if ('message' in data && data.message) {
        return String(data.message);
      }
      
      // Check for Errors array (backend stack traces or error details)
      if ('Errors' in data && Array.isArray(data.Errors) && data.Errors.length > 0) {
        // Filter out stack trace lines and get meaningful error messages
        const meaningfulErrors = data.Errors
          .map((err: any) => typeof err === 'string' ? err.trim() : String(err))
          .filter((err: string) => 
            err && 
            !err.startsWith('at ') && 
            !err.includes('YaqeenPay.') &&
            !err.includes('.cs:line')
          );
        if (meaningfulErrors.length > 0) {
          return meaningfulErrors.join('\n');
        }
      }
      if ('errors' in data && Array.isArray(data.errors) && data.errors.length > 0) {
        const meaningfulErrors = data.errors
          .map((err: any) => typeof err === 'string' ? err.trim() : String(err))
          .filter((err: string) => 
            err && 
            !err.startsWith('at ') && 
            !err.includes('YaqeenPay.') &&
            !err.includes('.cs:line')
          );
        if (meaningfulErrors.length > 0) {
          return meaningfulErrors.join('\n');
        }
      }

      // ASP.NET ProblemDetails with validation errors object
      if ('errors' in data && typeof data.errors === 'object' && !Array.isArray(data.errors)) {
        const messages: string[] = [];
        for (const key of Object.keys(data.errors)) {
          const arr = data.errors[key];
          if (Array.isArray(arr)) messages.push(...arr);
        }
        if (messages.length) return messages.join('\n');
      }
    }

    // Text response or unknown shape
    if (typeof data === 'string') return data;
    if (data?.title) return String(data.title);
    return axErr?.message || 'Request failed';
  }

  // Ensure Authorization header is present on the request if a token exists
  private withAuth<TConfig extends AxiosRequestConfig | undefined>(config?: TConfig): AxiosRequestConfig {
    const token = this.getAccessToken();
    const baseConfig: AxiosRequestConfig = config || {};
    
    if (!token) return baseConfig;

    return {
      ...baseConfig,
      headers: {
        ...(baseConfig.headers as any),
        Authorization: (baseConfig.headers as any)?.Authorization || `Bearer ${token}`,
      },
    };
  }

  // Token management methods
  private getAccessToken(): string | null {
    // Try to get token with different possible keys
    const token = localStorage.getItem('access_token') || localStorage.getItem('token') || null;
    return token;
  }

  private getRefreshToken(): string | null {
    const refreshToken = localStorage.getItem('refresh_token') || localStorage.getItem('refreshToken') || null;
    return refreshToken;
  }

  private setTokens(tokenResponse: TokenResponse): void {
    // Store tokens in localStorage
    if (tokenResponse.accessToken || tokenResponse.token) {
      const token = tokenResponse.accessToken || tokenResponse.token || '';
      localStorage.setItem('access_token', token);
    }
    
    if (tokenResponse.refreshToken) {
      localStorage.setItem('refresh_token', tokenResponse.refreshToken);
    }
    
    // Calculate and store expiry
    const expiryTime = tokenResponse.tokenExpires 
      ? new Date(tokenResponse.tokenExpires).getTime()
      : (Date.now() + (tokenResponse.expiresIn || 3600) * 1000);
      
    localStorage.setItem('token_expiry', expiryTime.toString());
    
  }

  private clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expiry');
    // Dispatch logout event for the auth context to handle
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }

  private async refreshAccessToken(): Promise<string> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post<any>(
        `${API_BASE_URL}/auth/refresh-token`,
        { refreshToken: refreshToken }  // Match the property name expected by backend
      );
            
      // Handle ApiResponse wrapper
      const responseData = response.data?.success ? response.data.data : response.data;
      
      // Create a TokenResponse object with the appropriate fields
      const tokenResponse: TokenResponse = {
        accessToken: responseData.token || responseData.accessToken || '',
        refreshToken: responseData.refreshToken || '',
        expiresIn: responseData.tokenExpires 
          ? Math.floor((new Date(responseData.tokenExpires).getTime() - Date.now()) / 1000)
          : 3600,
        // Include original fields
        token: responseData.token,
        tokenExpires: responseData.tokenExpires,
        userId: responseData.userId,
        email: responseData.email,
        userName: responseData.userName
      };

      this.setTokens(tokenResponse);
      return tokenResponse.accessToken || tokenResponse.token || '';
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearTokens();
      throw error;
    }
  }

  // Public API methods
  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.api.get<any>(url, this.withAuth(config));
      
      // Handle ApiResponse wrapper if present
      if (response.data && typeof response.data === 'object' && 'success' in response.data) {
        if (response.data.success) {
          // Some backend endpoints return the payload directly under root (with success/message)
          // and don't include a `data` property. In that case, return the whole response.data.
          return (response.data.data !== undefined && response.data.data !== null) ? response.data.data : response.data;
        } else {
          throw new Error(response.data.message || 'API error');
        }
      }
      
      return response.data;
    } catch (error) {
      const message = this.extractErrorMessage(error);
      console.error(`GET ${url} error:`, message, error);
      throw new Error(message);
    }
  }

  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
      const cfg = this.withAuth(config) || {};
      if (isFormData) {
        if (cfg && cfg.headers) {
          const headersAny = cfg.headers as any;
          delete headersAny['Content-Type'];
          delete headersAny['content-type'];
        }
      } else {
        // Ensure JSON header only for non-FormData
        cfg.headers = { ...(cfg.headers || {}), 'Content-Type': 'application/json' };
      }
      const response = await this.api.post<any>(url, data, cfg);
      
      // Handle ApiResponse wrapper if present
      if (response.data && typeof response.data === 'object' && 'success' in response.data) {
        if (response.data.success) {
          return (response.data.data !== undefined && response.data.data !== null) ? response.data.data : response.data;
        } else {
          // Include detailed errors from the response
          let errorMessage = response.data.message || 'API error';
          if (response.data.errors && Array.isArray(response.data.errors) && response.data.errors.length > 0) {
            errorMessage = response.data.errors.join('\n');
          }
          throw new Error(errorMessage);
        }
      }
      
      return response.data;
    } catch (error) {
      const message = this.extractErrorMessage(error);
      console.error(`POST ${url} error:`, message, error);
      throw new Error(message);
    }
  }

  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const cfg = this.withAuth(config);
      if (data instanceof FormData) {
        if (cfg && cfg.headers) {
          const headersAny = cfg.headers as any;
          delete headersAny['Content-Type'];
          delete headersAny['content-type'];
        }
      }

      const response = await this.api.put<any>(url, data, cfg);
      
      // Handle ApiResponse wrapper if present
      if (response.data && typeof response.data === 'object' && 'success' in response.data) {
        if (response.data.success) {
          return (response.data.data !== undefined && response.data.data !== null) ? response.data.data : response.data;
        } else {
          // Include detailed errors from the response
          let errorMessage = response.data.message || 'API error';
          if (response.data.errors && Array.isArray(response.data.errors) && response.data.errors.length > 0) {
            errorMessage = response.data.errors.join('\n');
          }
          throw new Error(errorMessage);
        }
      }
      
      return response.data;
    } catch (error) {
      const message = this.extractErrorMessage(error);
      console.error(`PUT ${url} error:`, message, error);
      throw new Error(message);
    }
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.api.delete<any>(url, this.withAuth(config));
      
      // Handle ApiResponse wrapper if present
      if (response.data && typeof response.data === 'object' && 'success' in response.data) {
        if (response.data.success) {
          return (response.data.data !== undefined && response.data.data !== null) ? response.data.data : response.data;
        } else {
          // Include detailed errors from the response
          let errorMessage = response.data.message || 'API error';
          if (response.data.errors && Array.isArray(response.data.errors) && response.data.errors.length > 0) {
            errorMessage = response.data.errors.join('\n');
          }
          throw new Error(errorMessage);
        }
      }
      
      return response.data;
    } catch (error) {
      const message = this.extractErrorMessage(error);
      console.error(`DELETE ${url} error:`, message, error);
      throw new Error(message);
    }
  }

  // Authentication specific methods
  public setAuthTokens(tokenResponse: TokenResponse): void {
    this.setTokens(tokenResponse);
  }

  public logout(): void {
    this.clearTokens();
  }

  public isAuthenticated(): boolean {
    const token = this.getAccessToken();
    const expiry = localStorage.getItem('token_expiry');
    
    if (!token) {
      return false;
    }
    
    if (!expiry) {
      return false;
    }
    
    // Check if token is expired
    const isExpired = Date.now() >= parseInt(expiry, 10);
    
    if (isExpired) {
      // Consider clearing tokens here to prevent using expired tokens
      return false;
    }
    
    return true;
  }
}

// Create a singleton instance
const apiService = new ApiService();
export default apiService;