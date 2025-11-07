import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardMedia,
  CardContent,
  Skeleton
} from '@mui/material';
import { Link } from 'react-router-dom';
import { normalizeImageUrl, placeholderDataUri } from '../../utils/image';
import { buildProductPath } from '../../utils/slug';
import { getRecentlyViewed } from '../../hooks/useProductCache';
import productService from '../../services/productService';
import type { ProductDetail } from '../../types/product';

interface RecentlyViewedProps {
  currentProductId?: string;
  maxItems?: number;
}

const RecentlyViewedProducts: React.FC<RecentlyViewedProps> = ({
  currentProductId,
  maxItems = 4
}) => {
  const recentProductIds = getRecentlyViewed()
    .filter(id => id !== currentProductId)
    .slice(0, maxItems);

  if (recentProductIds.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        Recently Viewed
      </Typography>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' } }}>
        {recentProductIds.map((productId) => (
          <Box key={productId}>
            <RecentProductCard productId={productId} />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

const RecentProductCard: React.FC<{ productId: string }> = ({ productId }) => {
  const [product, setProduct] = React.useState<ProductDetail | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchProduct = async () => {
      try {
        // Use productService to respect apiService behavior (baseURL, auth, unwrapping)
        const data = await productService.getProduct(productId);
        setProduct(data as ProductDetail);
      } catch (error) {
        console.error('Error fetching recent product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  if (loading) {
    return (
      <Card>
        <Skeleton variant="rectangular" height={200} />
        <CardContent>
          <Skeleton variant="text" width="80%" />
          <Skeleton variant="text" width="60%" />
        </CardContent>
      </Card>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <Card
      component={Link}
  to={buildProductPath(product.id, product.name)}
      sx={{
        textDecoration: 'none',
        color: 'inherit',
        display: 'block',
        height: '100%',
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)'
        }
      }}
    >
      <CardMedia
        component="img"
        height={200}
        image={normalizeImageUrl(product.images[0]?.imageUrl || '') || placeholderDataUri(200)}
        alt={product.name}
        sx={{ objectFit: 'contain', bgcolor: '#f5f5f5' }}
      />
      <CardContent>
        <Typography variant="subtitle1" noWrap>
          {product.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: product.currency
          }).format(product.effectivePrice)}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default RecentlyViewedProducts;