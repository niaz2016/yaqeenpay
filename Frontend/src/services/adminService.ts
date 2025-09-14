import apiService from './api';
import type {
  AdminUser,
  UserFilter,
  KycDocument,
  BusinessProfile,
  AdminOrder,
  Dispute,
  SystemConfig,
  AdminStats,
  KycReviewRequest,
  SellerApprovalRequest,
  DisputeResolution,
  UserActionRequest
} from '../types/admin';

class AdminService {
  // User Management
  async getUsers(filters?: UserFilter): Promise<AdminUser[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.role) params.append('role', filters.role);
      if (filters?.kycStatus) params.append('kycStatus', filters.kycStatus);
      if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
      if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters?.dateTo) params.append('dateTo', filters.dateTo);

      return await apiService.get<AdminUser[]>(`/admin/users?${params.toString()}`);
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  async getUserById(userId: string): Promise<AdminUser> {
    try {
      return await apiService.get<AdminUser>(`/admin/users/${userId}`);
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  async performUserAction(request: UserActionRequest): Promise<void> {
    try {
      await apiService.post('/admin/users/action', request);
    } catch (error) {
      console.error('Error performing user action:', error);
      throw error;
    }
  }

  // KYC Management
  async getPendingKycDocuments(): Promise<KycDocument[]> {
    try {
      return await apiService.get<KycDocument[]>('/admin/kyc/pending');
    } catch (error) {
      console.error('Error fetching pending KYC documents:', error);
      throw error;
    }
  }

  async getKycDocument(documentId: string): Promise<KycDocument> {
    try {
      return await apiService.get<KycDocument>(`/admin/kyc/${documentId}`);
    } catch (error) {
      console.error('Error fetching KYC document:', error);
      throw error;
    }
  }

  async reviewKycDocument(request: KycReviewRequest): Promise<void> {
    try {
      await apiService.post('/admin/kyc/review', request);
    } catch (error) {
      console.error('Error reviewing KYC document:', error);
      throw error;
    }
  }

  // Seller Management
  async getPendingSellerApplications(): Promise<BusinessProfile[]> {
    try {
      return await apiService.get<BusinessProfile[]>('/admin/sellers/pending');
    } catch (error) {
      console.error('Error fetching pending seller applications:', error);
      throw error;
    }
  }

  async getBusinessProfile(profileId: string): Promise<BusinessProfile> {
    try {
      return await apiService.get<BusinessProfile>(`/admin/sellers/${profileId}`);
    } catch (error) {
      console.error('Error fetching business profile:', error);
      throw error;
    }
  }

  async reviewSellerApplication(request: SellerApprovalRequest): Promise<void> {
    try {
      await apiService.post('/admin/sellers/review', request);
    } catch (error) {
      console.error('Error reviewing seller application:', error);
      throw error;
    }
  }

  // Order Management
  async getOrders(filters?: any): Promise<AdminOrder[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.priority) params.append('priority', filters.priority.toString());
      if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters?.dateTo) params.append('dateTo', filters.dateTo);

      return await apiService.get<AdminOrder[]>(`/admin/orders?${params.toString()}`);
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  async getOrderById(orderId: string): Promise<AdminOrder> {
    try {
      return await apiService.get<AdminOrder>(`/admin/orders/${orderId}`);
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  }

  // Dispute Management
  async getDisputes(filters?: any): Promise<Dispute[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.priority) params.append('priority', filters.priority);
      if (filters?.assignedTo) params.append('assignedTo', filters.assignedTo);

      return await apiService.get<Dispute[]>(`/admin/disputes?${params.toString()}`);
    } catch (error) {
      console.error('Error fetching disputes:', error);
      throw error;
    }
  }

  async getDisputeById(disputeId: string): Promise<Dispute> {
    try {
      return await apiService.get<Dispute>(`/admin/disputes/${disputeId}`);
    } catch (error) {
      console.error('Error fetching dispute:', error);
      throw error;
    }
  }

  async resolveDispute(resolution: DisputeResolution): Promise<void> {
    try {
      await apiService.post('/admin/disputes/resolve', resolution);
    } catch (error) {
      console.error('Error resolving dispute:', error);
      throw error;
    }
  }

  async assignDispute(disputeId: string, adminId: string): Promise<void> {
    try {
      await apiService.post(`/admin/disputes/${disputeId}/assign`, { adminId });
    } catch (error) {
      console.error('Error assigning dispute:', error);
      throw error;
    }
  }

  // System Configuration
  async getSystemConfig(): Promise<SystemConfig> {
    try {
      return await apiService.get<SystemConfig>('/admin/config');
    } catch (error) {
      console.error('Error fetching system config:', error);
      throw error;
    }
  }

  async updateSystemConfig(config: Partial<SystemConfig>): Promise<void> {
    try {
      await apiService.put('/admin/config', config);
    } catch (error) {
      console.error('Error updating system config:', error);
      throw error;
    }
  }

  // Analytics
  async getAdminStats(): Promise<AdminStats> {
    try {
      return await apiService.get<AdminStats>('/admin/stats');
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      throw error;
    }
  }
}

export default new AdminService();