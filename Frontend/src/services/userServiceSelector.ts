// src/services/userServiceSelector.ts
import { selectedSellerService } from './sellerServiceSelector';
import analyticsService from './analyticsService';
import type { UserAnalytics as SellerAnalytics } from '../types/user';

// Thin alias that exposes the same API but uses 'user' naming. This keeps callers stable
// while allowing gradual code changes to prefer 'user'.
const createSelectedUserService = () => ({
  getAnalytics: async (): Promise<SellerAnalytics> => {
    // Fetch seller analytics (sales/orders) then augment with product view totals
    const analytics = await selectedSellerService.getSellerAnalytics();
    try {
      const views = await analyticsService.getSellerProductViews();
      const totalViews = Array.isArray(views) ? views.reduce((s, v) => s + (v.totalViews || 0), 0) : 0;
      const totalUnique = Array.isArray(views) ? views.reduce((s, v) => s + (v.uniqueVisitors || 0), 0) : 0;
      // Attach aggregated fields so sellers get visit counts alongside sales analytics
      return {
        ...analytics,
        productViews: totalViews,
        productUniqueVisitors: totalUnique
      } as SellerAnalytics;
    } catch (err) {
      // If views fetch fails, return analytics without views (non-fatal)
      console.debug('Failed to fetch seller product views when loading analytics:', err);
      return analytics;
    }
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
