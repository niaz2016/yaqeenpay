// src/services/authService.ts
import apiService from './api';
import type { LoginCredentials, RegisterCredentials, TokenResponse, User, OtpVerification, PasswordReset } from '../types/auth';

class AuthService {
  async login(credentials: LoginCredentials): Promise<User> {
    try {
      console.log('Login attempt with credentials:', { email: credentials.email, password: '***' });
      
      // Direct API call to avoid potential circular dependencies or issues
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://localhost:7137/api'}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      
      console.log('Login response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Login failed:', errorData);
        throw new Error(errorData.message || 'Login failed');
      }
      
      const responseData = await response.json();
      console.log('Login raw response data:', responseData);
      
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
      
      console.log('Extracted auth data:', authData);
      
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
      
      console.log('Mapped token response:', {
        ...tokenResponse,
        accessToken: tokenResponse.accessToken ? `${tokenResponse.accessToken.substring(0, 10)}...` : null,
        refreshToken: tokenResponse.refreshToken ? `${tokenResponse.refreshToken.substring(0, 10)}...` : null
      });
      
      // Explicitly set tokens in localStorage
      localStorage.setItem('access_token', token);
      console.log('Access token stored in localStorage:', token ? `${token.substring(0, 10)}...` : 'empty');
      
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
        console.log('Refresh token stored in localStorage');
      } else {
        console.warn('No refresh token available to store');
      }
      
      // Set expiry
      const expiryTime = tokenExpires 
        ? new Date(tokenExpires).getTime()
        : (Date.now() + (tokenResponse.expiresIn || 3600) * 1000);
        
      localStorage.setItem('token_expiry', expiryTime.toString());
      console.log('Token expiry set to:', new Date(expiryTime).toISOString());
      
      // Import token debug tools to verify token storage
      import('../debug/tokenRefresher').then(tools => {
        tools.processLoginResponse(responseData);
      }).catch(error => {
        console.error('Failed to import token debug tools:', error);
      });
      
      // Dispatch event to notify about token changes
      window.dispatchEvent(new CustomEvent('auth:tokens:updated'));
      
      // Fetch user profile after successful login
      console.log('Fetching user profile after login...');
      return this.getCurrentUser();
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
      console.log('Getting current user profile via apiService (axios)...');
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
    console.log('AuthService: Logging out user - client-side only (no API call)');
    
    // Clear tokens from localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expiry');
    
    // Notify components about logout
    window.dispatchEvent(new CustomEvent('auth:logout'));
    
    console.log('Logout completed - tokens cleared');
  }

  isAuthenticated(): boolean {
    return apiService.isAuthenticated();
  }
}

const authService = new AuthService();
export default authService;