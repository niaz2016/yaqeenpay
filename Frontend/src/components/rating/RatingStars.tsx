// src/components/rating/RatingStars.tsx
import React from 'react';
import { Box, Rating as MuiRating, Typography } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';

interface RatingStarsProps {
  value: number;
  total?: number;
  size?: 'small' | 'medium' | 'large';
  showValue?: boolean;
  showTotal?: boolean;
  readonly?: boolean;
  onChange?: (value: number) => void;
}

const RatingStars: React.FC<RatingStarsProps> = ({
  value,
  total,
  size = 'medium',
  showValue = true,
  showTotal = false,
  readonly = true,
  onChange,
}) => {
  const sizeMap = {
    small: { fontSize: 16, textVariant: 'body2' as const },
    medium: { fontSize: 20, textVariant: 'body1' as const },
    large: { fontSize: 28, textVariant: 'h6' as const },
  };

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <MuiRating
        value={value}
        precision={readonly ? 0.1 : 1}
        readOnly={readonly}
        onChange={(_, newValue) => onChange && onChange(newValue || 0)}
        size={size}
        icon={<StarIcon fontSize="inherit" />}
        emptyIcon={<StarIcon fontSize="inherit" />}
        sx={{ fontSize: sizeMap[size].fontSize }}
      />
      {showValue && (
        <Typography variant={sizeMap[size].textVariant} color="text.secondary">
          {readonly ? value.toFixed(1) : value}
        </Typography>
      )}
      {showTotal && total !== undefined && (
        <Typography variant="body2" color="text.secondary">
          ({total} {total === 1 ? 'review' : 'reviews'})
        </Typography>
      )}
    </Box>
  );
};

export default RatingStars;
