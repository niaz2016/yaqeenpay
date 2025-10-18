// src/components/rating/RatingsList.tsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
} from '@mui/material';
import RatingCard from './RatingCard';
import ratingService from '../../services/ratingService';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import type { Rating } from '../../types/rating';

interface RatingsListProps {
  userId: string;
  showFilters?: boolean;
}

const RatingsList: React.FC<RatingsListProps> = ({ userId, showFilters = true }) => {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'buyer' | 'seller'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { handleError } = useErrorHandler();

  useEffect(() => {
    loadRatings();
  }, [userId, filter, sortBy, page]);

  const loadRatings = async () => {
    setLoading(true);
    try {
      const data = await ratingService.getRatingsByUser(userId, {
        page,
        pageSize: 10,
        sortBy,
        sortDir: 'desc',
      });

      // Filter by role if needed
      let filteredData = data;
      if (filter === 'buyer') {
        filteredData = data.filter((r) => r.revieweeRole === 'buyer');
      } else if (filter === 'seller') {
        filteredData = data.filter((r) => r.revieweeRole === 'seller');
      }

      setRatings(filteredData);
      setTotalPages(Math.ceil(data.length / 10));
    } catch (error) {
      handleError(error, 'RatingsList.loadRatings', 'Failed to load ratings');
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

  if (ratings.length === 0) {
    return (
      <Alert severity="info">
        No ratings yet. Complete transactions to receive ratings.
      </Alert>
    );
  }

  return (
    <Box>
      {showFilters && (
        <Box display="flex" gap={2} mb={3} flexWrap="wrap">
          <Tabs value={filter} onChange={(_, v) => setFilter(v)}>
            <Tab label="All Ratings" value="all" />
            <Tab label="As Buyer" value="buyer" />
            <Tab label="As Seller" value="seller" />
          </Tabs>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Sort By</InputLabel>
            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'date' | 'score')} label="Sort By">
              <MenuItem value="date">Most Recent</MenuItem>
              <MenuItem value="score">Highest Rating</MenuItem>
            </Select>
          </FormControl>
        </Box>
      )}

      <Box>
        {ratings.map((rating) => (
          <RatingCard key={rating.id} rating={rating} />
        ))}
      </Box>

      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
};

export default RatingsList;
