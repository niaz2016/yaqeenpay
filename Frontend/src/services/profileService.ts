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