import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Button,
  IconButton,
  Alert,
  Divider,
  Skeleton,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  ShoppingCart as CartIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material';
import cartService, { type CartSummary } from '../services/cartService';

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartSummary>({ items: [], totalAmount: 0, totalItems: 0, currency: 'USD' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getImageUrl = (imageUrl?: string) => {
    if (imageUrl && imageUrl.trim() !== '') {
      return imageUrl;
    }
    // Use local SVG placeholder for cart items
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik00OCA0OEM0OCA1OC4wNDU3IDUxLjk1NDMgNjIgNjAgNjJDNjguMDQ1NyA2MiA3MiA1OC4wNDU3IDcyIDQ4QzcyIDM3Ljk1NDMgNjguMDQ1NyAzNCA2MCAzNEM1MS45NTQzIDM0IDQ4IDM3Ljk1NDMgNDggNDhaIiBmaWxsPSIjOUU5RTlFIi8+CjxwYXRoIGQ9Ik00MCA4NEw4MCA4NEw3MiA3Mkw2MCA3OEw0OCA3Mkw0MCA4NFoiIGZpbGw9IiM5RTlFOUUiLz4KPHR5cGUgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM2NjY2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9IjYwIiB5PSIxMDAiPk5vIEltYWdlPC90eXBlPgo8L3N2Zz4=';
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const cartSummary = cartService.getCartSummary();
      setCart(cartSummary);
      console.log('[CartPage] Loaded cart:', cartSummary);
    } catch (error) {
      console.error('[CartPage] Error loading cart:', error);
      setError('Error loading cart');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      const success = cartService.updateQuantity(itemId, newQuantity);
      if (success) {
        fetchCart(); // Refresh cart display
      } else {
        setError('Failed to update quantity');
      }
    } catch (error) {
      console.error('[CartPage] Error updating quantity:', error);
      setError('Error updating quantity');
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const success = cartService.removeFromCart(itemId);
      if (success) {
        fetchCart(); // Refresh cart display
      } else {
        setError('Failed to remove item');
      }
    } catch (error) {
      console.error('[CartPage] Error removing item:', error);
      setError('Error removing item');
    }
  };

  const proceedToCheckout = () => {
    // Navigate to existing order creation flow with cart data
    // Pass cart items as state to skip the first steps
    navigate('/orders/new', {
      state: {
        fromCart: true,
        cartItems: cart.items,
        totalAmount: cart.totalAmount,
        currency: cart.currency || 'PKR'
      }
    });
  };

  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 3 }}>Shopping Cart</Typography>
        {[1, 2, 3].map(i => (
          <Skeleton key={i} variant="rectangular" height={100} sx={{ mb: 2 }} />
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/marketplace')} sx={{ mr: 2 }}>
          <BackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Shopping Cart
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {cart.items.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <CartIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" sx={{ mb: 1 }}>
              Your cart is empty
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Start shopping to add items to your cart
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/marketplace')}
            >
              Browse Marketplace
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Box>
          {/* Cart Items */}
          <Box sx={{ mb: 3 }}>
            {cart.items.map((item) => (
              <Card key={item.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    {/* Product Image */}
                    <CardMedia
                      component="img"
                      sx={{ 
                        width: 120, 
                        height: 120, 
                        objectFit: 'cover',
                        backgroundColor: '#f5f5f5',
                        borderRadius: 1,
                        cursor: 'pointer'
                      }}
                      image={getImageUrl(item.productImage)}
                      alt={item.productName}
                      onClick={() => navigate(`/products/${item.productId}`)}
                      onError={(e) => {
                        console.log('[CartPage] Image load error for product:', item.productName);
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik00OCA0OEM0OCA1OC4wNDU3IDUxLjk1NDMgNjIgNjAgNjJDNjguMDQ1NyA2MiA3MiA1OC4wNDU3IDcyIDQ4QzcyIDM3Ljk1NDMgNjguMDQ1NyAzNCA2MCAzNEM1MS45NTQzIDM0IDQ4IDM3Ljk1NDMgNDggNDhaIiBmaWxsPSIjOUU5RTlFIi8+CjxwYXRoIGQ9Ik00MCA4NEw4MCA4NEw3MiA3Mkw2MCA3OEw0OCA3Mkw0MCA4NFoiIGZpbGw9IiM5RTlFOUUiLz4KPHR5cGUgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM2NjY2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9IjYwIiB5PSIxMDAiPk5vIEltYWdlPC90eXBlPgo8L3N2Zz4=';
                      }}
                    />

                    {/* Product Details */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="h6" sx={{ mb: 1, cursor: 'pointer' }} onClick={() => navigate(`/products/${item.productId}`)}>
                        {item.productName}
                      </Typography>
                      {item.sellerName && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Sold by: {item.sellerName}
                        </Typography>
                      )}
                      <Typography variant="h6" color="primary">
                        {formatPrice(item.price)}
                      </Typography>
                    </Box>

                    {/* Quantity Controls */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <RemoveIcon />
                        </IconButton>
                        
                        <Typography sx={{ minWidth: 30, textAlign: 'center' }}>
                          {item.quantity}
                        </Typography>
                        
                        <IconButton
                          size="small"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <AddIcon />
                        </IconButton>
                      </Box>

                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => removeItem(item.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  {item.quantity > 1 && (
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">
                        {item.quantity} × {formatPrice(item.price)}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {formatPrice(item.price)}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>

          {/* Cart Summary */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Order Summary
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Items ({cart.totalItems}):</Typography>
                <Typography>{formatPrice(cart.totalAmount)}</Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Total:</Typography>
                <Typography variant="h6" color="primary">
                  {formatPrice(cart.totalAmount)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/marketplace')}
                  sx={{ flex: 1 }}
                >
                  Continue Shopping
                </Button>
                <Button
                  variant="contained"
                  onClick={proceedToCheckout}
                  sx={{ flex: 1 }}
                >
                  Proceed to Checkout
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default CartPage;