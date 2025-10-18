// src/components/rating/RatingSummary.tsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import RatingStars from './RatingStars';
import RatingBadge from './RatingBadge';
import ratingService from '../../services/ratingService';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import type { RatingStats } from '../../types/rating';

interface RatingSummaryProps {
  userId: string;
  compact?: boolean;
}

const RatingSummary: React.FC<RatingSummaryProps> = ({ userId, compact = false }) => {
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { handleError } = useErrorHandler();

  useEffect(() => {
    loadStats();
  }, [userId]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await ratingService.getRatingStats(userId);
      setStats(data);
    } catch (error) {
      handleError(error, 'RatingSummary.loadStats', 'Failed to load rating statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (!stats || stats.totalRatings === 0) {
    return (
      <Alert severity="info">
        No ratings yet. Complete transactions to build reputation.
      </Alert>
    );
  }

  if (compact) {
    return (
      <Box display="flex" alignItems="center" gap={2}>
        <RatingStars value={stats.averageRating} total={stats.totalRatings} showTotal size="small" />
        <RatingBadge stats={stats} size="small" />
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              {stats.averageRating.toFixed(1)}
            </Typography>
            <RatingStars value={stats.averageRating} showValue={false} size="medium" />
            <Typography variant="body2" color="text.secondary">
              Based on {stats.totalRatings} {stats.totalRatings === 1 ? 'review' : 'reviews'}
            </Typography>
          </Box>
          <RatingBadge stats={stats} size="medium" />
        </Box>

        {/* Rating Distribution */}
        <Box mb={3}>
          <Typography variant="subtitle2" gutterBottom>
            Rating Distribution
          </Typography>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = stats.ratingDistribution[star as keyof typeof stats.ratingDistribution];
            const percentage = stats.totalRatings > 0 ? (count / stats.totalRatings) * 100 : 0;
            return (
              <Box key={star} display="flex" alignItems="center" gap={1} mb={0.5}>
                <Typography variant="body2" width={20}>
                  {star}
                </Typography>
                <StarIcon fontSize="small" color="warning" />
                <LinearProgress
                  variant="determinate"
                  value={percentage}
                  sx={{ flex: 1, height: 8, borderRadius: 4 }}
                />
                <Typography variant="body2" color="text.secondary" width={40} textAlign="right">
                  {count}
                </Typography>
              </Box>
            );
          })}
        </Box>

        {/* Category Averages */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Category Ratings
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(stats.categoryAverages).map(([category, avg]) => (
              <Grid size={{ xs: 6 }} key={category}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <StarIcon fontSize="small" color="warning" />
                    <Typography variant="body2" fontWeight="bold">
                      {avg.toFixed(1)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Buyer/Seller Stats */}
        {(stats.asBuyer.totalRatings > 0 || stats.asSeller.totalRatings > 0) && (
          <Box mt={3}>
            <Typography variant="subtitle2" gutterBottom>
              Role Performance
            </Typography>
            <Grid container spacing={2}>
              {stats.asBuyer.totalRatings > 0 && (
                <Grid size={{ xs: 6 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      As Buyer
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {stats.asBuyer.averageRating.toFixed(1)} ⭐
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {stats.asBuyer.totalRatings} reviews
                    </Typography>
                  </Box>
                </Grid>
              )}
              {stats.asSeller.totalRatings > 0 && (
                <Grid size={{ xs: 6 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      As Seller
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {stats.asSeller.averageRating.toFixed(1)} ⭐
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {stats.asSeller.totalRatings} reviews
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
        )}

        {/* Positive Percentage */}
        <Box mt={2} p={2} bgcolor="success.light" borderRadius={1}>
          <Typography variant="body2" textAlign="center">
            <strong>{stats.positivePercentage.toFixed(0)}%</strong> positive ratings (4-5 stars)
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default RatingSummary;
