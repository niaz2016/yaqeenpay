// src/types/profile.ts
export interface ProfileDetails {
  id: string;
  email: string;
  phoneNumber?: string;
  firstName: string;
  lastName: string;
  address?: Address;
  emailVerified: boolean;
  phoneVerified: boolean;
  profileCompleted: boolean;
  completionPercentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface ProfileUpdateRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: Address;
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