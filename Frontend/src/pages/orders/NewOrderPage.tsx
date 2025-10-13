import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, Stack, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Button, Divider } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ordersService from '../../services/ordersService';
import notificationService from '../../services/notificationService';
import cartService from '../../services/cartService';
import type { CreateOrderPayload, Order } from '../../types/order';
import OrderCreateStepper from '../../components/orders/OrderCreateStepper';

const NewOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [kycDialog, setKycDialog] = useState(false);

  // Check if user came from cart
  const cartData = location.state as {
    fromCart?: boolean;
    cartItems?: Array<{ id: string; productName: string; price: number; quantity: number; productImage?: string; sellerId?: string; sellerName?: string; sellerPhoneNumber?: string }>;
    totalAmount?: number;
    currency?: string;
  } | null;

  const handleSubmit = async (payload: CreateOrderPayload | any) => {
    try {
      setSubmitting(true);

      // Handle cart-based orders differently
      if (cartData?.fromCart && cartData.cartItems) {
        // For cart orders, we'll create a consolidated marketplace order
        const orderDescription = `Marketplace Order:\n${cartData.cartItems.map(item => 
          `• ${item.productName} (×${item.quantity}) - ${item.sellerName || 'Unknown Seller'}`
        ).join('\n')}`;

        // For marketplace orders, we need to handle multiple sellers
        console.log('[NewOrderPage] Cart items for order creation:', cartData.cartItems);
        
        const firstSeller = cartData.cartItems.find(item => item.sellerId);
        console.log('[NewOrderPage] First seller found:', firstSeller);
        
        if (!firstSeller || !firstSeller.sellerId) {
          setSnack({ 
            open: true, 
            message: 'Unable to create order: Seller information is missing from cart items.', 
            severity: 'error' 
          });
          return;
        }
        
        if (!firstSeller.sellerPhoneNumber) {
          setSnack({ 
            open: true, 
            message: 'Unable to create order: Seller phone number is missing.', 
            severity: 'error' 
          });
          return;
        }
        
        const targetMobile = firstSeller.sellerPhoneNumber;
        
        const consolidatedOrder: Order = await ordersService.createWithImages(
          'Marketplace Purchase',
          orderDescription,
          cartData.totalAmount || 0,
          cartData.currency || 'PKR',
          targetMobile,
          [], // Images handled separately
          'buyer' // Creator role
        );

        setSnack({ 
          open: true, 
          message: 'Order placed successfully! You will be redirected to order details.', 
          severity: 'success' 
        });

        // Clear cart after successful order
        cartService.clearCart();
        
        setTimeout(() => {
          if (consolidatedOrder?.id && consolidatedOrder.id !== 'undefined') {
            navigate(`/orders/${consolidatedOrder.id}`);
          } else {
            navigate('/orders');
          }
        }, 2000);
        return;
      }

      // Check KYC status for seller orders - prevent pending KYC users from selling
      if (payload.isSellerRequest || payload.creatorRole === 'seller') {
        if (!user) {
          setSnack({ open: true, message: 'Authentication required. Please log in.', severity: 'error' });
          return;
        }

        const kycStatus = user.kycStatus?.toLowerCase();
        if (kycStatus !== 'verified') {
          setKycDialog(true);
          return;
        }
      }

      // Check if this is a seller creating order for buyer
      if (payload.isSellerRequest || payload.creatorRole === 'seller') {
        const { title, description, amount, currency, images, targetUserMobile } = payload;
        
        if (!targetUserMobile || !targetUserMobile.trim()) {
          setSnack({ open: true, message: 'Buyer mobile number is required.', severity: 'error' });
          return;
        }

        // SELLER creates listing FOR buyer
        const order: Order = await ordersService.createWithImages(
          title,
          description,
          amount,
          currency,
          targetUserMobile.trim(),
          images || [],
          'seller' // Creator role
        );
        
        // Send notification to the buyer about the new listing
        try {
          await notificationService.notifyOrderCreated(
            targetUserMobile.trim(),
            amount,
            currency,
            order.id
          );
        } catch (notifError) {
          console.warn('Failed to send notifications:', notifError);
        }
        
        setSnack({ 
          open: true, 
          message: `Product listing created successfully! Buyer ${targetUserMobile} has been notified. Redirecting to order details...`, 
          severity: 'success' 
        });
        
        // Navigate to order details after brief delay to show success message
        setTimeout(() => {
          if (order?.id && order.id !== 'undefined') {
            navigate(`/orders/${order.id}`);
          } else {
            navigate('/orders'); // Fallback to orders list
          }
        }, 2000);
        return;
      }

      // Check if this is a buyer creating order for seller
      if (payload.creatorRole === 'buyer') {
        const { title, description, amount, currency, targetUserMobile, images } = payload;
        
        if (!targetUserMobile || !targetUserMobile.trim()) {
          setSnack({ open: true, message: 'Seller mobile number is required.', severity: 'error' });
          return;
        }

        // BUYER creates order FROM seller - buyer pays into escrow
        const order: Order = await ordersService.createWithImages(
          title,
          description,
          amount,
          currency,
          targetUserMobile.trim(),
          images || [],
          'buyer' // Creator role
        );
        
        // Send notifications: order created + escrow funded
        try {
          // Notify seller about order
          await notificationService.notifyOrderCreated(
            targetUserMobile.trim(),
            amount,
            currency,
            order.id
          );
          
          // Notify seller that funds are now in escrow
          await notificationService.notifyEscrowFunded(
            targetUserMobile.trim(),
            amount,
            currency,
            order.id
          );
        } catch (notifError) {
          console.warn('Failed to send notifications:', notifError);
        }
        
        setSnack({ 
          open: true, 
          message: `Purchase order created successfully! ${amount.toLocaleString()} Wallet Credits have been held in escrow and seller ${targetUserMobile} has been notified. Redirecting to order details...`, 
          severity: 'success' 
        });
        
        // Navigate to order details after brief delay to show success message
        setTimeout(() => {
          if (order?.id && order.id !== 'undefined') {
            navigate(`/orders/${order.id}`);
          } else {
            navigate('/orders'); // Fallback to orders list
          }
        }, 2000);
        return;
      }

      // Fallback for orders without images - use createWithImages with empty images array
      // This ensures consistent role-based behavior
      
      // Additional KYC check for seller orders in fallback path
      if (payload.creatorRole === 'seller') {
        if (!user) {
          setSnack({ open: true, message: 'Authentication required. Please log in.', severity: 'error' });
          return;
        }

        const kycStatus = user.kycStatus?.toLowerCase();
        if (kycStatus !== 'verified') {
          setKycDialog(true);
          return;
        }
      }

      if (!payload.targetUserMobile || !payload.targetUserMobile.trim()) {
        setSnack({ open: true, message: 'Target user mobile number is required.', severity: 'error' });
        return;
      }

      const order: Order = await ordersService.createWithImages(
        payload.description?.split('\n')[0] || 'Order',
        payload.description || '',
        payload.amount,
        payload.currency,
        payload.targetUserMobile.trim(),
        [], // No images
        payload.creatorRole || 'buyer' // Default to buyer if not specified
      );
      
      // Send notification to target user about new order
      try {
        await notificationService.notifyOrderCreated(
          payload.targetUserMobile.trim(),
          payload.amount,
          payload.currency,
          order.id
        );
        
        if (payload.creatorRole === 'buyer') {
          await notificationService.notifyEscrowFunded(
            payload.targetUserMobile.trim(),
            payload.amount,
            payload.currency,
            order.id
          );
        }
      } catch (notifError) {
        console.warn('Failed to send notifications:', notifError);
        // Don't fail the order creation if notifications fail
      }
      
      setSnack({ 
        open: true, 
        message: payload.creatorRole === 'buyer'
          ? `Purchase order created successfully! ${(payload.amount ? payload.amount.toLocaleString() : '0')} Wallet Credits have been held in escrow and seller ${payload.targetUserMobile} has been notified. Redirecting to order details...`
          : `Product listing created successfully for buyer ${payload.targetUserMobile}! Redirecting to order details...`, 
        severity: 'success' 
      });
      
      // Navigate to order details after brief delay to show success message
      setTimeout(() => {
        if (order?.id && order.id !== 'undefined') {
          navigate(`/orders/${order.id}`);
        } else {
          navigate('/orders'); // Fallback to orders list
        }
      }, 2000);
    } catch (e) {
      setSnack({ open: true, message: e instanceof Error ? e.message : 'Failed to create order', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Create New Escrow Order</Typography>
      </Stack>

      <Card>
        <CardContent>
          {cartData?.fromCart ? (
            <Box>
              <Typography variant="h6" gutterBottom>
                Complete Your Order
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Review your cart items and proceed with payment
              </Typography>
              
              {/* Cart Order Summary */}
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>Order Summary</Typography>
                  {cartData.cartItems?.map((item, index) => (
                    <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">
                        {item.productName} (×{item.quantity})
                        {item.sellerName && <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          by {item.sellerName}
                        </Typography>}
                      </Typography>
                      <Typography variant="body2">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: cartData.currency || 'PKR' })
                          .format(item.price * item.quantity)}
                      </Typography>
                    </Box>
                  ))}
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                    <Typography>Total:</Typography>
                    <Typography>
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: cartData.currency || 'PKR' })
                        .format(cartData.totalAmount || 0)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

              {/* Start from wallet verification step */}
              <OrderCreateStepper 
                submitting={submitting} 
                onSubmit={handleSubmit}
                initialStep={3} // Start at wallet step
                initialRole="buyer"
                initialItems={cartData.cartItems?.map(item => ({
                  productId: item.id, // Pass the product ID from cart
                  name: item.productName,
                  quantity: item.quantity,
                  unitPrice: item.price,
                  images: []
                })) || []}
                initialAmount={cartData.totalAmount || 0}
                initialCurrency={cartData.currency || 'PKR'}
                initialDescription={`Marketplace order: ${cartData.cartItems?.map(i => i.productName).join(', ')}`}
              />
            </Box>
          ) : (
            <OrderCreateStepper submitting={submitting} onSubmit={handleSubmit} />
          )}
        </CardContent>
      </Card>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))}>
        <Alert onClose={() => setSnack(s => ({ ...s, open: false }))} severity={snack.severity} sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>

      {/* KYC Required Dialog */}
      <Dialog open={kycDialog} onClose={() => setKycDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>KYC Verification Required</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            You need to complete KYC verification to start selling on YaqeenPay.
          </Alert>
          <Typography variant="body1" paragraph>
            To create orders as a seller and receive payments, you must first verify your identity through our KYC (Know Your Customer) process.
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Current KYC Status: <strong>{user?.kycStatus || 'Unknown'}</strong>
          </Typography>
          {user?.kycStatus?.toLowerCase() === 'pending' && (
            <Typography variant="body2" color="info.main">
              Your KYC application is currently under review. Please wait for approval before creating seller orders.
            </Typography>
          )}
          {user?.kycStatus?.toLowerCase() === 'rejected' && (
            <Typography variant="body2" color="error.main">
              Your previous KYC application was rejected. Please resubmit with correct documentation.
            </Typography>
          )}
          {(!user?.kycStatus || user.kycStatus.toLowerCase() === 'notsubmitted') && (
            <Typography variant="body2" color="warning.main">
              You haven't submitted KYC documentation yet. Click "Complete KYC Verification" to get started.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setKycDialog(false)} color="secondary">
            Cancel
          </Button>
          <Button 
            onClick={() => {
              setKycDialog(false);
              navigate('/seller/register');
            }} 
            variant="contained" 
            color="primary"
          >
            Complete KYC Verification
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NewOrderPage;
