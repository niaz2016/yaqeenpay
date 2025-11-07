import { useEffect } from 'react';
import { trackPageView } from '../services/analyticsService';

interface UsePageViewTrackingParams {
  pageType: 'Landing' | 'Gateway' | 'Product' | 'Category' | 'Seller' | 'Other';
  productId?: string;
  sellerId?: string;
}

export const usePageViewTracking = (params: UsePageViewTrackingParams) => {
  useEffect(() => {
    const track = async () => {
      // Create a unique key for this page view
      const pageKey = `pageview_${params.pageType}_${params.productId || ''}_${params.sellerId || ''}`;
      const lastViewTime = localStorage.getItem(pageKey);
      const now = Date.now();
      
      // Only track if more than 1 minute (60000ms) has passed since last view of this page
      if (lastViewTime && now - parseInt(lastViewTime, 10) < 60000) {
        console.debug('Page view not tracked - cooldown active');
        return;
      }

      await trackPageView({
        pageUrl: window.location.href,
        pageType: params.pageType,
        productId: params.productId,
        sellerId: params.sellerId
      });

      // Store the current timestamp
      localStorage.setItem(pageKey, now.toString());
    };

    track();
  }, [params.pageType, params.productId, params.sellerId]);
};
