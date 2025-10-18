// src/types/rating.ts

/**
 * User rating and reputation system types
 */

export interface Rating {
  id: string;
  orderId: string;
  orderCode?: string;
  reviewerId: string; // User who gives the rating
  reviewerName: string;
  reviewerRole: 'buyer' | 'seller' | 'admin';
  revieweeId: string; // User who receives the rating
  revieweeName: string;
  revieweeRole: 'buyer' | 'seller' | 'admin';
  score: number; // 1-5 stars
  comment?: string;
  category: 'communication' | 'reliability' | 'quality' | 'speed' | 'overall';
  context: 'order_completed' | 'order_rejected' | 'order_cancelled';
  isVerified: boolean; // Only verified transactions can be rated
  createdAt: string;
  updatedAt: string;
}

export interface RatingStats {
  userId: string;
  averageRating: number; // Overall average (0-5)
  totalRatings: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  categoryAverages: {
    communication: number;
    reliability: number;
    quality: number;
    speed: number;
    overall: number;
  };
  recentRatings: Rating[];
  asBuyer: {
    averageRating: number;
    totalRatings: number;
  };
  asSeller: {
    averageRating: number;
    totalRatings: number;
  };
  positivePercentage: number; // Percentage of 4-5 star ratings
  verifiedTransactions: number;
}

export interface RatingRequest {
  orderId: string;
  revieweeId: string;
  score: number; // 1-5
  comment?: string;
  category?: 'communication' | 'reliability' | 'quality' | 'speed' | 'overall';
}

export interface RatingResponse {
  success: boolean;
  rating: Rating;
  newStats: RatingStats;
  message: string;
}

export interface RatingQuery {
  userId?: string; // Get ratings for specific user
  reviewerId?: string; // Get ratings by specific reviewer
  orderId?: string; // Get ratings for specific order
  minScore?: number;
  maxScore?: number;
  category?: string;
  context?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'date' | 'score';
  sortDir?: 'asc' | 'desc';
}

export interface RatingBadge {
  level: 'new' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  color: string;
  icon: string;
  minRating: number;
  minTransactions: number;
}

export interface RatingPermission {
  canRate: boolean;
  reason?: string; // Why user can't rate
  existingRating?: Rating; // If already rated
  deadline?: string; // Rating deadline (e.g., 30 days after order)
}

export const RATING_CATEGORIES = [
  { value: 'overall', label: 'Overall Experience' },
  { value: 'communication', label: 'Communication' },
  { value: 'reliability', label: 'Reliability' },
  { value: 'quality', label: 'Quality' },
  { value: 'speed', label: 'Speed/Efficiency' },
] as const;

export const RATING_BADGES: Record<string, RatingBadge> = {
  new: {
    level: 'new',
    color: '#9e9e9e',
    icon: '🆕',
    minRating: 0,
    minTransactions: 0,
  },
  bronze: {
    level: 'bronze',
    color: '#cd7f32',
    icon: '🥉',
    minRating: 3.5,
    minTransactions: 5,
  },
  silver: {
    level: 'silver',
    color: '#c0c0c0',
    icon: '🥈',
    minRating: 4.0,
    minTransactions: 15,
  },
  gold: {
    level: 'gold',
    color: '#ffd700',
    icon: '🥇',
    minRating: 4.5,
    minTransactions: 30,
  },
  platinum: {
    level: 'platinum',
    color: '#e5e4e2',
    icon: '💎',
    minRating: 4.7,
    minTransactions: 50,
  },
  diamond: {
    level: 'diamond',
    color: '#b9f2ff',
    icon: '💎',
    minRating: 4.9,
    minTransactions: 100,
  },
};

export function getUserBadge(stats: RatingStats): RatingBadge {
  if (stats.averageRating >= 4.9 && stats.totalRatings >= 100) return RATING_BADGES.diamond;
  if (stats.averageRating >= 4.7 && stats.totalRatings >= 50) return RATING_BADGES.platinum;
  if (stats.averageRating >= 4.5 && stats.totalRatings >= 30) return RATING_BADGES.gold;
  if (stats.averageRating >= 4.0 && stats.totalRatings >= 15) return RATING_BADGES.silver;
  if (stats.averageRating >= 3.5 && stats.totalRatings >= 5) return RATING_BADGES.bronze;
  return RATING_BADGES.new;
}
