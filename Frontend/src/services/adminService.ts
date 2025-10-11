import apiService from './api';
import notificationTrigger from './notificationTrigger';
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
      await apiService.post('/admin/kyc/verify', request);
      
      // Trigger notification for KYC status change
      await notificationTrigger.onKycStatusChanged({
        status: request.status.toLowerCase(),
        documentType: 'KYC Document',
        reason: request.rejectionReason || ''
      });
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

  // Admin Top-ups (list)
  async getTopUps(options?: { page?: number; pageSize?: number; status?: string; dateFrom?: string; dateTo?: string }): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (options?.page) params.append('page', String(options.page));
      if (options?.pageSize) params.append('pageSize', String(options.pageSize));
      if (options?.status) params.append('status', options.status);
      if (options?.dateFrom) params.append('dateFrom', options.dateFrom);
      if (options?.dateTo) params.append('dateTo', options.dateTo);
      const query = params.toString();
      const url = query ? `/admin/topups?${query}` : '/admin/topups';
      return await apiService.get<any[]>(url);
    } catch (error) {
      console.error('Error fetching admin top-ups:', error);
      throw error;
    }
  }

  // Admin approve withdrawal action
  async approveWithdrawal(withdrawalId: string): Promise<any> {
    try {
      const result = await apiService.post(`/admin/withdrawals/${withdrawalId}/approve`, {});
      
      // Trigger notification refresh event
      window.dispatchEvent(new CustomEvent('withdrawal:statusChanged', { 
        detail: { withdrawalId, action: 'approved' } 
      }));
      
      return result;
    } catch (error) {
      console.error('Error approving withdrawal (admin):', error);
      throw error;
    }
  }

  /**
   * Try to get the count of pending top-ups. Backend may expose a count endpoint or return the list.
   * We attempt /admin/top-ups/pending/count first, then fall back to /admin/top-ups/pending and return length.
   */
  async getPendingTopUpsCount(): Promise<number> {
    // Prefer calling the real wallets endpoint first (it exists in backend).
    // Only fall back to admin endpoints if the wallets endpoint is unavailable.
    try {
      // Prefer walletService server-side top-ups which may support filters
      const walletService = (await import('./walletService')).default;
      const pageSize = 1000;
      const paged = await walletService.getTopUps({ pageNumber: 1, pageSize });
      if (paged) {
        const items = paged.items || paged.Items || paged.transactions || paged.data || [];
        if (Array.isArray(items)) {
          return items.filter((t: any) => (t.status || '').toLowerCase() === 'pending' || (t.status || '').toLowerCase() === 'pendingconfirmation').length;
        }
        const totalCount = paged.totalCount || paged.TotalCount || paged.total;
        if (typeof totalCount === 'number') return totalCount;
      }
    } catch (e) {
      // wallets endpoint failed; try admin endpoints as fallback
    }

    try {
      // Attempt admin count endpoint
      try {
        const resp = await apiService.get<{ count: number }>('/admin/top-ups/pending/count');
        if (resp && typeof resp.count === 'number') return resp.count;
      } catch (e) {
        // ignore and try list fallback
      }

      // Fallback to admin list endpoint
      try {
        const list = await apiService.get<any[]>('/admin/top-ups/pending');
        if (Array.isArray(list)) return list.length;
      } catch (e) {
        // no admin endpoints available
      }
    } catch (e) {
      console.error('Error fetching pending top-ups via admin endpoints:', e);
    }

    return 0;
  }

  /**
   * Get withdrawals statistics: total and pending counts.
   * Tries /admin/withdrawals/stats then falls back to /withdrawals to compute counts.
   */
  async getWithdrawalsStats(): Promise<{ total: number; pending: number }> {
    try {
      // backend returns { Total, Initiated, PendingProvider, Settled, Failed, Reversed }
      const respAny = await apiService.get<any>('/admin/withdrawals/stats');
      if (respAny) {
        const total = respAny.total ?? respAny.Total ?? 0;
        // treat Initiated + PendingProvider as pending
        const initiated = respAny.Initiated ?? respAny.initiated ?? 0;
        const pendingProvider = respAny.PendingProvider ?? respAny.pendingProvider ?? 0;
        const pending = (typeof respAny.pending === 'number' ? respAny.pending : (initiated + pendingProvider));
        return { total, pending };
      }
    } catch (e) {
      // ignore and try fallback
    }

    try {
      // Try admin list endpoint which may return an array
      try {
        const adminList = await apiService.get<any[]>('/admin/withdrawals');
        if (Array.isArray(adminList)) {
          const total = adminList.length;
          const pending = adminList.filter((w: any) => (w.status || '').toLowerCase() === 'pending').length;
          return { total, pending };
        }
      } catch (e) {
        // ignore and try next fallback
      }

      // Try several variants of the withdrawals endpoint and handle paginated shapes
      const tryUrls = [
        '/withdrawals?pageNumber=1&pageSize=1000',
        '/withdrawals?page=1&pageSize=1000',
        '/withdrawals'
      ];

      for (const url of tryUrls) {
        try {
          const res = await apiService.get<any>(url);
          if (!res) continue;

          // If we got a plain array
          if (Array.isArray(res)) {
            const total = res.length;
            const pending = res.filter((w: any) => (w.status || '').toLowerCase() === 'pending').length;
            return { total, pending };
          }

          // If we got a paginated response, try common shapes
          const items = res.items || res.Items || res.data || res.transactions || res.ItemsFound || [];
          const totalFromPaged = res.totalCount || res.TotalCount || res.total || (Array.isArray(items) ? items.length : undefined);

          if (Array.isArray(items)) {
            const total = typeof totalFromPaged === 'number' ? totalFromPaged : items.length;
            const pending = items.filter((w: any) => (w.status || '').toLowerCase() === 'pending').length;
            return { total, pending };
          }

          // As a last resort, if res has a single numeric total and pending fields
          if (typeof res.total === 'number' && typeof res.pending === 'number') {
            return { total: res.total, pending: res.pending };
          }
        } catch (e) {
          // ignore and try next url
        }
      }
    } catch (e) {
      console.error('Error fetching withdrawals list for stats:', e);
    }

    return { total: 0, pending: 0 };
  }

  // Admin: fetch withdrawals list (admin view) with optional filters
  async getWithdrawals(options?: { pageNumber?: number; pageSize?: number; status?: string; sellerId?: string; reference?: string }) : Promise<any> {
    try {
      const params = new URLSearchParams();
      if (options?.pageNumber) params.append('pageNumber', String(options.pageNumber));
      if (options?.pageSize) params.append('pageSize', String(options.pageSize));
      if (options?.status) params.append('status', options.status);
      if (options?.sellerId) params.append('sellerId', options.sellerId);
      if (options?.reference) params.append('reference', options.reference);

      const query = params.toString();
      const url = query ? `/admin/withdrawals?${query}` : '/admin/withdrawals';
      return await apiService.get<any>(url);
    } catch (error) {
      console.error('Error fetching admin withdrawals:', error);
      throw error;
    }
  }

  // Admin: approve a withdrawal via admin endpoint
  async approveWithdrawalAdmin(withdrawalId: string): Promise<any> {
    try {
      return await apiService.post(`/admin/withdrawals/${withdrawalId}/approve`, {});
    } catch (error) {
      console.error('Error approving withdrawal (admin):', error);
      throw error;
    }
  }
}

export default new AdminService();