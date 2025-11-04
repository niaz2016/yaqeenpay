// src/services/profileService.ts
import apiService from './api';
import type { ProfileDetails, ProfileUpdateRequest, ChangePasswordRequest } from '../types/profile';

class ProfileService {
  async getProfile(): Promise<ProfileDetails> {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    const config = token
      ? { headers: { Authorization: `Bearer ${token}` } }
      : undefined;
    const raw = await apiService.get<any>('/profile', config as any);
    // Normalize verification flags to expected frontend fields
    const normalized: ProfileDetails = {
      id: raw.id,
      email: raw.email,
      phoneNumber: raw.phoneNumber,
      firstName: raw.firstName,
      lastName: raw.lastName,
      profileImageUrl: raw.profileImageUrl,
      dateOfBirth: raw.dateOfBirth,
      gender: raw.gender,
      address: raw.address,
      city: raw.city,
      state: raw.state,
      country: raw.country,
      postalCode: raw.postalCode,
      isEmailVerified: (raw.isEmailVerified ?? raw.emailConfirmed) ?? false,
      isPhoneVerified: (raw.isPhoneVerified ?? raw.phoneNumberConfirmed ?? raw.phoneConfirmed) ?? false,
      hasPassword: raw.hasPassword ?? true,
      profileCompleted: (raw.profileCompleted ?? false),
      completionPercentage: (raw.completionPercentage ?? raw.profileCompleteness ?? 0),
      profileCompleteness: raw.profileCompleteness,
      kycStatus: raw.kycStatus,
      roles: raw.roles,
      created: raw.created,
      createdAt: raw.createdAt || raw.created || '',
      updatedAt: raw.updatedAt || '',
    };
    return normalized;
  }

  async updateProfile(profileData: ProfileUpdateRequest): Promise<ProfileDetails> {
    return apiService.put<ProfileDetails>('/profile', profileData);
  }

  async uploadProfileImage(file: File, onUploadProgress?: (progressEvent: ProgressEvent) => void): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    // Let axios set the multipart boundary; override default content-type
    const config = {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress
    } as any;

  const result = await apiService.post<any>('/profile/upload-image', formData, config);
  // apiService.post unwraps ApiResponse wrappers and returns the inner data when possible.
  // Support multiple possible shapes:
  //  - { url: 'https://...' }
  //  - { data: { url: '...' } }
  //  - { success: true, data: { url: '...' } } (already unwrapped by apiService)
  const url = result?.url || result?.data?.url || (result && result?.data?.data?.url) || null;
  if (!url) throw new Error('Upload succeeded but server did not return file URL');
  return { url };
  }

  async changePassword(passwordData: ChangePasswordRequest): Promise<{ success: boolean; message?: string }> {
    return apiService.post<{ success: boolean; message?: string }>('/profile/change-password', passwordData);
  }

  async verifyEmail(): Promise<{ success: boolean; message: string; verifiedAt?: string }> {
    const response = await apiService.post<any>('/profile/verify-email');

    // The API may return the full wrapper (success/message/verifiedAt) or just the data payload.
    const success = typeof response?.success === 'boolean' ? Boolean(response.success) : true;
    const message = (response?.message as string) || 'Email verification completed.';
    const verifiedAt = response?.verifiedAt ?? response?.data?.verifiedAt ?? undefined;

    return { success, message, verifiedAt };
  }

  // Request a phone verification OTP
  async requestPhoneVerification(phone?: string): Promise<{ phone?: string; expiresInSeconds?: number; success?: boolean; message?: string }> {
    // Backend expects PhoneNumber in DTO; JSON property is phoneNumber
    const payload = phone ? { phoneNumber: phone } : undefined;
    return apiService.post<any>('/profile/verify-phone/request', payload);
  }

  // Confirm phone verification with OTP; include phone when unauthenticated flows require it
  async confirmPhoneVerification(otp: string, phone?: string): Promise<{ success: boolean; data?: any; message?: string }> {
    // Backend expects Otp and optional PhoneNumber; JSON properties are otp and phoneNumber
    const payload: any = { otp };
    if (phone) payload.phoneNumber = phone;
    const resp = await apiService.post<any>('/profile/verify-phone/confirm', payload);
    // apiService.post unwraps ApiResponse and returns either `data` or the root.
    // If we received the inner data object (no `success` field), normalize to { success: true, data }.
    if (resp && typeof resp === 'object' && 'success' in resp) {
      return resp as { success: boolean; data?: any; message?: string };
    }
    return { success: true, data: resp };
  }
}

const profileService = new ProfileService();
export default profileService;