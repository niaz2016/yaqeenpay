// src/components/rating/RatingBadge.tsx
import React from 'react';
import { Chip, Tooltip } from '@mui/material';
import { getUserBadge } from '../../types/rating';
import type { RatingStats } from '../../types/rating';

interface RatingBadgeProps {
  stats: RatingStats;
  size?: 'small' | 'medium';
  showLabel?: boolean;
}

const RatingBadge: React.FC<RatingBadgeProps> = ({ stats, size = 'small', showLabel = true }) => {
  const badge = getUserBadge(stats);

  const tooltip = `${badge.level.toUpperCase()} - ${stats.averageRating.toFixed(1)}⭐ (${stats.totalRatings} reviews)`;

  return (
    <Tooltip title={tooltip} arrow>
      <Chip
        label={showLabel ? `${badge.icon} ${badge.level.toUpperCase()}` : badge.icon}
        size={size}
        sx={{
          backgroundColor: badge.color,
          color: badge.level === 'gold' || badge.level === 'platinum' ? '#000' : '#fff',
          fontWeight: 'bold',
          fontSize: size === 'small' ? '0.7rem' : '0.8rem',
        }}
      />
    </Tooltip>
  );
};

export default RatingBadge;
