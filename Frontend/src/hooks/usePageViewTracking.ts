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
      console.log('[Analytics] usePageViewTracking called with:', {
        pageType: params.pageType,
        productId: params.productId,
        sellerId: params.sellerId
      });

      // For product pages, ensure we have both productId and sellerId before tracking.
      // This avoids inserting PageViews with productId but missing sellerId which
      // prevents seller-level aggregation on the backend.
      if (params.pageType === 'Product') {
        console.log('[Analytics Debug] Product page tracking attempt:', {
          productId: params.productId,
          sellerId: params.sellerId,
          hasProductId: !!params.productId,
          hasSellerId: !!params.sellerId
        });
        
        if (!params.productId || !params.sellerId) {
          // Do not attempt to track until both IDs are available
          console.log('[Analytics] Skipping product page tracking - missing IDs:', {
            hasProductId: !!params.productId,
            hasSellerId: !!params.sellerId
          });
          return;
        }
      }
      
      // Create a unique key for this page view
      const pageKey = `pageview_${params.pageType}_${params.productId || ''}_${params.sellerId || ''}`;
      const lastViewTime = localStorage.getItem(pageKey);
      const now = Date.now();
      
      // Only track if more than 1 minute (60000ms) has passed since last view of this page
      if (lastViewTime && now - parseInt(lastViewTime, 10) < 60000) {
        console.log('[Analytics] Page view not tracked - cooldown active. Time since last view:', Math.floor((now - parseInt(lastViewTime, 10)) / 1000), 'seconds');
        return;
      }

      console.log('[Analytics] Calling trackPageView...');
      try {
        await trackPageView({
          pageUrl: window.location.href,
          pageType: params.pageType,
          productId: params.productId,
          sellerId: params.sellerId
        });

        // Store the current timestamp
        localStorage.setItem(pageKey, now.toString());
        console.log('[Analytics] Page view tracked successfully');
      } catch (error) {
        console.error('[Analytics] Error tracking page view:', error);
      }
    };

    track();
  }, [params.pageType, params.productId, params.sellerId]);
};
