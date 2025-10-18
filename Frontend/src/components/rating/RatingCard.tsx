// src/components/rating/RatingCard.tsx
import React from 'react';
import { Card, CardContent, Typography, Box, Avatar, Chip } from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import RatingStars from './RatingStars';
import type { Rating } from '../../types/rating';
import { format } from 'date-fns';

interface RatingCardProps {
  rating: Rating;
}

const RatingCard: React.FC<RatingCardProps> = ({ rating }) => {
  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Box display="flex" gap={2} alignItems="center">
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              {rating.reviewerName.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {rating.reviewerName}
                </Typography>
                {rating.isVerified && (
                  <Chip
                    icon={<VerifiedIcon />}
                    label="Verified"
                    size="small"
                    color="success"
                    sx={{ height: 20 }}
                  />
                )}
              </Box>
              <Typography variant="caption" color="text.secondary">
                {rating.reviewerRole === 'buyer' ? 'Buyer' : 'Seller'} • {format(new Date(rating.createdAt), 'MMM dd, yyyy')}
              </Typography>
            </Box>
          </Box>
          <RatingStars value={rating.score} showValue={false} size="small" />
        </Box>

        {rating.comment && (
          <Typography variant="body2" color="text.primary" mt={2}>
            {rating.comment}
          </Typography>
        )}

        <Box display="flex" gap={1} mt={2}>
          <Chip
            label={rating.category.replace('_', ' ').toUpperCase()}
            size="small"
            variant="outlined"
          />
          {rating.orderCode && (
            <Chip
              label={`Order: ${rating.orderCode}`}
              size="small"
              variant="outlined"
              color="primary"
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default RatingCard;
