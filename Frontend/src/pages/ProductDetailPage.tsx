import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  IconButton
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

interface ProductDetail {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  currency: string;
  discountPrice?: number;
  sku: string;
  stockQuantity: number;
  minOrderQuantity: number;
  maxOrderQuantity: number;
  weight: number;
  weightUnit: string;
  dimensions?: string;
  brand?: string;
  model?: string;
  color?: string;
  size?: string;
  material?: string;
  status: string;
  isFeatured: boolean;
  allowBackorders: boolean;
  viewCount: number;
  averageRating: number;
  reviewCount: number;
  featuredUntil?: string;
  tags: string[];
  attributes: Record<string, string>;
  createdAt: string;
  lastModifiedAt?: string;
  category: {
    id: string;
    name: string;
    description: string;
    imageUrl?: string;
  };
  images: Array<{
    id: string;
    imageUrl?: string;
    ImageUrl?: string;
    altText?: string;
    AltText?: string;
    sortOrder?: number;
    SortOrder?: number;
    isPrimary?: boolean;
    IsPrimary?: boolean;
  }>;
  effectivePrice: number;
  isOnSale: boolean;
  discountPercentage: number;
  isInStock: boolean;
  seller?: {
    id: string;
    businessName: string;
  };
}

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [modalImageZoom, setModalImageZoom] = useState(1);
  const [modalImagePosition, setModalImagePosition] = useState({ x: 0, y: 0 });
  // State to handle click vs double-click in modal
  const [clickTimeout, setClickTimeout] = useState<number | null>(null);

  const isSeller = user?.roles?.some((role: string) => role.toLowerCase() === 'seller');

  useEffect(() => {
    if (id) {
      fetchProduct();
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

  const fetchProduct = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      // Since the backend doesn't have a GET /products/{id} endpoint,
      // we'll fetch all products and filter by ID
      const response = await fetch('/api/products?pageSize=1000', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token') || ''}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Handle ApiResponse wrapper - the response should have success and data fields
        let productsList = [];
        if (data.success && data.data && data.data.items) {
          productsList = data.data.items;
        } else if (data.data && Array.isArray(data.data.items)) {
          productsList = data.data.items;
        } else if (Array.isArray(data)) {
          productsList = data;
        } else {
          console.error('[ProductDetailPage] Unexpected response format:', data);
          setError('Failed to load product data');
          return;
        }
        
        
        // Find the specific product by ID
        const foundProduct = productsList.find((product: any) => product.id === id);
        
        if (foundProduct) {
          foundProduct.images.forEach((img: any, index: number) => {
            console.log(`[ProductDetailPage] Image ${index + 1}:`, {
              id: img.id,
              imageUrl: img.imageUrl,
              isPrimary: img.isPrimary,
              IsPrimary: img.IsPrimary,
              altText: img.altText
            });
          });
          setProduct(foundProduct);
        } else {
          setError('Product not found');
        }
      } else if (response.status === 404) {
        setError('Products not available');
      } else if (response.status === 401) {
        setError('Please log in to view product details');
      } else {
        setError('Failed to load product details');
      }
    } catch (error) {
      console.error('[ProductDetailPage] Error fetching product:', error);
      setError('Error loading product');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    try {
      setAddingToCart(true);
      setError(null);
      
      const success = cartService.addToCart(product, quantity);
      
      if (success) {
        setAddedToCart(true);
        setQuantity(1);
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setAddedToCart(false);
        }, 3000);
      } else {
        setError('Failed to add product to cart. Please check stock availability.');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      setError('Error adding product to cart');
    } finally {
      setAddingToCart(false);
    }
  };

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

  const handleImageDoubleClick = () => {
    if (modalImageZoom === 1) {
      // Zoom in to 2x on double click
      setModalImageZoom(2);
    } else {
      // If already zoomed, zoom out to fit window
      setModalImageZoom(1);
      setModalImagePosition({ x: 0, y: 0 });
    }
  };

  const handleModalImageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (clickTimeout) {
      // This is a double-click
      clearTimeout(clickTimeout);
      setClickTimeout(null);
      handleImageDoubleClick();
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

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(price);
  };

  const getImageUrl = (imageUrl: string) => {
    
    if (imageUrl && imageUrl.trim() !== '') {
      return imageUrl;
    }
    
    // Use local SVG placeholder to avoid external random images
    const placeholderUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDYwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI2MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0yNDAgMTYwQzI0MCAyMDkuMDE5IDI1OS45ODEgMjI0IDMwMCAyMjRDMzQwLjAxOSAyMjQgMzYwIDIwOS4wMTkgMzYwIDE2MEMzNjAgMTEwLjk4MSAzNDAuMDE5IDk2IDMwMCA5NkMyNTkuOTgxIDk2IDI0MCAxMTAuOTgxIDI0MCAxNjBaIiBmaWxsPSIjOUU5RTlFIi8+CjxwYXRoIGQ9Ik0yMDAgMjgwTDQwMCAyODBMMzYwIDIzMkwzMDAgMjYwTDI0MCAyMzJMMjAwIDI4MFoiIGZpbGw9IiM5RTlFOUUiLz4KPHR5cGUgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM2NjY2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9IjMwMCIgeT0iMzQwIj5ObyBJbWFnZTwvdHlwZT4KPC9zdmc+';
    return placeholderUrl;
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
          {product.name}
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
            {product.images && product.images.length > 0 ? (
              <CardMedia
                component="img"
                height="400"
                image={getImageUrl(
                  product.images[selectedImageIndex]?.imageUrl || 
                  product.images[selectedImageIndex]?.ImageUrl || 
                  product.images[0]?.imageUrl || 
                  product.images[0]?.ImageUrl || 
                  ''
                )}
                alt={product.images[selectedImageIndex]?.altText || product.name}
                sx={{ 
                  objectFit: 'cover', 
                  backgroundColor: '#f5f5f5',
                  cursor: 'zoom-in'
                }}
                onClick={handleImageClick}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  // Use same local placeholder as getImageUrl function
                  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDYwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI2MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0yNDAgMTYwQzI0MCAyMDkuMDE5IDI1OS45ODEgMjI0IDMwMCAyMjRDMzQwLjAxOSAyMjQgMzYwIDIwOS4wMTkgMzYwIDE2MEMzNjAgMTEwLjk4MSAzNDAuMDE5IDk2IDMwMCA5NkMyNTkuOTgxIDk2IDI0MCAxMTAuOTgxIDI0MCAxNjBaIiBmaWxsPSIjOUU5RTlFIi8+CjxwYXRoIGQ9Ik0yMDAgMjgwTDQwMCAyODBMMzYwIDIzMkwzMDAgMjYwTDI0MCAyMzJMMjAwIDI4MFoiIGZpbGw9IiM5RTlFOUUiLz4KPHR5cGUgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM2NjY2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9IjMwMCIgeT0iMzQwIj5ObyBJbWFnZTwvdHlwZT4KPC9zdmc+';
                }}
              />
            ) : (
              <Box 
                sx={{ 
                  height: 400, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  backgroundColor: '#f5f5f5',
                  color: 'text.secondary'
                }}
              >
                <Typography variant="h6">{product.name}</Typography>
              </Box>
            )}
          </Card>
          
          {/* Image Thumbnails */}
          {product.images.length > 1 && (
            <Box sx={{ display: 'flex', gap: 1, mt: 2, overflowX: 'auto' }}>
              {product.images.map((image, index) => (
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
                {product.isOnSale ? (
                  <>
                    <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                      {formatPrice(product.effectivePrice, product.currency)}
                    </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ textDecoration: 'line-through', color: 'text.secondary' }}
                    >
                      {formatPrice(product.price, product.currency)}
                    </Typography>
                    <Chip label={`${product.discountPercentage}% OFF`} color="error" />
                  </>
                ) : (
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {formatPrice(product.price, product.currency)}
                  </Typography>
                )}
              </Box>
              {product.isOnSale && (
                <Typography variant="body2" color="text.secondary">
                  You save {formatPrice(product.price - product.effectivePrice, product.currency)}
                </Typography>
              )}
            </Box>

            {/* SKU & Stock */}
            <Box>
              <Typography variant="body2" color="text.secondary">
                SKU: {product.sku}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                <Chip 
                  label={product.isInStock ? 'In Stock' : 'Out of Stock'} 
                  color={product.isInStock ? 'success' : 'error'}
                />
                <Typography variant="body2" color="text.secondary">
                  {product.stockQuantity} available
                </Typography>
              </Box>
            </Box>

            {/* Category */}
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Category
              </Typography>
              <Chip label={product.category.name} variant="outlined" />
            </Box>

            {/* Seller Info */}
            {product.seller && (
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StoreIcon color="action" />
                  <Typography variant="body2" color="text.secondary">
                    Sold by:
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    {product.seller.businessName}
                  </Typography>
                </Box>
              </Paper>
            )}

            {/* Rating */}
            {product.reviewCount > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Rating value={product.averageRating} readOnly precision={0.5} />
                <Typography variant="body2" color="text.secondary">
                  ({product.reviewCount} reviews)
                </Typography>
              </Box>
            )}

            {/* Attributes */}
            {Object.keys(product.attributes).length > 0 && (
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Specifications
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {Object.entries(product.attributes).map(([key, value]) => (
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
            {!isSeller && product.isInStock && (
              <Box sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Typography variant="body1">Quantity:</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= product.minOrderQuantity}
                    >
                      -
                    </Button>
                    <Typography variant="body1" sx={{ minWidth: 40, textAlign: 'center' }}>
                      {quantity}
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setQuantity(Math.min(product.maxOrderQuantity, quantity + 1))}
                      disabled={quantity >= Math.min(product.stockQuantity, product.maxOrderQuantity)}
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
            {product.description}
          </Typography>
          
          {/* Additional Details */}
          <Box sx={{ mt: 3, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            {product.brand && (
              <Box>
                <Typography variant="body2" color="text.secondary">Brand</Typography>
                <Typography variant="body1">{product.brand}</Typography>
              </Box>
            )}
            {product.model && (
              <Box>
                <Typography variant="body2" color="text.secondary">Model</Typography>
                <Typography variant="body1">{product.model}</Typography>
              </Box>
            )}
            {product.weight > 0 && (
              <Box>
                <Typography variant="body2" color="text.secondary">Weight</Typography>
                <Typography variant="body1">{product.weight} {product.weightUnit}</Typography>
              </Box>
            )}
            {product.dimensions && (
              <Box>
                <Typography variant="body2" color="text.secondary">Dimensions</Typography>
                <Typography variant="body1">{product.dimensions}</Typography>
              </Box>
            )}
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
              src={product ? getImageUrl(
                product.images[selectedImageIndex]?.imageUrl || 
                product.images[selectedImageIndex]?.ImageUrl || 
                product.images[0]?.imageUrl || 
                product.images[0]?.ImageUrl || 
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