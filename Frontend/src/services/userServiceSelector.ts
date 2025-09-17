// src/services/userServiceSelector.ts
import { selectedSellerService } from './sellerServiceSelector';

// Thin alias that exposes the same API but uses 'user' naming. This keeps callers stable
// while allowing gradual code changes to prefer 'user'.
const createSelectedUserService = () => ({
  getAnalytics: async () => {
    return await selectedSellerService.getSellerAnalytics();
  },

  getOrders: async (filters?: any) => {
    return await selectedSellerService.getSellerOrders(filters);
  },

  getWithdrawals: async (options?: any) => {
    return await selectedSellerService.getWithdrawals(options);
  },

  getWithdrawalById: async (id: string) => {
    return await selectedSellerService.getWithdrawalById(id);
  },

  requestWithdrawal: async (data: any) => {
    return await selectedSellerService.requestWithdrawal(data);
  },

  cancelWithdrawal: async (id: string) => {
    return await selectedSellerService.cancelWithdrawal(id);
  }
});

export const selectedUserService = createSelectedUserService();
export default selectedUserService;
