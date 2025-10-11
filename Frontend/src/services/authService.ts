// src/services/authService.ts
import apiService from './api';
import notificationTrigger from './notificationTrigger';
import type { LoginCredentials, RegisterCredentials, TokenResponse, User, OtpVerification, PasswordReset } from '../types/auth';

class AuthService {
  async login(credentials: LoginCredentials): Promise<User> {
    try {
      
      // Direct API call to avoid potential circular dependencies or issues
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://localhost:7137/api'}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Login failed:', errorData);
        throw new Error(errorData.message || 'Login failed');
      }
      
      const responseData = await response.json();
      
      // Extract data from ApiResponse wrapper
      let authData;
      if (responseData.success && responseData.data) {
        // Backend returns ApiResponse<AuthenticationResponse>
        authData = responseData.data;
      } else if (responseData.token || responseData.Token) {
        // Direct response format
        authData = responseData;
      } else {
        console.error('No authentication data found in response:', responseData);
        throw new Error('Invalid response: No authentication token received');
      }
      
      
      // Handle both camelCase and PascalCase property names from backend
      const token = authData.token || authData.Token;
      const refreshToken = authData.refreshToken || authData.RefreshToken;
      const tokenExpires = authData.tokenExpires || authData.TokenExpires;
      const userId = authData.userId || authData.UserId;
      const email = authData.email || authData.Email;
      const userName = authData.userName || authData.UserName;
      
      if (!token) {
        console.error('No token found in auth data:', authData);
        throw new Error('Invalid response: No authentication token received');
      }
      
      // Map to expected token format
      const tokenResponse: TokenResponse = {
        accessToken: token,
        refreshToken: refreshToken || '',
        expiresIn: tokenExpires 
          ? Math.floor((new Date(tokenExpires).getTime() - Date.now()) / 1000)
          : 3600,
        // Include original fields for backward compatibility
        token: token,
        tokenExpires: tokenExpires,
        userId: userId,
        email: email,
        userName: userName
      };

      
      // Explicitly set tokens in localStorage
      localStorage.setItem('access_token', token);
      
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      } else {
        console.warn('No refresh token available to store');
      }
      
      // Set expiry
      const expiryTime = tokenExpires 
        ? new Date(tokenExpires).getTime()
        : (Date.now() + (tokenResponse.expiresIn || 3600) * 1000);
        
      localStorage.setItem('token_expiry', expiryTime.toString());
      
      // Token debug tools import removed due to missing module
      // If needed, implement token processing here or ensure the module exists.
      
      // Dispatch event to notify about token changes
      window.dispatchEvent(new CustomEvent('auth:tokens:updated'));
      
      // Fetch user profile after successful login
      const user = await this.getCurrentUser();
      
      // Trigger login notification
      try {
        await notificationTrigger.onLoginSuccess({
          location: 'Unknown location', // Could be enhanced with IP geolocation
          device: navigator.userAgent,
          timestamp: new Date().toISOString()
        }, user.id);
      } catch (error) {
        console.warn('Failed to trigger login notification:', error);
      }

      // Notify other parts of the app about login (used by NotificationContext to auto-refresh)
      window.dispatchEvent(new CustomEvent('auth:login'));
      
      return user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(credentials: RegisterCredentials): Promise<void> {
    // Backend requires 'UserName'; map from email if not provided
    const payload = {
      email: credentials.email,
      userName: credentials.userName || credentials.email,
      password: credentials.password,
      confirmPassword: credentials.confirmPassword,
      firstName: credentials.firstName,
      lastName: credentials.lastName,
      phoneNumber: credentials.phoneNumber,
      role: credentials.role || 'buyer',
      ...(credentials.businessInfo && { businessInfo: credentials.businessInfo })
    };
    await apiService.post<{ message: string }>('/auth/register', payload);
    // Registration typically requires email/phone verification before login
  }

  async verifyOtp(verification: OtpVerification): Promise<{ success: boolean }> {
    return apiService.post<{ success: boolean }>('/auth/verify-otp', verification);
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    return apiService.post<{ message: string }>('/auth/forgot-password', { email });
  }

  async resetPassword(resetData: PasswordReset): Promise<{ success: boolean }> {
    return apiService.post<{ success: boolean }>('/auth/reset-password', resetData);
  }

  async getCurrentUser(): Promise<User> {
    try {
      // Use axios instance so Authorization header is auto-attached via interceptor
      const userData = await apiService.get<any>('/profile');

      if (!userData || !userData.id) {
        console.error('Invalid user data received:', userData);
        throw new Error('Invalid user data received');
      }

      return {
        id: userData.id,
        email: userData.email,
        phoneNumber: userData.phoneNumber,
        firstName: userData.firstName,
        lastName: userData.lastName,
        profileImageUrl: userData.profileImageUrl,
        dateOfBirth: userData.dateOfBirth,
        gender: userData.gender,
        address: userData.address,
        city: userData.city,
        state: userData.state,
        country: userData.country,
        postalCode: userData.postalCode,
        isEmailVerified: userData.isEmailVerified,
        isPhoneVerified: userData.isPhoneVerified,
        kycStatus: userData.kycStatus,
        profileCompleteness: userData.profileCompleteness,
        roles: userData.roles,
        created: userData.created
      };
    } catch (error: any) {
      // Axios error handling: check status
      const status = error?.response?.status;
      if (status === 401) {
        console.error('Unauthorized access to profile (axios). Clearing tokens.');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('token_expiry');
        throw new Error('Unauthorized: Please login again');
      }
      console.error('Error getting current user profile (axios):', error);
      throw error;
    }
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<{ success: boolean }> {
    return apiService.post<{ success: boolean }>('/auth/change-password', {
      oldPassword,
      newPassword,
    });
  }

  logout(): void {
    // Clear tokens and state without calling the backend
    // Note: Backend doesn't have a /auth/logout endpoint currently
    
    // Clear tokens from localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expiry');
    
    // Notify components about logout
    window.dispatchEvent(new CustomEvent('auth:logout'));
    
  }

  isAuthenticated(): boolean {
    return apiService.isAuthenticated();
  }
}

const authService = new AuthService();
export default authService;