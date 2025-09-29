// src/services/sellerServiceSelector.ts
import { sellerService } from './sellerService';

// Selected seller service — use the real backend sellerService only.
// Removed all mock fallbacks; errors from the backend will propagate so callers can handle them.
const createSelectedSellerService = () => {
  return {
    getSellerAnalytics: async () => {
      return await sellerService.getSellerAnalytics();
    },

    getSellerOrders: async (filters?: any) => {
      return await sellerService.getSellerOrders(filters);
    },

    getWithdrawals: async (options?: { page?: number; pageSize?: number; status?: string; sellerId?: string; reference?: string }) => {
      return await sellerService.getWithdrawals(options as any);
    },

    getWithdrawalById: async (withdrawalId: string) => {
      return await sellerService.getWithdrawalById(withdrawalId);
    },

    requestWithdrawal: async (data: any) => {
      return await sellerService.requestWithdrawal(data);
    },

    cancelWithdrawal: async (withdrawalId: string) => {
      return await sellerService.cancelWithdrawal(withdrawalId);
    },

    approveWithdrawal: async (withdrawalId: string) => {
      return await sellerService.approveWithdrawal(withdrawalId);
    },

    createBusinessProfile: async (data: any) => {
      return await sellerService.createBusinessProfile(data);
    },

    getBusinessProfile: async () => {
      return await sellerService.getBusinessProfile();
    },

    updateBusinessProfile: async (data: any) => {
      return await sellerService.updateBusinessProfile(data);
    },

    applyForSellerRole: async (data: any) => {
      return await sellerService.applyForSellerRole(data);
    }
  };
};

export const selectedSellerService = createSelectedSellerService();
export default selectedSellerService;