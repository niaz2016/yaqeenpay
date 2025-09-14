// src/types/auth.ts
export interface User {
  id: string;
  email: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  kycStatus: string;
  profileCompleteness: number;
  roles: string[];
  created: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  userName?: string;
  phoneNumber?: string;
  password: string;
  confirmPassword: string;
  firstName?: string;
  lastName?: string;
  role?: 'buyer' | 'seller';
  businessInfo?: {
    businessName: string;
    businessType: string;
    businessDescription: string;
    website?: string;
  };
}

export interface TokenResponse {
  // Frontend expected format
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  
  // Backend format (based on LoginCommand.cs)
  token?: string;
  tokenExpires?: Date;
  userId?: string;
  email?: string;
  userName?: string;
}

export interface OtpVerification {
  channel: 'email' | 'phone';
  target: string;
  code: string;
}

export interface PasswordReset {
  email: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
}