// src/services/authService.ts
import apiService from './api';
import notificationTrigger from './notificationTrigger';
import type { LoginCredentials, RegisterCredentials, TokenResponse, User, OtpVerification, PasswordReset } from '../types/auth';

class AuthService {
  private extractAuthPayload(responseData: any): { authData: any; message?: string } {
    if (!responseData) {
      throw new Error('Invalid response from server');
    }

    if (responseData.success === false) {
      const errors = Array.isArray(responseData.errors) ? responseData.errors.filter(Boolean) : [];
      const segments = [responseData.message, ...errors];
      const message = segments.filter(Boolean).join(': ') || 'Authentication failed';
      throw new Error(message);
    }

    if (responseData.success && responseData.data) {
      return { authData: responseData.data, message: responseData.message }; 
    }

    if (responseData.token || responseData.Token) {
      return { authData: responseData, message: responseData.message };
    }

    console.error('No authentication data found in response:', responseData);
    throw new Error('Invalid response: No authentication token received');
  }

  private async finalizeLogin(authData: any): Promise<User> {
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

    const tokenResponse: TokenResponse = {
      accessToken: token,
      refreshToken: refreshToken || '',
      expiresIn: tokenExpires
        ? Math.floor((new Date(tokenExpires).getTime() - Date.now()) / 1000)
        : 3600,
      token,
      tokenExpires,
      userId,
      email,
      userName
    };

    localStorage.setItem('access_token', token);

    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    } else {
      console.warn('No refresh token available to store');
    }

    const expiryTime = tokenExpires
      ? new Date(tokenExpires).getTime()
      : (Date.now() + (tokenResponse.expiresIn || 3600) * 1000);

    localStorage.setItem('token_expiry', expiryTime.toString());

    window.dispatchEvent(new CustomEvent('auth:tokens:updated'));

    const user = await this.getCurrentUser();

    try {
      await notificationTrigger.onLoginSuccess({
        location: 'Unknown location',
        device: navigator.userAgent,
        timestamp: new Date().toISOString()
      }, user.id);
    } catch (error) {
      console.warn('Failed to trigger login notification:', error);
    }

    window.dispatchEvent(new CustomEvent('auth:login'));

