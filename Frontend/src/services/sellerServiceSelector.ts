// src/services/sellerServiceSelector.ts
import { sellerService } from './sellerService';

// Selected seller service — use the real backend sellerService only.
// Removed all mock fallbacks; errors from the backend will propagate so callers can handle them.
const createSelectedSellerService = () => {
  return {
    getSellerAnalytics: async () => {
      console.log('Fetching seller analytics from backend API');
      return await sellerService.getSellerAnalytics();
    },

    getSellerOrders: async (filters?: any) => {
      console.log('Fetching seller orders from backend API');
      return await sellerService.getSellerOrders(filters);
    },

    getWithdrawals: async (options?: { page?: number; pageSize?: number; status?: string; sellerId?: string; reference?: string }) => {
      console.log('Fetching withdrawals from backend API with options', options);
      return await sellerService.getWithdrawals(options as any);
    },

    getWithdrawalById: async (withdrawalId: string) => {
      console.log(`Fetching withdrawal ${withdrawalId} from backend API`);
      return await sellerService.getWithdrawalById(withdrawalId);
    },

    requestWithdrawal: async (data: any) => {
      console.log('Submitting withdrawal request to backend API');
      return await sellerService.requestWithdrawal(data);
    },

    cancelWithdrawal: async (withdrawalId: string) => {
      console.log(`Cancelling withdrawal ${withdrawalId} via backend API`);
      return await sellerService.cancelWithdrawal(withdrawalId);
    },

    approveWithdrawal: async (withdrawalId: string) => {
      console.log(`Approving withdrawal ${withdrawalId} via backend API`);
      return await sellerService.approveWithdrawal(withdrawalId);
    },

    createBusinessProfile: async (data: any) => {
      console.log('Creating business profile via backend API');
      return await sellerService.createBusinessProfile(data);
    },

    getBusinessProfile: async () => {
      console.log('Fetching business profile from backend API');
      return await sellerService.getBusinessProfile();
    },

    updateBusinessProfile: async (data: any) => {
      console.log('Updating business profile via backend API');
      return await sellerService.updateBusinessProfile(data);
    },

    applyForSellerRole: async (data: any) => {
      console.log('Applying for seller role via backend API');
      return await sellerService.applyForSellerRole(data);
    }
  };
};

export const selectedSellerService = createSelectedSellerService();
export default selectedSellerService;