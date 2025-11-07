import api from './api';

// Generate a unique visitor ID based on browser fingerprint
const getVisitorId = (): string => {
  let visitorId = localStorage.getItem('visitorId');
  
  if (!visitorId) {
    // Create a simple fingerprint based on available browser info
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      !!window.sessionStorage,
      !!window.localStorage
    ].join('|');
    
    // Generate a hash-like ID from the fingerprint
    visitorId = btoa(fingerprint).substring(0, 40);
    localStorage.setItem('visitorId', visitorId);
  }
  
  return visitorId;
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

    const response = await api.post('/analytics/track', {
      pageUrl: params.pageUrl,
      pageType: params.pageType,
      productId: params.productId,
      sellerId: params.sellerId,
      visitorId: visitorId
    });

    const responseData = response as { data: { success: boolean } };

    if (!responseData.data.success) {
      console.error('Page view tracking failed:', responseData.data);
    }
  } catch (error: any) {
    console.error('Page view tracking failed with error:', error.response?.data || error.message);
  }
};

export interface AnalyticsData {
  totalPageViews: number;
  totalUniqueVisitors: number;
  pageTypeBreakdown: Array<{
    pageType: string;
    totalViews: number;
    uniqueVisitors: number;
  }>;
  deviceBreakdown: Array<{
    deviceType: string;
    totalViews: number;
    uniqueVisitors: number;
  }>;
  browserBreakdown: Array<{
    browser: string;
    totalViews: number;
    uniqueVisitors: number;
  }>;
  osBreakdown: Array<{
    operatingSystem: string;
    totalViews: number;
    uniqueVisitors: number;
  }>;
  todayViews: number;
  todayUniqueVisitors: number;
  weekViews: number;
  weekUniqueVisitors: number;
  monthViews: number;
  monthUniqueVisitors: number;
}

export const getAdminAnalytics = async (startDate?: Date, endDate?: Date): Promise<AnalyticsData> => {
  const params: any = {};
  if (startDate) params.startDate = startDate.toISOString();
  if (endDate) params.endDate = endDate.toISOString();
  
  return await api.get<AnalyticsData>('/analytics/admin', { params });
};

export interface ProductViewStats {
  productId: string;
  productName: string;
  totalViews: number;
  uniqueVisitors: number;
  todayViews: number;
  weekViews: number;
  monthViews: number;
  dailyViews: Array<{
    date: string;
    views: number;
    uniqueVisitors: number;
  }>;
}

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
  , getVisitorStats
};

export default analyticsService;
