import api from './api';
import type { ProductViewStats, AnalyticsData } from '../types/analytics';

// Generate a stable visitor ID and persist it in localStorage.
// Prefer crypto.randomUUID() when available. Avoid using UA/fingerprint as the primary ID
// because that can collapse distinct devices into the same VisitorId.
const getVisitorId = (): string => {
  let visitorId: string | null = null;

  try {
    visitorId = localStorage.getItem('visitorId');
  } catch {
    // localStorage might be unavailable in some environments (privacy modes)
    visitorId = null;
  }

  if (!visitorId) {
    // Generate a strong UUID when possible
    try {
      if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
        visitorId = (crypto as any).randomUUID();
      } else if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
        // Fallback: create a UUID v4 using getRandomValues
        const buf = new Uint8Array(16);
        crypto.getRandomValues(buf as any);
        // Per RFC4122 v4: set bits 6-7 of clock_seq_hi_and_reserved to 01 and bits 12-15 of time_hi_and_version to 0100
        buf[6] = (buf[6] & 0x0f) | 0x40;
        buf[8] = (buf[8] & 0x3f) | 0x80;
        const toHex = (n: number) => n.toString(16).padStart(2, '0');
        visitorId = Array.from(buf).map(toHex).join('').replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
      } else {
        // Last resort: timestamp + random string
        visitorId = `v_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      }

      try {
        localStorage.setItem('visitorId', String(visitorId));
      } catch {
        // Ignore storage errors; we'll still return the generated id for this session
      }
    } catch {
      visitorId = 'unknown';
    }
  }

  return visitorId ?? 'unknown';
};

interface TrackPageViewParams {
  pageUrl: string;
  pageType: 'Landing' | 'Gateway' | 'Product' | 'Category' | 'Seller' | 'Other';
  productId?: string;
  sellerId?: string;
}

export const trackPageView = async (params: TrackPageViewParams): Promise<void> => {
  try {
    const visitorId = getVisitorId();
    const payload = {
      pageUrl: params.pageUrl,
      pageType: params.pageType,
      productId: params.productId,
      sellerId: params.sellerId,
      visitorId: visitorId
    };
    
    console.log('[Analytics] trackPageView - Sending payload:', payload);

    const response = await api.post('/analytics/track', payload);

    const responseData = response as { data: { success: boolean } };

    if (!responseData.data.success) {
      console.error('[Analytics] Tracking returned success=false. This usually means:', 
        '\n1. Cooldown active (viewed same page within 1 minute)', 
        '\n2. Visitor ID is in excluded list',
        '\nResponse:', responseData.data);
    } else {
      console.log('[Analytics] ✓ Page view tracked successfully');
    }
  } catch (error: any) {
    console.error('[Analytics] ✗ API error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
  }
};

// AnalyticsData is defined in src/types/analytics.ts and imported above

export const getAdminAnalytics = async (startDate?: Date, endDate?: Date): Promise<AnalyticsData> => {
  const params: any = {};
  if (startDate) params.startDate = startDate.toISOString();
  if (endDate) params.endDate = endDate.toISOString();
  
  return await api.get<AnalyticsData>('/analytics/admin', { params });
};

export const getAdminSummary = async (): Promise<import('../types/analytics').SellerSummary | null> => {
  try {
    const resp: any = await api.get('/analytics/admin/summary');
    const data = resp?.data !== undefined ? resp.data : resp;
    if (data && typeof data === 'object') return data as import('../types/analytics').SellerSummary;
    return null;
  } catch (err) {
    console.error('Failed to fetch admin summary:', err);
    return null;
  }
};

export const getSellerProductViews = async (): Promise<ProductViewStats[]> => {
  try {
    const response: any = await api.get('/analytics/seller/products');
    console.log('Raw API response:', response);
    
    // The api.get method already unwraps the response, so response IS the data
    const data = response?.data !== undefined ? response.data : response;
    console.log('Processed data:', data);
    
    // Ensure we always return an array to callers
    const result = Array.isArray(data) ? (data as ProductViewStats[]) : [];
    console.log('Final result:', result);
    return result;
  } catch (error) {
    console.error('Failed to fetch seller product views:', error);
    // Return empty array so UI can handle gracefully
    return [];
  }
};

export const getSellerSummary = async (): Promise<import('../types/analytics').SellerSummary | null> => {
  try {
    const resp: any = await api.get('/analytics/seller/summary');
    const data = resp?.data !== undefined ? resp.data : resp;
    if (data && typeof data === 'object') return data as import('../types/analytics').SellerSummary;
    return null;
  } catch (err) {
    console.error('Failed to fetch seller summary:', err);
    return null;
  }
};

export interface VisitorStat {
  visitorId: string;
  totalVisits: number;
  firstSeen: string; // ISO
  lastSeen: string; // ISO
  sampleIp?: string | null;
  sampleUserAgent?: string | null;
  sampleBrowser?: string | null;
}

export interface VisitorStatsResult {
  items: VisitorStat[];
  totalCount: number;
}

export const getVisitorStats = async (page = 1, pageSize = 100, startDate?: Date, endDate?: Date, sortBy?: string, sortDir?: 'asc' | 'desc'): Promise<VisitorStatsResult> => {
  try {
    const params: any = { page, pageSize };
    if (startDate) params.startDate = startDate.toISOString();
    if (endDate) params.endDate = endDate.toISOString();
    if (sortBy) params.sortBy = sortBy;
    if (sortDir) params.sortDir = sortDir;

    const resp: any = await api.get('/analytics/visitors', { params });
    const data = resp?.data !== undefined ? resp.data : resp;
    if (data && typeof data === 'object') {
      return {
        items: Array.isArray(data.items) ? data.items as VisitorStat[] : [],
        totalCount: typeof data.totalCount === 'number' ? data.totalCount : 0
      };
    }

    return { items: [], totalCount: 0 };
  } catch (err) {
    console.error('Failed to fetch visitor stats:', err);
    return { items: [], totalCount: 0 };
  }
};

const analyticsService = {
  trackPageView,
  getAdminAnalytics,
  getSellerProductViews
  , getSellerSummary, getVisitorStats
  , getAdminSummary
};

export default analyticsService;
