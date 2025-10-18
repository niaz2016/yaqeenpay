// src/services/ratingService.ts

import apiService from './api';
import logger from '../utils/logger';
import type {
  Rating,
  RatingStats,
  RatingRequest,
  RatingResponse,
  RatingQuery,
  RatingPermission,
} from '../types/rating';

class RatingService {
  /**
   * Submit a rating for a user after order completion/rejection
   */
  async submitRating(request: RatingRequest): Promise<RatingResponse> {
    try {
      logger.info('Submitting rating', { orderId: request.orderId, score: request.score });
      const response = await apiService.post<RatingResponse>('/ratings', request);
      logger.info('Rating submitted successfully', { ratingId: response.rating.id });
      return response;
    } catch (error) {
      logger.error('Failed to submit rating', error);
      throw error;
    }
  }

  /**
   * Get ratings for a specific user (as reviewee)
   */
  async getRatingsByUser(userId: string, query?: RatingQuery): Promise<Rating[]> {
    try {
      const params = new URLSearchParams();
      params.append('userId', userId);
      if (query?.page) params.append('page', query.page.toString());
      if (query?.pageSize) params.append('pageSize', query.pageSize.toString());
      if (query?.sortBy) params.append('sortBy', query.sortBy);
      if (query?.sortDir) params.append('sortDir', query.sortDir);
      if (query?.category) params.append('category', query.category);
      if (query?.minScore) params.append('minScore', query.minScore.toString());

      const response = await apiService.get<Rating[]>(`/ratings?${params.toString()}`);
      return response;
    } catch (error) {
      logger.error('Failed to fetch ratings', error);
      throw error;
    }
  }

  /**
   * Get rating statistics for a user
   */
  async getRatingStats(userId: string): Promise<RatingStats> {
    try {
      const response = await apiService.get<RatingStats>(`/ratings/stats/${userId}`);
      return response;
    } catch (error) {
      logger.error('Failed to fetch rating stats', error);
      throw error;
    }
  }

  /**
   * Get ratings for a specific order
   */
  async getRatingsByOrder(orderId: string): Promise<Rating[]> {
    try {
      const response = await apiService.get<Rating[]>(`/ratings/order/${orderId}`);
      return response;
    } catch (error) {
      logger.error('Failed to fetch order ratings', error);
      throw error;
    }
  }

  /**
   * Check if user can rate another user for an order
   */
  async checkRatingPermission(orderId: string, revieweeId: string): Promise<RatingPermission> {
    try {
      const response = await apiService.get<RatingPermission>(
        `/ratings/permission?orderId=${orderId}&revieweeId=${revieweeId}`
      );
      return response;
    } catch (error) {
      logger.error('Failed to check rating permission', error);
      throw error;
    }
  }

  /**
   * Update an existing rating (within time limit)
   */
  async updateRating(ratingId: string, request: RatingRequest): Promise<Rating> {
    try {
      logger.info('Updating rating', { ratingId, score: request.score });
      const response = await apiService.put<Rating>(`/ratings/${ratingId}`, request);
      logger.info('Rating updated successfully');
      return response;
    } catch (error) {
      logger.error('Failed to update rating', error);
      throw error;
    }
  }

  /**
   * Delete a rating (admin only or within time limit)
   */
  async deleteRating(ratingId: string): Promise<{ success: boolean; message: string }> {
    try {
      logger.info('Deleting rating', { ratingId });
      const response = await apiService.delete<{ success: boolean; message: string }>(
        `/ratings/${ratingId}`
      );
      return response;
    } catch (error) {
      logger.error('Failed to delete rating', error);
      throw error;
    }
  }

  /**
   * Get ratings given by a user (as reviewer)
   */
  async getRatingsGivenByUser(userId: string, query?: RatingQuery): Promise<Rating[]> {
    try {
      const params = new URLSearchParams();
      params.append('reviewerId', userId);
      if (query?.page) params.append('page', query.page.toString());
      if (query?.pageSize) params.append('pageSize', query.pageSize.toString());
      if (query?.sortBy) params.append('sortBy', query.sortBy);
      if (query?.sortDir) params.append('sortDir', query.sortDir);

      const response = await apiService.get<Rating[]>(`/ratings?${params.toString()}`);
      return response;
    } catch (error) {
      logger.error('Failed to fetch ratings given by user', error);
      throw error;
    }
  }

  /**
   * ADMIN: Get all ratings with filters
   */
  async getAllRatings(query?: RatingQuery): Promise<{ items: Rating[]; total: number }> {
    try {
      const params = new URLSearchParams();
      if (query?.page) params.append('page', query.page.toString());
      if (query?.pageSize) params.append('pageSize', query.pageSize.toString());
      if (query?.sortBy) params.append('sortBy', query.sortBy);
      if (query?.sortDir) params.append('sortDir', query.sortDir);
      if (query?.minScore) params.append('minScore', query.minScore.toString());
      if (query?.maxScore) params.append('maxScore', query.maxScore.toString());
      if (query?.category) params.append('category', query.category);

      const response = await apiService.get<{ items: Rating[]; total: number }>(
        `/admin/ratings?${params.toString()}`
      );
      return response;
    } catch (error) {
      logger.error('Failed to fetch all ratings', error);
      throw error;
    }
  }

  /**
   * ADMIN: Get rating statistics for the platform
   */
  async getPlatformStats(): Promise<{
    totalRatings: number;
    averageRating: number;
    ratingsByCategory: Record<string, number>;
    ratingsByScore: Record<number, number>;
    topRatedUsers: Array<{ userId: string; userName: string; averageRating: number; totalRatings: number }>;
  }> {
    try {
      const response = await apiService.get<{
        totalRatings: number;
        averageRating: number;
        ratingsByCategory: Record<string, number>;
        ratingsByScore: Record<number, number>;
        topRatedUsers: Array<{ userId: string; userName: string; averageRating: number; totalRatings: number }>;
      }>(`/admin/ratings/stats`);
      return response;
    } catch (error) {
      logger.error('Failed to fetch platform rating stats', error);
      throw error;
    }
  }
}

const ratingService = new RatingService();
export default ratingService;
