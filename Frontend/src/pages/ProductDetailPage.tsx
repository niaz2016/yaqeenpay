import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProductCache } from '../hooks/useProductCache';
import Breadcrumbs from '../components/common/Breadcrumbs';
import ShareMenu from '../components/common/ShareMenu';
import WishlistButton from '../components/product/WishlistButton';
import { useWishlist } from '../context/WishlistContext';
import LazyImage from '../components/common/LazyImage';
import ProductImageModal from '../components/product/ProductImageModal';

import type { ProductImage } from '../types/product';
import {
  Box,
  Typography,
  Button,
  Card,
  Chip,
  Alert,
  CircularProgress,
  useTheme,
  TextField,
  Skeleton,
  Tabs,
  Tab,
  Avatar,
  Rating,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
} from '@mui/material';
import apiService from '../services/api';
import type { ProductReview } from '../types/product';

import {
  ArrowBack as ArrowBackIcon,
  ShoppingCart as CartIcon,
  Store as StoreIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import cartService from '../services/cartService';
import { normalizeImageUrl, placeholderDataUri } from '../utils/image';

const ProductDetailPage: React.FC<{}> = () => {
  // Tab state
  const [tabIndex, setTabIndex] = useState(0);
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const { isInWishlist } = useWishlist();
  const { product, loading, error } = useProductCache(id);
  // Reviews state
  const [reviews, setReviews] = useState<ProductReview[] | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  // Review eligibility and form state
  const [canReview, setCanReview] = useState<boolean | null>(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [newRating, setNewRating] = useState<number | null>(5);
  const [newComment, setNewComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

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
  // Product variant selection
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
  // Selected option values per variant attribute (e.g. { size: 'M', color: 'Red' })
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  const isSeller = user?.roles?.some((role: string) => role.toLowerCase() === 'seller');

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

  const handleAddToCart = async () => {
    if (!product) return;

    // Use selected variant if available
    let itemToAdd = product;
    if (Array.isArray(product.variants) && typeof selectedVariant === 'number' && product.variants[selectedVariant]) {
      itemToAdd = {
        ...product,
        ...product.variants[selectedVariant],
      };
    }

    try {
      setAddingToCart(true);
      setCartError(null);
      const success = await cartService.addToCart(itemToAdd, quantity);
      if (success) {
        setAddedToCart(true);
        setQuantity(1);
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

  // Whenever selectedOptions change, attempt to find a matching variant index
  useEffect(() => {
    if (!product || !Array.isArray(product.variants) || product.variants.length === 0) {
      setSelectedVariant(null);
      return;
    }

    const attrKeys = Array.from(new Set((product.variants ?? []).flatMap(v => Object.keys(v))))
      .filter(k => k !== 'price' && k !== 'stockQuantity' && k !== 'sku');

    // If no attribute keys, select first variant by default
    if (attrKeys.length === 0) {
      setSelectedVariant(0);
      return;
    }

    // Find variant that matches all selected options (only if option present for that key)
    const matchIndex = product.variants.findIndex((v) => {
      return attrKeys.every((key) => {
        const want = selectedOptions[key];
        if (!want) return false; // require user selection for each attribute
        const val = v[key];
        // Normalize to string for comparison
        return String(val ?? '') === String(want);
      });
    });

    setSelectedVariant(matchIndex >= 0 ? matchIndex : null);
  }, [selectedOptions, product]);

  useEffect(() => {
    if (product) {
      setQuantity(Math.max(1, product.minOrderQuantity ?? 1));
    }
  }, [product]);

  // Auto-select first variant when variants exist and user hasn't selected options
  useEffect(() => {
    if (!product || !Array.isArray(product.variants) || product.variants.length === 0) return;
    // Only auto-select when there is exactly one variant
    if (product.variants.length !== 1) return;
    if (Object.keys(selectedOptions).length > 0) return; // don't override user's selections

    const first = product.variants[0];
    if (!first) return;

    const attrKeys = Object.keys(first).filter(k => !['price', 'stockQuantity', 'sku', 'id'].includes(k));
    const defaults: Record<string, string> = {};
    attrKeys.forEach(k => {
      const v = (first as any)[k];
      if (v !== undefined && v !== null && String(v) !== '') defaults[k] = String(v);
    });

    if (Object.keys(defaults).length > 0) {
      setSelectedOptions(defaults);
      setSelectedVariant(0);
    }
  }, [product, selectedOptions]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (clickTimeout) {
        clearTimeout(clickTimeout);
      }
    };
  }, [clickTimeout]);

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

  // Load reviews from API when product is available
  useEffect(() => {
    let mounted = true;
    const loadReviews = async () => {
      if (!product) return;
      setReviewsLoading(true);
      try {
        const resp = await apiService.get<any>(`/products/${product.id}/reviews`);
        if (!mounted) return;
        const items = Array.isArray(resp) ? resp : (resp?.items ?? []);
        setReviews(items as ProductReview[]);
      } catch (err) {
        console.warn('Failed to load reviews for product', product?.id, err);
        if (mounted) setReviews([]);
      } finally {
        if (mounted) setReviewsLoading(false);
      }
    };

    setReviews(null);
    loadReviews();

    // Check review eligibility for the current user (only if authenticated)
    const checkEligibility = async () => {
      if (!product || !user) {
        setCanReview(false);
        return;
      }
      setCheckingEligibility(true);
      try {
        // Backend endpoint expected to return { eligible: true } or boolean
        const resp = await apiService.get<any>(`/orders/eligible-to-review?productId=${product.id}`);
        const eligible = typeof resp === 'boolean' ? resp : (resp?.eligible ?? false);
        if (mounted) setCanReview(Boolean(eligible));
      } catch (err) {
        console.warn('Failed to check review eligibility', err);
        if (mounted) setCanReview(false);
      } finally {
        if (mounted) setCheckingEligibility(false);
      }
    };

    checkEligibility();

    return () => { mounted = false; };
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
    <Box sx={{
      p: { xs: 0, sm: 1, md: 1 },
      width: '100%',
      overflowX: 'hidden',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      {/* Back button and breadcrumbs */}
      <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: { xs: '100%', sm: 680, md: 1200 }, boxSizing: 'border-box', mx: 'auto' }}>
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
        gap: { xs: 2, md: 4 },
        alignItems: { xs: 'start', md: 'stretch' },
        width: '100%',
        maxWidth: { xs: '100%', sm: 680, md: 1200 },
        mx: 'auto',
        boxSizing: 'border-box',
        overflowX: 'hidden'
      }}>
        {/* Image Gallery */}
          <Card sx={{ boxShadow: 0, width: '100%', maxWidth: { xs: '100%', sm: 400, md: 500 }, mx: 'auto', boxSizing: 'border-box', overflowX: 'hidden' }}>
          <Box sx={{ position: 'relative', pt: 0, pb: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <LazyImage
              src={normalizeImageUrl(product.images?.[selectedImageIndex]?.imageUrl || product.images?.[selectedImageIndex]?.ImageUrl) || placeholderDataUri(600)}
              alt={product.name}
              lowResSrc={placeholderDataUri(100)}
              aspectRatio={4/3}
              style={{
                cursor: 'zoom-in',
                display: 'block',
                margin: '0 auto',
                maxHeight: '260px',
                width: '100%',
                objectFit: 'contain',
                background: '#fff'
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
            {/* Thumbnails - moved closer to image */}
            {product.images?.length > 1 && (
              <Box sx={{
                display: 'flex',
                gap: 1,
                mt: 1,
                mb: 0,
                p: 0,
                overflowX: 'auto',
                justifyContent: 'center',
                width: '100%',
                maxWidth: { xs: '100%', sm: 320 },
                mx: 'auto'
              }}>
                {(product.images || []).map((image: ProductImage, index: number) => (
                  <Box
                    key={image.id}
                    onClick={() => setSelectedImageIndex(index)}
                    sx={{
                      width: 48,
                      height: 48,
                      flexShrink: 0,
                      cursor: 'pointer',
                      border: index === selectedImageIndex ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
                      overflow: 'hidden',
                      borderRadius: 1,
                      background: '#fafafa'
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
          </Box>
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
            {(() => {
              // If a variant is selected and has its own price, show that
              const variantPrice = (selectedVariant !== null && Array.isArray(product.variants) && product.variants[selectedVariant] && product.variants[selectedVariant].price) ? product.variants[selectedVariant].price : undefined;
              const displayPrice = variantPrice ?? product.effectivePrice ?? product.price;
              const originalPrice = variantPrice ? undefined : product.price;

              if (product.isOnSale && !variantPrice) {
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h5" color="error">
                      {new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', currencyDisplay: 'code' }).format(displayPrice)}
                    </Typography>
                    <Typography variant="body1" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                      {new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', currencyDisplay: 'code' }).format(originalPrice ?? 0)}
                    </Typography>
                    <Chip label={`${Math.round(product.discountPercentage)}% OFF`} color="error" size="small" />
                  </Box>
                );
              }

              return (
                <Typography variant="h5">
                  {new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', currencyDisplay: 'code' }).format(displayPrice)}
                </Typography>
              );
            })()}
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
              {/* Variant selection UI */}
              {Array.isArray(product.variants) && product.variants.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  {/* Determine attribute keys dynamically (exclude price/stock/sku) */}
                  {Array.from(new Set((product.variants ?? []).flatMap(v => Object.keys(v))))
                    .filter(k => k !== 'price' && k !== 'stockQuantity' && k !== 'sku' && k !== 'id')
                    .map((attrKey) => {
                      const values = Array.from(new Set((product.variants ?? []).map(v => String(v[attrKey] ?? '')).filter(Boolean)));
                      if (values.length === 0) return null;
                      return (
                        <FormControl key={attrKey} fullWidth sx={{ mb: 1 }} size="small">
                          <InputLabel>{attrKey.charAt(0).toUpperCase() + attrKey.slice(1)}</InputLabel>
                          <Select
                            label={attrKey.charAt(0).toUpperCase() + attrKey.slice(1)}
                            value={selectedOptions[attrKey] ?? ''}
                            onChange={(e) => setSelectedOptions(prev => ({ ...prev, [attrKey]: String(e.target.value) }))}
                          >
                            <MenuItem value="">Select</MenuItem>
                            {values.map(val => (
                              <MenuItem key={val} value={val}>{val}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      );
                    })}

                  {/* Inform user to complete selection if not matched and show selected variant details */}
                  <Box sx={{ mt: 1 }}>
                    {selectedVariant === null ? (
                      <Typography variant="body2" color="text.secondary">Please select all options to choose a variant.</Typography>
                    ) : (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" color="text.secondary">Selected variant:</Typography>
                        <Typography variant="body2">{product.variants[selectedVariant].sku || (Object.values(product.variants[selectedVariant]).filter(v => v && typeof v === 'string').join(' / '))}</Typography>
                        {product.variants[selectedVariant].price != null && (
                          <Typography variant="body2" color="text.primary" sx={{ ml: 2 }}>
                            {new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(product.variants[selectedVariant].price)}
                          </Typography>
                        )}
                        {product.variants[selectedVariant].stockQuantity != null && (
                          <Chip label={`${product.variants[selectedVariant].stockQuantity} in stock`} size="small" />
                        )}
                      </Stack>
                    )}
                  </Box>
                </Box>
              )}

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
                  disabled={addingToCart || product.stockQuantity === 0 || (Array.isArray(product.variants) && product.variants.length > 0 && selectedVariant === null)}
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

          {/* Tabbed interface for details */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={tabIndex} onChange={handleTabChange} aria-label="product details tabs">
              <Tab label="Description" />
              <Tab label="Specifications" />
              <Tab label="Shipping" />
              <Tab label="Reviews" />
            </Tabs>
          </Box>
          {tabIndex === 0 && (
            <Box>
              <Typography variant="body1" sx={{ mb: 3, whiteSpace: 'pre-line' }}>
                {product.description}
              </Typography>
            </Box>
          )}
          {tabIndex === 1 && (
            <Box>
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
          )}
          {tabIndex === 2 && (
            <Box>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Discuss shipping information with the seller.
              </Typography>
            </Box>
          )}
          {tabIndex === 3 && (
            <Box>
              {reviewsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box>
                  {(!reviews || reviews.length === 0) ? (
                    <Typography variant="body2" color="text.secondary">No reviews yet.</Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {reviews.map((r) => (
                        <Card key={r.id} variant="outlined" sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                            <Avatar>{(r.userName && r.userName[0]) || 'U'}</Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="subtitle2">{r.userName}</Typography>
                                <Rating value={r.rating} precision={0.5} readOnly size="small" />
                                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>{new Date(r.createdAt).toLocaleDateString()}</Typography>
                              </Box>
                              <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-line' }}>{r.comment}</Typography>
                              {r.images && r.images.length > 0 && (
                                <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                                  {r.images.map((img, idx) => (
                                    <Box key={idx} sx={{ width: 80, height: 80, overflow: 'hidden', borderRadius: 1 }}>
                                      <img src={normalizeImageUrl(img.imageUrl || img.ImageUrl || '')} alt={`review-${r.id}-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </Box>
                                  ))}
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </Card>
                      ))}
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          )}
            {/* Review submission form - only for authenticated users who are eligible */}
            {tabIndex === 3 && (
              <Box sx={{ mt: 2 }}>
                {user ? (
                  checkingEligibility ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><CircularProgress size={20} /> <Typography>Checking review eligibility...</Typography></Box>
                  ) : canReview ? (
                    <Card variant="outlined" sx={{ p: 2, mt: 2 }}>
                      <Typography variant="subtitle1" sx={{ mb: 1 }}>Write a review</Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Rating value={newRating} onChange={(_, val) => setNewRating(val)} />
                        <Typography variant="body2" color="text.secondary">Your rating</Typography>
                      </Box>
                      <TextField
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        multiline
                        rows={4}
                        fullWidth
                        sx={{ mt: 1 }}
                        placeholder="Share your experience about the product"
                      />
                      {reviewError && <Alert severity="error" sx={{ mt: 1 }}>{reviewError}</Alert>}
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1 }}>
                        <Button variant="outlined" onClick={() => { setNewComment(''); setNewRating(5); }}>Clear</Button>
                        <Button variant="contained" onClick={async () => {
                          if (!product) return;
                          if (!newComment.trim()) { setReviewError('Please enter a comment'); return; }
                          setReviewError(null);
                          setSubmittingReview(true);
                          try {
                            const payload = { rating: newRating, comment: newComment };
                            await apiService.post(`/products/${product.id}/reviews`, payload);
                            // Refresh reviews
                            const resp = await apiService.get<any>(`/products/${product.id}/reviews`);
                            const items = Array.isArray(resp) ? resp : (resp?.items ?? []);
                            setReviews(items as ProductReview[]);
                            setNewComment(''); setNewRating(5);
                          } catch (err: any) {
                            console.error('Failed to submit review', err);
                            setReviewError(err?.message || 'Failed to submit review');
                          } finally {
                            setSubmittingReview(false);
                          }
                        }} disabled={submittingReview}>
                          {submittingReview ? 'Submitting...' : 'Submit Review'}
                        </Button>
                      </Box>
                    </Card>
                  ) : (
                    <Alert severity="info" sx={{ mt: 2 }}>You can write a review for this product after you have received it.</Alert>
                  )
                ) : (
                  <Alert severity="info" sx={{ mt: 2 }}>Please sign in to write a review.</Alert>
                )}
              </Box>
            )}
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
};

export default ProductDetailPage;