    return user;
  }

  async login(credentials: LoginCredentials, deviceLocation?: string, coordinates?: { latitude: number; longitude: number }, captchaToken?: string): Promise<User> {
    try {
      
      // Prepare login payload with optional location data and CAPTCHA token
      const loginPayload = {
        ...credentials,
        ...(deviceLocation && { deviceLocation }),
        ...(coordinates && { 
          latitude: coordinates.latitude, 
          longitude: coordinates.longitude 
        }),
        ...(captchaToken && { captchaToken })
      };
      
      // Direct API call to avoid potential circular dependencies or issues
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://localhost:7137/api'}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginPayload),
      });
      
      
      const contentType = response.headers.get('content-type') || '';

      if (!response.ok) {
        let errorMessage = 'Login failed';

        if (contentType.includes('application/json')) {
          const errorData = await response.json().catch(() => null);
          console.error('Login failed:', errorData);
          if (errorData?.message) {
            errorMessage = errorData.message;
          }
        } else {
          const errorText = await response.text().catch(() => '');
          console.error('Login failed with non-JSON response:', errorText);
          if (errorText) {
            errorMessage = errorText.substring(0, 500);
          }
        }

        throw new Error(errorMessage);
      }

      let responseData: any = null;

      if (contentType.includes('application/json')) {
        responseData = await response.json().catch(() => null);
      } else {
        const responseText = await response.text().catch(() => '');
        console.error('Login response is not JSON:', responseText);
        throw new Error('Unexpected response format from server. Please try again later.');
      }

      if (!responseData) {
        throw new Error('Empty response received from server');
      }
      const { authData, message } = this.extractAuthPayload(responseData);

      const requiresDeviceVerification = authData.requiresDeviceVerification || authData.RequiresDeviceVerification;
      const pendingDeviceId = authData.pendingDeviceId || authData.PendingDeviceId;

      if (requiresDeviceVerification) {
        const error = new Error('Device verification required') as any;
        error.requiresDeviceVerification = true;
        error.userId = authData.userId || authData.UserId;
        error.deviceId = pendingDeviceId;
        error.message = message || 'New device detected. Please verify with OTP.';
        throw error;
      }

      return await this.finalizeLogin(authData);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(credentials: RegisterCredentials): Promise<string> {
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
    // apiService.post already unwraps the ApiResponse<T>, so we get the guid directly
    const userId = await apiService.post<string>('/auth/register', payload);
    // Return userId from response for email verification
    return userId;
  }

  async verifyOtp(verification: OtpVerification): Promise<{ success: boolean }> {
    return apiService.post<{ success: boolean }>('/auth/verify-otp', verification);
  }

  async verifyDevice(userId: string, deviceId: string, otp: string): Promise<User> {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://localhost:7137/api'}/auth/verify-device`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, deviceId, otp }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Device verification failed');
      }

      const responseData = await response.json();
      const { authData } = this.extractAuthPayload(responseData);

      return await this.finalizeLogin(authData);
    } catch (error) {
      console.error('Device verification error:', error);
      throw error;
    }
  }

  async loginWithGoogle(idToken: string): Promise<User> {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://localhost:7137/api'}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Google login failed:', errorData);
        throw new Error(errorData?.message || 'Google sign-in failed');
      }

      const responseData = await response.json();
      const { authData } = this.extractAuthPayload(responseData);

      // Google login should never require device verification, but guard anyway.
      const requiresDeviceVerification = authData.requiresDeviceVerification || authData.RequiresDeviceVerification;
      if (requiresDeviceVerification) {
        console.warn('Unexpected device verification requirement during Google login', authData);
      }

      return await this.finalizeLogin(authData);
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  }

  async resendDeviceOtp(userId: string, deviceId: string): Promise<{
    success: boolean;
    message: string;
    remainingAttempts: number;
    nextAllowedAt: string;
  }> {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://localhost:7137/api'}/auth/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, deviceId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to resend OTP');
      }

      const responseData = await response.json();
      
      if (responseData.success && responseData.data) {
        return responseData.data;
      } else {
        throw new Error(responseData.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      throw error;
    }
  }

  // Request an OTP to be sent over the specified channel (phone or email)
  async requestOtp(channel: 'email' | 'phone', target: string): Promise<{ success: boolean; expiresInSeconds?: number }>{
    return apiService.post<{ success: boolean; expiresInSeconds?: number }>(
      '/auth/request-otp',
      { channel, target }
    );
  }

  // Optional: resend OTP convenience wrapper with graceful fallback
  // Tries /auth/resend-otp; if not implemented (404), falls back to /auth/request-otp
  async resendOtp(channel: 'email' | 'phone', target: string): Promise<{ success: boolean }>{
    const baseUrl = (import.meta.env.VITE_API_URL as string) || '/api';
    try {
      const response = await fetch(`${baseUrl}/api/profile/verify-phone/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, target })
      });

      if (response.status === 404) {
        // Backend does not support a separate resend endpoint; issue a fresh OTP
        const fallback = await this.requestOtp(channel, target);
        return { success: !!fallback?.success };
      }

      if (!response.ok) {
        // If other error, attempt a final fallback to request-otp
        try {
          const fallback = await this.requestOtp(channel, target);
          return { success: !!fallback?.success };
        } catch (fallbackErr) {
          const errText = await response.text().catch(() => '');
          throw new Error(errText || 'Failed to resend OTP');
        }
      }

      const data = await response.json().catch(() => ({}));
      return { success: !!(data?.success ?? true) };
    } catch (error) {
      // Network or other error: try request-otp as a last resort
      const fallback = await this.requestOtp(channel, target);
      return { success: !!fallback?.success };
    }
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
        isEmailVerified: userData.isEmailVerified ?? userData.emailConfirmed ?? false,
        // Be tolerant to different backend property names
        isPhoneVerified: (userData.isPhoneVerified ?? userData.phoneNumberConfirmed ?? userData.phoneConfirmed) ?? false,
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

  async resendVerificationEmailByEmail(email: string): Promise<{ success: boolean; message: string }> {
    return apiService.post<{ success: boolean; message: string }>('/auth/resend-verification-email-by-email', {
      email,
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