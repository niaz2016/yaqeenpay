// src/types/profile.ts
export interface ProfileDetails {
  id: string;
  email: string;
  phoneNumber?: string;
  firstName: string;
  lastName: string;
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
  profileCompleted: boolean;
  completionPercentage: number;
  profileCompleteness?: number; // backend name
  kycStatus?: string;
  roles?: string[];
  created?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileUpdateRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  profileImageUrl?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message?: string;
}