// src/services/profileService.ts
import apiService from './api';
import type { ProfileDetails, ProfileUpdateRequest, ChangePasswordRequest } from '../types/profile';

class ProfileService {
  async getProfile(): Promise<ProfileDetails> {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    const config = token
      ? { headers: { Authorization: `Bearer ${token}` } }
      : undefined;
    return apiService.get<ProfileDetails>('/profile', config as any);
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

  async verifyEmail(): Promise<{ success: boolean; message: string }> {
    return apiService.post<{ success: boolean; message: string }>('/profile/verify-email');
  }

  async verifyPhone(): Promise<{ success: boolean; message: string }> {
    return apiService.post<{ success: boolean; message: string }>('/profile/verify-phone');
  }
}

const profileService = new ProfileService();
export default profileService;