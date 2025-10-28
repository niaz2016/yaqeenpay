import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import productService from '../services/productService';
import { useProductCache } from '../hooks/useProductCache';
import Breadcrumbs from '../components/common/Breadcrumbs';
import ShareMenu from '../components/common/ShareMenu';
import WishlistButton from '../components/product/WishlistButton';
import { useWishlist } from '../context/WishlistContext';
import LazyImage from '../components/common/LazyImage';
import ProductImageModal from '../components/product/ProductImageModal';

const RelatedProducts = lazy(() => import('../components/product/RelatedProducts'));
import type { ProductDetail, ProductImage } from '../types/product';
import {
  Box,
  Typography,
  Button,
  Card,
  CardMedia,
  Chip,
  Divider,
  Modal,
  Rating,
  Alert,
  CircularProgress,
  Paper,
  IconButton,
  useTheme,
  useMediaQuery,
  TextField,
  Skeleton,
} from '@mui/material';

import {
  ArrowBack as ArrowBackIcon,
  ShoppingCart as CartIcon,
  Favorite as FavoriteIcon,
  Share as ShareIcon,
  Store as StoreIcon,
  Close as CloseIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import cartService from '../services/cartService';
import { normalizeImageUrl, placeholderDataUri } from '../utils/image';

const ProductDetailPage: React.FC<{}> = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isInWishlist } = useWishlist();
  const { product, loading, error } = useProductCache(id);

  const handleImageClick = () => {
    setImageModalOpen(true);
    setModalImageZoom(1);
    setModalImagePosition({ x: 0, y: 0 });
  };

  const handleModalClose = () => {
    setImageModalOpen(false);
    setModalImageZoom(1);
    setModalImagePosition({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setModalImageZoom(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setModalImageZoom(prev => Math.max(prev - 0.5, 1));
  };
  
  // Cart states
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);
  
  // Image gallery states
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [modalImageZoom, setModalImageZoom] = useState(1);
  const [modalImagePosition, setModalImagePosition] = useState({ x: 0, y: 0 });
  const [clickTimeout, setClickTimeout] = useState<number | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductDetail[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  const isSeller = user?.roles?.some((role: string) => role.toLowerCase() === 'seller');

  const handleAddToCart = async () => {
    if (!product) return;

    try {
      setAddingToCart(true);
      setCartError(null);
      
      const success = cartService.addToCart(product, quantity);
      
      if (success) {
        setAddedToCart(true);
        setQuantity(1);
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setAddedToCart(false);
        }, 3000);
      } else {
        setCartError('Failed to add product to cart. Please check stock availability.');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      setCartError('Error adding product to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchRelatedProducts();
    }
  }, [id]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (clickTimeout) {
        clearTimeout(clickTimeout);
      }
    };
  }, [clickTimeout]);

  const fetchRelatedProducts = async () => {
    if (!id) return;

    try {
      setLoadingRelated(true);
      const relatedData = await productService.getRelatedProducts(id).catch(() => []);
      if (Array.isArray(relatedData)) {
        const mappedProducts = relatedData.map(p => ({
          ...p,
          minOrderQuantity: p.minOrderQuantity || 1,
          maxOrderQuantity: p.maxOrderQuantity || 999999,
          images: p.images || [],
          price: p.price || 0,
          effectivePrice: p.effectivePrice || p.price || 0
        }));
        setRelatedProducts(mappedProducts);
      }
    } catch (error) {
      console.error('Error fetching related products:', error);
      // Don't show error UI for related products failure
    } finally {
      setLoadingRelated(false);
    }
  };

  // Add structured data when product loads
  useEffect(() => {
    if (!product) return;

    // Create canonical URL
    const href = window.location.href;
    document.querySelector('link[rel="canonical"]')?.remove();
    const linkEl = document.createElement('link');
    linkEl.rel = 'canonical';
    linkEl.href = href;
    document.head.appendChild(linkEl);

    // JSON-LD structured data for Product
    const productSchema: any = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      image: product.images?.map(img => normalizeImageUrl(img?.imageUrl || img?.ImageUrl || '')).filter(Boolean) ?? [],
      offers: {
        '@type': 'Offer',
        price: (product.effectivePrice ?? 0).toString(),
        priceCurrency: 'PKR',
        availability: product.isInStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        seller: {
          '@type': 'Organization',
          name: product.seller?.businessName || 'YaqeenPay Seller'
        }
      }
    };

    // Add aggregateRating if reviews exist
    if (product.reviewCount && product.reviewCount > 0 && product.averageRating) {
      productSchema.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: (product.averageRating ?? 0).toString(),
        reviewCount: (product.reviewCount ?? 0).toString()
      };
    }

    const addJsonLd = (data: any) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(data);
      document.head.appendChild(script);
      return script;
    };

    const scriptElement = addJsonLd(productSchema);

    return () => {
      // Cleanup
      scriptElement.remove();
    };
  }, [product]);

  useEffect(() => {
    if (product) {
      setQuantity(Math.max(1, product.minOrderQuantity ?? 1));
    }
  }, [product]);



  const handleQuantityChange = (newValue: number) => {
    if (!product) return;
    const min = product.minOrderQuantity ?? 1;
    const maxOrder = product.maxOrderQuantity ?? 999999;
    const stock = product.stockQuantity ?? 0;
    const max = Math.max(1, Math.min(maxOrder, stock));
    const validQuantity = Math.max(min, Math.min(max, newValue));
    setQuantity(validQuantity);
  };

  if (loading) {
    // Structured skeletons to improve perceived performance while product details load
    return (
      <Box sx={{ display: 'flex', gap: 2, p: { xs: 1, sm: 2, md: 3 } }}>
        <Box sx={{ flex: '0 0 50%', minWidth: 280 }}>
          <Skeleton variant="rectangular" height={360} />
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <Skeleton variant="rectangular" width={64} height={64} />
            <Skeleton variant="rectangular" width={64} height={64} />
            <Skeleton variant="rectangular" width={64} height={64} />
          </Box>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="60%" height={48} />
          <Skeleton variant="text" width="30%" height={36} />
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <Skeleton variant="rectangular" width={88} height={32} />
            <Skeleton variant="rectangular" width={88} height={32} />
          </Box>
          <Skeleton variant="rectangular" height={120} sx={{ mt: 2 }} />
          <Skeleton variant="rectangular" height={40} sx={{ mt: 2, width: 160 }} />
          <Box sx={{ mt: 4 }}>
            <Skeleton variant="text" width="40%" />
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <Skeleton variant="rectangular" width={160} height={200} />
              <Skeleton variant="rectangular" width={160} height={200} />
              <Skeleton variant="rectangular" width={160} height={200} />
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {error}
        </Alert>
      </Box>
    );
  }

  const handleModalImageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (clickTimeout) {
      // This is a double-click
      clearTimeout(clickTimeout);
      setClickTimeout(null);
      if (modalImageZoom === 1) {
        // Zoom in to 2x on double click
        setModalImageZoom(2);
      } else {
        // If already zoomed, zoom out to fit window
        setModalImageZoom(1);
        setModalImagePosition({ x: 0, y: 0 });
      }
    } else {
      // This might be a single click, wait to see if double-click follows
      const timeout = window.setTimeout(() => {
        // This is a confirmed single-click
        if (modalImageZoom > 1) {
          // Single click when zoomed - zoom out to fit window
          setModalImageZoom(1);
          setModalImagePosition({ x: 0, y: 0 });
        }
        setClickTimeout(null);
      }, 250); // Wait 250ms for potential double-click
      
      setClickTimeout(timeout);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalImageZoom > 1) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      setModalImagePosition({ 
        x: (x - 0.5) * (modalImageZoom - 1) * 100, 
        y: (y - 0.5) * (modalImageZoom - 1) * 100 
      });
    }
  };

  if (!product) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h5" color="text.secondary">
          Product not found
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/marketplace')}
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
        >
          Back to Marketplace
        </Button>
      </Box>
    );
  }

  // Loading state
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '50vh',
        p: { xs: 1, sm: 2, md: 3 }
      }}>
        <CircularProgress size={60} />
        <Typography sx={{ mt: 2 }}>Loading product details...</Typography>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ 
        p: { xs: 1, sm: 2, md: 3 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <Alert severity="error" sx={{ mb: 2, width: '100%', maxWidth: 600 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          onClick={() => navigate('/marketplace')}
          startIcon={<ArrowBackIcon />}
        >
          Back to Marketplace
        </Button>
      </Box>
    );
  }

  // No product found
  if (!product) {
    return (
      <Box sx={{ 
        p: { xs: 1, sm: 2, md: 3 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <Alert severity="info" sx={{ mb: 2, width: '100%', maxWidth: 600 }}>
          Product not found
        </Alert>
        <Button
          variant="contained"
          onClick={() => navigate('/marketplace')}
          startIcon={<ArrowBackIcon />}
        >
          Back to Marketplace
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Back button and breadcrumbs */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Breadcrumbs
          items={[
            { label: 'Marketplace', href: '/marketplace' },
            { label: product.category?.name || 'Products', href: `/marketplace?category=${product.category?.id}` },
            { label: product.name }
          ]}
        />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <WishlistButton 
            product={product}
            initialState={isInWishlist(product.id)}
          />
          <ShareMenu
            title={product.name}
            description={product.description || ''}
            image={normalizeImageUrl(product.images?.[0]?.imageUrl || product.images?.[0]?.ImageUrl) || ''}
          />
        </Box>
      </Box>

      {/* Main content grid */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
        gap: { xs: 2, md: 4 } 
      }}>
        {/* Image Gallery */}
        <Card>
          <Box sx={{ position: 'relative' }}>
            <LazyImage
              src={normalizeImageUrl(product.images?.[selectedImageIndex]?.imageUrl || product.images?.[selectedImageIndex]?.ImageUrl) || placeholderDataUri(600)}
              alt={product.name}
              lowResSrc={placeholderDataUri(100)}
              aspectRatio={4/3}
              style={{
                cursor: 'zoom-in'
              }}
              onClick={() => setImageModalOpen(true)}
            />
            {product.isOnSale && (
              <Chip
                label="SALE"
                color="error"
                size="small"
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16
                }}
              />
            )}
          </Box>
          
          {/* Thumbnails */}
          {product.images?.length > 1 && (
            <Box sx={{ 
              display: 'flex', 
              gap: 1, 
              p: 1, 
              overflowX: 'auto' 
            }}>
              {(product.images || []).map((image: ProductImage, index: number) => (
                <Box
                  key={image.id}
                  onClick={() => setSelectedImageIndex(index)}
                  sx={{
                    width: 60,
                    height: 60,
                    flexShrink: 0,
                    cursor: 'pointer',
                    border: index === selectedImageIndex ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
                    overflow: 'hidden'
                  }}
                >
                  <img
                    src={normalizeImageUrl(image.imageUrl || image.ImageUrl || '') || placeholderDataUri(60)}
                    alt={image.altText || image.AltText || `Product image ${index + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </Box>
              ))}
            </Box>
          )}
        </Card>

        {/* Product Details */}
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {product.name}
          </Typography>

          {/* Seller info */}
          {product.seller && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <StoreIcon color="action" />
              <Typography variant="body2" color="text.secondary">
                Sold by: {product.seller.businessName}
              </Typography>
            </Box>
          )}

          {/* Price section */}
          <Box sx={{ mb: 3 }}>
            {product.isOnSale ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h5" color="error">
                  {new Intl.NumberFormat('en-PK', {
                    style: 'currency',
                    currency: 'PKR',
                    currencyDisplay: 'code'
                  }).format(product.effectivePrice)}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ textDecoration: 'line-through', color: 'text.secondary' }}
                >
                  {new Intl.NumberFormat('en-PK', {
                    style: 'currency',
                    currency: 'PKR',
                    currencyDisplay: 'code'
                  }).format(product.price)}
                </Typography>
                <Chip
                  label={`${Math.round(product.discountPercentage)}% OFF`}
                  color="error"
                  size="small"
                />
              </Box>
            ) : (
              <Typography variant="h5">
                {new Intl.NumberFormat('en-PK', {
                  style: 'currency',
                  currency: 'PKR',
                  currencyDisplay: 'code'
                }).format(product.price)}
              </Typography>
            )}
          </Box>

          {/* Stock status */}
          <Box sx={{ mb: 3 }}>
            {product.stockQuantity > 0 ? (
              <Chip
                label={`${product.stockQuantity} in stock`}
                color="success"
                variant="outlined"
                size="small"
              />
            ) : (
              <Chip
                label="Out of stock"
                color="error"
                variant="outlined"
                size="small"
              />
            )}
          </Box>

          {/* Add to cart section */}
          {!isSeller && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  type="number"
                  label="Quantity"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value))}
                  InputProps={{
                    inputProps: {
                      min: product.minOrderQuantity || 1,
                      max: Math.min(product.maxOrderQuantity || 999999, product.stockQuantity)
                    }
                  }}
                  sx={{ width: 100 }}
                />
                <Button
                  variant="contained"
                  startIcon={<CartIcon />}
                  onClick={handleAddToCart}
                  disabled={addingToCart || product.stockQuantity === 0}
                  sx={{ flexGrow: 1 }}
                >
                  {addingToCart ? 'Adding...' : 'Add to Cart'}
                </Button>
              </Box>
              {(addedToCart || cartError) && (
                <Alert 
                  severity={addedToCart ? "success" : "error"}
                  onClose={() => addedToCart ? setAddedToCart(false) : setCartError(null)}
                >
                  {addedToCart ? "Added to cart successfully!" : cartError}
                </Alert>
              )}
            </Box>
          )}

          {/* Description */}
          <Typography variant="h6" gutterBottom>
            Description
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, whiteSpace: 'pre-line' }}>
            {product.description}
          </Typography>

          {/* Product details/specs */}
          <Typography variant="h6" gutterBottom>
            Product Details
          </Typography>
          <Box component="dl" sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 2, mb: 3 }}>
            {product.brand && (
              <>
                <Typography component="dt" color="text.secondary">Brand:</Typography>
                <Typography component="dd" sx={{ m: 0 }}>{product.brand}</Typography>
              </>
            )}
            {product.model && (
              <>
                <Typography component="dt" color="text.secondary">Model:</Typography>
                <Typography component="dd" sx={{ m: 0 }}>{product.model}</Typography>
              </>
            )}
            {product.sku && (
              <>
                <Typography component="dt" color="text.secondary">SKU:</Typography>
                <Typography component="dd" sx={{ m: 0 }}>{product.sku}</Typography>
              </>
            )}
            {Object.entries(product.attributes || {}).map(([key, value]) => (
              <React.Fragment key={key}>
                <Typography component="dt" color="text.secondary">{key}:</Typography>
                <Typography component="dd" sx={{ m: 0 }}>{value}</Typography>
              </React.Fragment>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Image Modal */}
      <ProductImageModal
        open={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        imageUrl={normalizeImageUrl(product.images?.[selectedImageIndex]?.imageUrl || product.images?.[selectedImageIndex]?.ImageUrl) || placeholderDataUri(1200)}
        altText={product.name}
        zoom={modalImageZoom}
        position={modalImagePosition}
        onZoomIn={() => setModalImageZoom(z => Math.min(3, z + 0.5))}
        onZoomOut={() => setModalImageZoom(z => Math.max(1, z - 0.5))}
        onSetZoom={(z) => setModalImageZoom(Math.max(1, Math.min(3, z)))}
        onImageClick={handleModalImageClick}
        onMouseMove={handleMouseMove}
      />
    </Box>
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      currencyDisplay: 'code'
    }).format(price);
  };

  const getImageUrl = (imageUrl: string) => {
    if (imageUrl && imageUrl.trim() !== '') {
      // Use centralized image URL normalization for proper mobile/backend resolution
      return normalizeImageUrl(imageUrl) || placeholderDataUri(600, '#F5F5F5');
    }
    return placeholderDataUri(600, '#F5F5F5');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/marketplace')}
        >
          Back to Marketplace
        </Button>
      </Box>
    );
  }

  if (!product) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          Product not found
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/marketplace')}
          sx={{ mt: 2 }}
        >
          Back to Marketplace
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton
          onClick={() => navigate('/marketplace')}
          sx={{ mr: 2 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
          {product?.name}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton>
            <FavoriteIcon />
          </IconButton>
          <IconButton>
            <ShareIcon />
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
        {/* Product Images */}
        <Box>
          <Card>
            {(product?.images?.length ?? 0) > 0 ? (
              <CardMedia
                component="img"
                height={isMobile ? 260 : 400}
                image={getImageUrl(
                  product?.images[selectedImageIndex]?.imageUrl ||
                  product?.images[selectedImageIndex]?.ImageUrl ||
                  product?.images[0]?.imageUrl ||
                  product?.images[0]?.ImageUrl ||
                  ''
                )}
                alt={product?.images[selectedImageIndex]?.altText || product?.name || 'Product image'}
                sx={{ 
                  objectFit: isMobile ? 'contain' : 'cover', 
                  backgroundColor: '#f5f5f5',
                  cursor: 'zoom-in'
                }}
                onClick={handleImageClick}
                onError={() => {
                  // Using local placeholder as getImageUrl function
                }}
              />
            ) : (
              <Box 
                sx={{ 
                  height: isMobile ? 260 : 400, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  backgroundColor: '#f5f5f5',
                  color: 'text.secondary'
                }}
              >
                <Typography variant="h6">{product?.name || 'Product'}</Typography>
              </Box>
            )}
          </Card>
          
          {/* Image Thumbnails */}
          {(product?.images?.length ?? 0) > 1 && (
            <Box sx={{ display: 'flex', gap: 1, mt: 2, overflowX: 'auto' }}>
              {product?.images?.map((image, index) => (
                <Card
                  key={image.id}
                  sx={{ 
                    minWidth: 80, 
                    cursor: 'pointer',
                    border: selectedImageIndex === index ? 2 : 0,
                    borderColor: 'primary.main'
                  }}
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <CardMedia
                    component="img"
                    height="60"
                    image={getImageUrl(image.imageUrl || image.ImageUrl || '')}
                    alt={image.altText}
                    sx={{ objectFit: 'cover', backgroundColor: '#f5f5f5' }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      // Use local thumbnail placeholder
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA4MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0zMiAyNEMzMiAyNy4zMTM3IDM0LjY4NjMgMzAgMzggMzBDNDEuMzEzNyAzMCA0NCAyNy4zMTM3IDQ0IDI0QzQ0IDIwLjY4NjMgNDEuMzEzNyAxOCAzOCAxOEMzNC42ODYzIDE4IDMyIDIwLjY4NjMgMzIgMjRaIiBmaWxsPSIjOUU5RTlFIi8+CjxwYXRoIGQ9Ik0yOCA0Mkw0OCA0Mkw0NCAzNkwzOCAzOUwzMiAzNkwyOCA0MloiIGZpbGw9IiM5RTlFOUUiLz4KPHR5cGUgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiM2NjY2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9IjQwIiB5PSI1MCI+Tm8gSW1hZ2U8L3R5cGU+Cjwvc3ZnPg==';
                    }}
                  />
                </Card>
              ))}
            </Box>
          )}
        </Box>

        {/* Product Details */}
        <Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Price */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                {product?.isOnSale ? (
                  <>
                    <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                      {formatPrice(product?.effectivePrice || 0)}
                    </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ textDecoration: 'line-through', color: 'text.secondary' }}
                    >
                      {formatPrice(product?.price || 0)}
                    </Typography>
                    <Chip label={`${product?.discountPercentage || 0}% OFF`} color="error" />
                  </>
                ) : (
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {formatPrice(product?.price || 0)}
                  </Typography>
                )}
              </Box>
              {product?.isOnSale && (
                <Typography variant="body2" color="text.secondary">
                  You save {formatPrice((product?.price || 0) - (product?.effectivePrice || 0))}
                </Typography>
              )}
            </Box>

            {/* SKU & Stock */}
            <Box>
              <Typography variant="body2" color="text.secondary">
                SKU: {product?.sku}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                <Chip 
                  label={product?.isInStock ? 'In Stock' : 'Out of Stock'} 
                  color={product?.isInStock ? 'success' : 'error'}
                />
                <Typography variant="body2" color="text.secondary">
                  {product?.stockQuantity} available
                </Typography>
              </Box>
            </Box>

            {/* Category */}
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Category
              </Typography>
              <Chip label={product?.category?.name || 'Uncategorized'} variant="outlined" />
            </Box>

            {/* Seller Info */}
            {product?.seller && (
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StoreIcon color="action" />
                  <Typography variant="body2" color="text.secondary">
                    Sold by:
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    {product?.seller?.businessName}
                  </Typography>
                </Box>
              </Paper>
            )}

            {/* Rating */}
            {product?.reviewCount && (product?.reviewCount ?? 0) > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Rating value={product?.averageRating ?? 0} readOnly precision={0.5} />
                <Typography variant="body2" color="text.secondary">
                  ({product?.reviewCount} reviews)
                </Typography>
              </Box>
            )}

            {/* Attributes */}
            {product?.attributes && Object.keys(product?.attributes || {}).length > 0 && (
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Specifications
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {Object.entries(product?.attributes ?? {}).map(([key, value]) => (
                    <Chip 
                      key={key}
                      label={`${key}: ${value}`}
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Add to Cart */}
            {!isSeller && product?.isInStock && (
              <Box sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Typography variant="body1">Quantity:</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= (product?.minOrderQuantity ?? 1)}
                    >
                      -
                    </Button>
                    <Typography variant="body1" sx={{ minWidth: 40, textAlign: 'center' }}>
                      {quantity}
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => product && setQuantity(Math.min(
                        product.maxOrderQuantity !== undefined ? product.maxOrderQuantity : 999999, 
                        quantity + 1
                      ))}
                      disabled={!product || quantity >= Math.min(
                        product?.stockQuantity ?? 0,
                        product?.maxOrderQuantity ?? 999999
                      )}
                    >
                      +
                    </Button>
                  </Box>
                </Box>
                
                <Button
                  variant="contained"
                  size="large"
                  startIcon={addingToCart ? <CircularProgress size={20} color="inherit" /> : <CartIcon />}
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  fullWidth
                  sx={{ py: 1.5 }}
                  color={addedToCart ? "success" : "primary"}
                >
                  {addingToCart ? 'Adding...' : addedToCart ? 'Added to Cart!' : 'Add to Cart'}
                </Button>
                
                {addedToCart && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    Product added to cart successfully!
                  </Alert>
                )}
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* Product Description */}
      <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
            Description
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {product?.description}
          </Typography>
          
          {/* Additional Details */}
          <Box sx={{ mt: 3, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            {product?.brand && (
              <Box>
                <Typography variant="body2" color="text.secondary">Brand</Typography>
                <Typography variant="body1">{product?.brand}</Typography>
              </Box>
            )}
            {product?.model && (
              <Box>
                <Typography variant="body2" color="text.secondary">Model</Typography>
                <Typography variant="body1">{product?.model}</Typography>
              </Box>
            )}
            {product?.weight && (product?.weight ?? 0) > 0 && (
              <Box>
                <Typography variant="body2" color="text.secondary">Weight</Typography>
                <Typography variant="body1">{product?.weight} {product?.weightUnit}</Typography>
              </Box>
            )}
            {product?.dimensions && (
              <Box>
                <Typography variant="body2" color="text.secondary">Dimensions</Typography>
                <Typography variant="body1">{product?.dimensions}</Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>

      {/* Related Products */}
      <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
            You May Also Like
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ my: 2 }}>
            <Suspense fallback={
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            }>
              <RelatedProducts
                products={relatedProducts}
                loading={loadingRelated}
                currentProductId={product?.id || ''}
              />
            </Suspense>
          </Box>
        </Paper>
      </Box>

      {/* Image Modal */}
      <Modal
        open={imageModalOpen}
        onClose={handleModalClose}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.9)'
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: '100vw',
            height: '100vh',
            outline: 'none'
          }}
        >
          {/* Modal Controls */}
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              zIndex: 1000,
              display: 'flex',
              gap: 1
            }}
          >
            <IconButton
              onClick={handleZoomOut}
              disabled={modalImageZoom <= 1}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                color: 'black',
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 1)' }
              }}
            >
              <ZoomOutIcon />
            </IconButton>
            <IconButton
              onClick={handleZoomIn}
              disabled={modalImageZoom >= 3}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                color: 'black',
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 1)' }
              }}
            >
              <ZoomInIcon />
            </IconButton>
            <IconButton
              onClick={handleModalClose}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                color: 'black',
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 1)' }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Modal Image Container */}
          <Box
            sx={{
              overflow: 'hidden',
              width: '100vw',
              height: '100vh',
              cursor: modalImageZoom > 1 ? 'grab' : 'default'
            }}
            onMouseMove={handleMouseMove}
          >
            <img
              src={product?.images ? getImageUrl(
                product?.images?.[selectedImageIndex]?.imageUrl ||
                product?.images?.[selectedImageIndex]?.ImageUrl ||
                product?.images?.[0]?.imageUrl ||
                product?.images?.[0]?.ImageUrl ||
                ''
              ) : ''}
              alt={product?.images[selectedImageIndex]?.altText || product?.name || 'Product image'}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                transform: `scale(${modalImageZoom}) translate(${-modalImagePosition.x}px, ${-modalImagePosition.y}px)`,
                transition: modalImageZoom === 1 ? 'transform 0.3s ease' : 'none',
                transformOrigin: 'center center',
                cursor: modalImageZoom > 1 ? 'zoom-out' : 'zoom-in'
              }}
              onClick={handleModalImageClick}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDYwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI2MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0yNDAgMTYwQzI0MCAyMDkuMDE5IDI1OS45ODEgMjI0IDMwMCAyMjRDMzQwLjAxOSAyMjQgMzYwIDIwOS4wMTkgMzYwIDE2MEMzNjAgMTEwLjk4MSAzNDAuMDE5IDk2IDMwMCA5NkMyNTkuOTgxIDk2IDI0MCAxMTAuOTgxIDI0MCAxNjBaIiBmaWxsPSIjOUU5RTlFIi8+CjxwYXRoIGQ9Ik0yMDAgMjgwTDQwMCAyODBMMzYwIDIzMkwzMDAgMjYwTDI0MCAyMzJMMjAwIDI4MFoiIGZpbGw9IiM5RTlFOUUiLz4KPHR5cGUgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM2NjY2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9IjMwMCIgeT0iMzQwIj5ObyBJbWFnZTwvdHlwZT4KPC9zdmc+';
              }}
            />
          </Box>

          {/* Zoom Level Indicator and Instructions */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 1
            }}
          >
            {modalImageZoom > 1 && (
              <Box
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  color: 'black',
                  padding: '4px 12px',
                  borderRadius: 1,
                  fontSize: '0.875rem'
                }}
              >
                {Math.round(modalImageZoom * 100)}%
              </Box>
            )}
            <Box
              sx={{
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                padding: '8px 12px',
                borderRadius: 1,
                fontSize: '0.75rem',
                maxWidth: '200px'
              }}
            >
              Double-click to zoom in
              {modalImageZoom > 1 && <br />}
              {modalImageZoom > 1 && 'Click to zoom out'}
            </Box>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default ProductDetailPage;