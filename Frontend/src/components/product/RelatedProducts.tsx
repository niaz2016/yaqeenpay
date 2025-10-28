import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Chip,
  Skeleton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { normalizeImageUrl, placeholderDataUri } from '../../utils/image';
import type { ProductDetail } from '../../types/product';

interface RelatedProductsProps {
  products: ProductDetail[];
  loading: boolean;
  currentProductId: string;
}

const RelatedProducts: React.FC<RelatedProductsProps> = ({
  products,
  loading,
  currentProductId
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (loading) {
    return (
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(2, 1fr)',
          sm: 'repeat(3, 1fr)',
          md: 'repeat(4, 1fr)'
        },
        gap: { xs: 1, sm: 2 }
      }}>
        {[...Array(4)].map((_, index) => (
          <Card key={index}>
            <Skeleton variant="rectangular" height={160} />
            <CardContent>
              <Skeleton variant="text" />
              <Skeleton variant="text" width="60%" />
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  }

  if (products.length === 0) {
    return null;
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(price);
  };

  return (
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: {
        xs: 'repeat(2, 1fr)',
        sm: 'repeat(3, 1fr)',
        md: 'repeat(4, 1fr)'
      },
      gap: { xs: 1, sm: 2 }
    }}>
      {products
        .filter(product => product.id !== currentProductId)
        .map(product => (
          <Card
            key={product.id}
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              cursor: 'pointer'
            }}
            onClick={() => navigate(`/products/${product.id}`)}
          >
            <CardMedia
              component="img"
              height={isMobile ? 120 : 160}
              image={normalizeImageUrl(product.images[0]?.imageUrl || '') || placeholderDataUri(300)}
              alt={product.name}
              sx={{
                objectFit: 'cover',
                backgroundColor: '#f5f5f5'
              }}
            />
            <CardContent sx={{ flexGrow: 1, p: isMobile ? 1 : 2 }}>
              <Typography
                variant="subtitle1"
                component="h3"
                sx={{
                  fontWeight: 'medium',
                  mb: 1,
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {product.name}
              </Typography>

              <Box sx={{ mt: 'auto' }}>
                {product.isOnSale ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="body1" color="error" fontWeight="bold">
                      {formatPrice(product.effectivePrice, product.currency)}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ textDecoration: 'line-through', color: 'text.secondary' }}
                    >
                      {formatPrice(product.price, product.currency)}
                    </Typography>
                    <Chip
                      label={`${Math.round(product.discountPercentage)}% OFF`}
                      color="error"
                      size="small"
                      sx={{ height: 20 }}
                    />
                  </Box>
                ) : (
                  <Typography variant="body1" fontWeight="bold">
                    {formatPrice(product.price, product.currency)}
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        ))}
    </Box>
  );
};

export default RelatedProducts;