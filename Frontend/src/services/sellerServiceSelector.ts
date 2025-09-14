// src/services/sellerServiceSelector.ts
import { sellerService } from './sellerService';

// Create a service that uses only real backend endpoints
const createSelectedSellerService = () => {
  return {
    // Analytics - use real backend only
    getSellerAnalytics: async () => {
      console.log('Fetching seller analytics from backend API');
      return await sellerService.getSellerAnalytics();
    },

    // Seller orders - use real backend only
    getSellerOrders: async (filters?: any) => {
      console.log('Fetching seller orders from backend API');
      return await sellerService.getSellerOrders(filters);
    },

    // Withdrawals - use real backend only
    getWithdrawals: async () => {
      console.log('Fetching withdrawals from backend API');
      return await sellerService.getWithdrawals();
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

    // Business Profile Management - use real backend only
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

    // Registration - use real backend only
    applyForSellerRole: async (data: any) => {
      console.log('Applying for seller role via backend API');
      return await sellerService.applyForSellerRole(data);
    }
  };
};

export const selectedSellerService = createSelectedSellerService();
export default selectedSellerService;