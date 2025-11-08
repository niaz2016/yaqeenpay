// src/types/analytics.ts
// Shared analytics-related TypeScript types used across the frontend

export interface ProductDailyView {
  date: string; // ISO date string (yyyy-mm-dd)
  views: number;
  uniqueVisitors: number;
}

export interface ProductViewStats {
  productId: string;
  productName: string;
  totalViews: number;
  uniqueVisitors: number;
  todayViews: number;
  weekViews: number;
  monthViews: number;
  dailyViews: ProductDailyView[];
  // Additional engagement metrics
  inCartCount?: number; // number of active carts containing this product
  favoritesCount?: number; // number of times users clicked the 'heart' (favorites)
  // UI state toggles used by the analytics page for chart visibility (optional)
  showViews?: boolean;
  showUniqueVisitors?: boolean;
}

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

export interface SellerSummary {
  totalUniqueVisitors: number;
}

export default {} as const;
