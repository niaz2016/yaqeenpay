// src/services/api.ts
import axios from 'axios';
import type { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import type { TokenResponse } from '../types/auth';

// API base URL from environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7137/api';

class ApiService {
  private api: AxiosInstance;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      // Do not send cookies; we use Bearer tokens to avoid CORS credential constraints
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
          console.log(`Setting Authorization header for ${config.url}:`, `Bearer ${token.substring(0, 10)}...`);
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
        
        console.log(`API Error [${status}] for ${originalRequest.url}:`, error.message);
        
        // If error is 401 and not already retrying, attempt token refresh
        if (
          status === 401 &&
          !originalRequest._retry &&
          this.getRefreshToken()
        ) {
          console.log('Attempting to refresh token for 401 error');
          originalRequest._retry = true;

          try {
            // Handle concurrent refresh requests
            if (!this.refreshPromise) {
              this.refreshPromise = this.refreshAccessToken();
            }
            
            // Wait for the refresh to complete
            const newToken = await this.refreshPromise;
            console.log('Token refreshed successfully, retrying original request');
            
            // Reset for next refresh
            this.refreshPromise = null;
            
            // Update the failed request with new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              console.log('Updated Authorization header for retry');
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
        } else if (status === 401) {
          console.log('401 Unauthorized but not retrying:', 
            !originalRequest._retry ? 'already retried' : 'no refresh token available');
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

    // ApiResponse wrapper
    if (typeof data === 'object' && 'message' in data && data.message) {
      return String((data as any).message);
    }

    // ASP.NET ProblemDetails with validation errors
    if (typeof data === 'object' && data.errors && typeof data.errors === 'object') {
      const messages: string[] = [];
      for (const key of Object.keys(data.errors)) {
        const arr = data.errors[key];
        if (Array.isArray(arr)) messages.push(...arr);
      }
      if (messages.length) return messages.join('\n');
    }

    // Text response or unknown shape
    if (typeof data === 'string') return data;
    if (data?.title) return String(data.title);
    return axErr?.message || 'Request failed';
  }

  // Ensure Authorization header is present on the request if a token exists
  private withAuth<TConfig extends AxiosRequestConfig | undefined>(config?: TConfig): TConfig {
    const token = this.getAccessToken();
    if (!token) return (config as TConfig);

    const merged: AxiosRequestConfig = {
      ...(config || {}),
      headers: {
        ...(config?.headers as any),
        Authorization: (config?.headers as any)?.Authorization || `Bearer ${token}`,
      },
    };
    return merged as TConfig;
  }

  // Token management methods
  private getAccessToken(): string | null {
    // Try to get token with different possible keys
    const token = localStorage.getItem('access_token') || localStorage.getItem('token') || null;
    console.log('getAccessToken() returned:', token ? `${token.substring(0, 10)}...` : 'null');
    return token;
  }

  private getRefreshToken(): string | null {
    const refreshToken = localStorage.getItem('refresh_token') || localStorage.getItem('refreshToken') || null;
    console.log('getRefreshToken() returned:', refreshToken ? `${refreshToken.substring(0, 10)}...` : 'null');
    return refreshToken;
  }

  private setTokens(tokenResponse: TokenResponse): void {
    // Store tokens in localStorage
    if (tokenResponse.accessToken || tokenResponse.token) {
      const token = tokenResponse.accessToken || tokenResponse.token || '';
      localStorage.setItem('access_token', token);
      console.log('Token stored in localStorage:', token ? `${token.substring(0, 10)}...` : 'empty string');
    }
    
    if (tokenResponse.refreshToken) {
      localStorage.setItem('refresh_token', tokenResponse.refreshToken);
      console.log('Refresh token stored:', tokenResponse.refreshToken ? `${tokenResponse.refreshToken.substring(0, 10)}...` : 'empty string');
    }
    
    // Calculate and store expiry
    const expiryTime = tokenResponse.tokenExpires 
      ? new Date(tokenResponse.tokenExpires).getTime()
      : (Date.now() + (tokenResponse.expiresIn || 3600) * 1000);
      
    localStorage.setItem('token_expiry', expiryTime.toString());
    console.log('Token expiry set to:', new Date(expiryTime).toISOString());
    
    console.log('Tokens set:', {
      accessToken: tokenResponse.accessToken || tokenResponse.token ? 
        `${(tokenResponse.accessToken || tokenResponse.token || '').substring(0, 10)}...` : 'not set',
      refreshToken: '***',
      expires: new Date(parseInt(localStorage.getItem('token_expiry') || '0')).toISOString()
    });
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
      console.log('Attempting to refresh token');
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      console.log('Calling refresh-token endpoint');
      const response = await axios.post<any>(
        `${API_BASE_URL}/auth/refresh-token`,
        { refreshToken: refreshToken }  // Match the property name expected by backend
      );
      
      console.log('Refresh token response:', response.data);
      
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
      console.log(`GET ${url} response:`, response);
      
      // Handle ApiResponse wrapper if present
      if (response.data && typeof response.data === 'object' && 'success' in response.data) {
        if (response.data.success) {
          return response.data.data;
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
      const response = await this.api.post<any>(url, data, this.withAuth(config));
      console.log(`POST ${url} response:`, response);
      
      // Handle ApiResponse wrapper if present
      if (response.data && typeof response.data === 'object' && 'success' in response.data) {
        if (response.data.success) {
          return response.data.data;
        } else {
          throw new Error(response.data.message || 'API error');
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
      const response = await this.api.put<any>(url, data, this.withAuth(config));
      console.log(`PUT ${url} response:`, response);
      
      // Handle ApiResponse wrapper if present
      if (response.data && typeof response.data === 'object' && 'success' in response.data) {
        if (response.data.success) {
          return response.data.data;
        } else {
          throw new Error(response.data.message || 'API error');
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
      console.log(`DELETE ${url} response:`, response);
      
      // Handle ApiResponse wrapper if present
      if (response.data && typeof response.data === 'object' && 'success' in response.data) {
        if (response.data.success) {
          return response.data.data;
        } else {
          throw new Error(response.data.message || 'API error');
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
    console.log('ApiService: Clearing tokens only (no API call)');
    this.clearTokens();
  }

  public isAuthenticated(): boolean {
    const token = this.getAccessToken();
    const expiry = localStorage.getItem('token_expiry');
    
    if (!token) {
      console.log('Authentication check failed: No token found');
      return false;
    }
    
    if (!expiry) {
      console.log('Authentication check failed: No token expiry found');
      return false;
    }
    
    // Check if token is expired
    const isExpired = Date.now() >= parseInt(expiry, 10);
    
    if (isExpired) {
      console.log('Authentication check failed: Token is expired');
      // Consider clearing tokens here to prevent using expired tokens
      return false;
    }
    
    console.log('Authentication check passed: Valid token found');
    return true;
  }
}

// Create a singleton instance
const apiService = new ApiService();
export default apiService;