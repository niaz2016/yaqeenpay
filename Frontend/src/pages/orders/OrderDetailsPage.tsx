import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, Typography, Stack, Chip, Button, Divider, CircularProgress, Snackbar, Alert, Dialog, DialogContent, DialogTitle, IconButton, ImageList, ImageListItem, Paper, Rating as MuiRating } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ImageIcon from '@mui/icons-material/Image';
import StarIcon from '@mui/icons-material/Star';
import EditIcon from '@mui/icons-material/Edit';
import { useAuth } from '../../context/AuthContext';
import ordersService from '../../services/ordersService';
import ratingService from '../../services/ratingService';
import type { Order } from '../../types/order';
import type { Rating } from '../../types/rating';
import { normalizeImageUrl, placeholderDataUri } from '../../utils/image';
import logger from '../../utils/logger';

import OrderStatusTimeline from '../../components/orders/OrderStatusTimeline';
import DeliveryDecisionDialog from '../../components/orders/DeliveryDecisionDialog';
import RateUserModal from '../../components/rating/RateUserModal';
import RatingSummary from '../../components/rating/RatingSummary';

// Local normalizeImageUrl removed (using shared util)

const OrderDetailsPage: React.FC = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  // Track mounted state to avoid setState on unmounted component causing inconsistent React tree (can blank screen)
  const mountedRef = useRef(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decisionOpen, setDecisionOpen] = useState(false);

  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');
  const [confirmState, setConfirmState] = useState<{ open: boolean; action: null | 'pay' | 'ship' | 'confirmDelivery'; title?: string; message?: string; processing?: boolean }>({ open: false, action: null });
  
  // Rating modal state
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [showOtherUserRating, setShowOtherUserRating] = useState(false);
  const [existingRating, setExistingRating] = useState<Rating | null>(null);
  const [canEditRating, setCanEditRating] = useState(false);

  // Helper function to determine user's role in this order
  const getUserRole = (): 'buyer' | 'seller' | 'unknown' => {
    if (!user?.id || !order) return 'unknown';
    if (order.buyerId === user.id) return 'buyer';
    if (order.sellerId === user.id) return 'seller';
    return 'unknown';
  };

  // Helper function to collect all images from order and items
  const getAllOrderImages = (): string[] => {
    if (!order) return [];
    const images: string[] = [];
    
    // Add order-level images
    if (order.imageUrls && order.imageUrls.length > 0) {
      images.push(...order.imageUrls);
    }
    
    // Add images from items
    if (order.items && order.items.length > 0) {
      order.items.forEach((item) => {
        if (item.imageUrls && item.imageUrls.length > 0) {
          images.push(...item.imageUrls);
        }
      });
    }
    
    return images;
  };

  // Debug helper to inspect URL transformations
  const debugNormalize = (original: string) => {
    const normalized = normalizeImageUrl(original);
    // Development helper: use centralized logger instead of console.debug
    if (import.meta.env.DEV) {
      logger.debug('[ImageDebug] original -> normalized', { original, normalized });
    }
    return normalized;
  };

  // Handle image click
  const handleImageClick = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setImageDialogOpen(true);
  };



  const load = async () => {
    // Validate orderId before making API call
    if (!orderId || orderId.trim() === '' || orderId === 'undefined') {
      setError('Invalid order ID. Redirecting to orders list...');
      setLoading(false);
      setTimeout(() => navigate('/orders'), 2000);
      return;
    }
    try {
      const res = await ordersService.getById(orderId);
      setOrder(res);
      setError(null);
      
      // Load existing rating if order is completed/rejected/cancelled
      if (['Completed', 'Rejected', 'Cancelled'].includes(res.status)) {
        await loadExistingRating(orderId);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load order');
      logger.error('[OrderDetails] load error', e);
    } finally {
      setLoading(false);
    }
  };

  const loadExistingRating = async (orderIdToCheck: string) => {
    try {
      const ratings = await ratingService.getRatingsByOrder(orderIdToCheck);
      
      // Find rating given by current user
      const myRating = ratings.find(r => r.reviewerId === user?.id);
      
      if (myRating) {
        setExistingRating(myRating);
        
        // Check if rating can be edited (within 30 days)
        const ratingDate = new Date(myRating.createdAt);
        const now = new Date();
        const daysSinceRating = Math.floor((now.getTime() - ratingDate.getTime()) / (1000 * 60 * 60 * 24));
        setCanEditRating(daysSinceRating <= 30);
      }
    } catch (e) {
      logger.debug('Failed to load existing rating (non-fatal):', e);
      // Don't show error to user, just log it
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => { mountedRef.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const executeConfirmedAction = async () => {
    // Snapshot action & order to avoid references changing mid-await
    const action = confirmState.action;
    const targetOrder = order;
    if (!action || !targetOrder) return;
    setConfirmState(cs => ({ ...cs, processing: true }));
    try {
      let updated: Order | null = null;
      if (action === 'pay') {
        const res = await ordersService.payForOrder(targetOrder.id);
        try {
          updated = await ordersService.getById(targetOrder.id);
        } catch (inner) {
          logger.warn('[OrderDetails] Failed fetching updated order after pay, using previous order snapshot', inner);
          updated = { ...targetOrder, status: targetOrder.status }; // no-op fallback
        }
        if (mountedRef.current && updated) setOrder(updated);
        if (mountedRef.current) setSnack({ open: true, message: res.message || 'Payment successful', severity: 'success' });
      } else if (action === 'ship') {
        await ordersService.markAsShipped(targetOrder.id!, {});
        try {
          updated = await ordersService.getById(targetOrder.id);
        } catch (inner) {
          logger.warn('[OrderDetails] Failed fetching updated order after ship, using previous order snapshot', inner);
          updated = { ...targetOrder, status: targetOrder.status }; // no-op fallback
        }
        if (mountedRef.current && updated) setOrder(updated);
        if (mountedRef.current) setSnack({ open: true, message: 'Order marked as shipped', severity: 'success' });
      } else if (action === 'confirmDelivery') {
        updated = await ordersService.confirmDelivery(targetOrder.id!);
        if (mountedRef.current && updated) setOrder(updated);
  if (mountedRef.current) setSnack({ open: true, message: 'Delivery confirmed. Escrowed Wallet Credits will be released to the seller.', severity: 'success' });
      }
    } catch (e) {
      logger.error('[OrderDetails] executeConfirmedAction error', e);
      if (mountedRef.current) setSnack({ open: true, message: e instanceof Error ? e.message : 'Action failed', severity: 'error' });
    } finally {
      if (mountedRef.current) setConfirmState({ open: false, action: null, processing: false });
    }
  };

  const handleRejectDelivery = async (reason: string, evidenceUrls?: string[]) => {
    if (!orderId || orderId.trim() === '' || orderId === 'undefined') {
      setSnack({ open: true, message: 'Invalid order ID', severity: 'error' });
      return;
    }
    try {
      const updated = await ordersService.rejectDelivery({ orderId, decision: 'reject', rejectionReason: reason, evidenceUrls });
      setOrder(updated);
      setSnack({ open: true, message: 'Rejection submitted. Our team will review the dispute.', severity: 'success' });
    } catch (e) {
      setSnack({ open: true, message: e instanceof Error ? e.message : 'Failed to reject delivery', severity: 'error' });
    }
  };

  if (loading) return <Stack alignItems="center" py={6}><CircularProgress /></Stack>;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!order) return null;

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} mb={3} gap={2}>
        <Stack>
          <Typography variant="h4">Order Details</Typography>
          <Typography variant="body1" color="text.secondary">
            {order.code || `Order #${order.id?.slice(-8) || 'N/A'}`}
          </Typography>
        </Stack>
        <Stack alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
          <Chip 
            label={order.status} 
            color={
              ['Completed', 'completed'].includes(order.status) ? 'success' :
              ['Cancelled', 'cancelled', 'Rejected', 'rejected'].includes(order.status) ? 'error' :
              ['PaymentConfirmed', 'payment-confirmed', 'Shipped', 'shipped'].includes(order.status) ? 'primary' :
              'default'
            }
            sx={{ mb: 1 }}
          />
          <Typography variant="h5" fontWeight="bold" color="primary.main">
            {order.currency} {order.amount ? order.amount.toLocaleString() : '0'}
          </Typography>
        </Stack>
      </Stack>

      {/* Order Details Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>Order Details</Typography>
          <Stack spacing={2}>
            <Stack direction="row" spacing={4} flexWrap="wrap">
              <Box>
                <Typography variant="body2" color="text.secondary">Order ID</Typography>
                <Typography variant="body1" fontWeight="medium">{order.code || order.id}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Amount</Typography>
                <Typography variant="body1" fontWeight="medium">{order.currency} {order.amount ? order.amount.toLocaleString() : '0'}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Status</Typography>
                <Chip label={order.status} size="small" />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Created</Typography>
                <Typography variant="body1">{order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}</Typography>
              </Box>
              {order.updatedAt && order.updatedAt !== order.createdAt && (
                <Box>
                  <Typography variant="body2" color="text.secondary">Last Updated</Typography>
                  <Typography variant="body1">{order.updatedAt ? new Date(order.updatedAt).toLocaleString() : 'N/A'}</Typography>
                </Box>
              )}
            </Stack>
            
            {order.description && (
              <Box>
                <Typography variant="body2" color="text.secondary">Description</Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {order.description}
                </Typography>
              </Box>
            )}

            {(order.isAmountFrozen || order.frozenAmount) && (
              <Box>
                <Typography variant="body2" color="text.secondary">Escrow Status</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip 
                    label={order.isAmountFrozen ? "Wallet Credits Held in Escrow" : "No Escrow"} 
                    color={order.isAmountFrozen ? "success" : "default"}
                    size="small"
                  />
                  {order.frozenAmount && (
                    <Typography variant="body2">
                      ({order.frozenAmount ? order.frozenAmount.toLocaleString() : '0'} Wallet Credits held)
                    </Typography>
                  )}
                </Stack>
              </Box>
            )}

            {order.paymentDate && (
              <Box>
                <Typography variant="body2" color="text.secondary">Payment Date</Typography>
                <Typography variant="body1">{order.paymentDate ? new Date(order.paymentDate).toLocaleString() : 'N/A'}</Typography>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Parties Information Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>Order Parties</Typography>
          
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
            {/* Seller Information */}
            <Box flex={1}>
              <Typography variant="body2" color="text.secondary" fontWeight="bold" gutterBottom>
                Seller Details
              </Typography>
              <Stack spacing={1.5}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Business Name</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {order.sellerBusinessName || order.sellerName || 'Not Available'}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">Seller ID</Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                    {order.sellerId}
                  </Typography>
                </Box>

                {(order.sellerPhone || order.targetUserMobile) && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">Phone Number</Typography>
                    <Typography variant="body1">
                      {order.sellerPhone || order.targetUserMobile}
                    </Typography>
                  </Box>
                )}

                {order.sellerName && order.sellerBusinessName && order.sellerName !== order.sellerBusinessName && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">Contact Person</Typography>
                    <Typography variant="body1">{order.sellerName}</Typography>
                  </Box>
                )}
              </Stack>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
            <Divider sx={{ display: { xs: 'block', md: 'none' } }} />

            {/* Buyer Information */}
            <Box flex={1}>
              <Typography variant="body2" color="text.secondary" fontWeight="bold" gutterBottom>
                Buyer Details
              </Typography>
              <Stack spacing={1.5}>
                {order.buyerName && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">Buyer Name</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {order.buyerName}
                    </Typography>
                  </Box>
                )}

                <Box>
                  <Typography variant="body2" color="text.secondary">Buyer ID</Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                    {order.buyerId}
                  </Typography>
                </Box>

                {/* Buyer Phone Number */}
                {(order.buyerPhone || order.targetUserMobile) && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">Phone Number</Typography>
                    <Typography variant="body1">
                      {order.buyerPhone || order.targetUserMobile}
                    </Typography>
                  </Box>
                )}

                {/* Buyer Delivery Address */}
                {order.shipment && (order.shipment.addressLine1 || order.shipment.city) && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">Delivery Address</Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                      {[
                        order.shipment.addressLine1,
                        order.shipment.addressLine2,
                        [order.shipment.city, order.shipment.state].filter(Boolean).join(', '),
                        order.shipment.postalCode,
                        order.shipment.country
                      ].filter(Boolean).join('\n')}
                    </Typography>
                  </Box>
                )}

                <Box>
                  <Typography variant="body2" color="text.secondary">Your Role in this Order</Typography>
                  <Chip 
                    label={getUserRole() === 'buyer' ? 'You are the Buyer' : getUserRole() === 'seller' ? 'You are the Seller' : 'Observer'} 
                    color={getUserRole() === 'buyer' ? 'primary' : getUserRole() === 'seller' ? 'success' : 'default'}
                    size="small"
                  />
                </Box>

                {order.creatorRole && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">Order Created By</Typography>
                    <Chip 
                      label={order.creatorRole === 'buyer' ? 'Buyer (Purchase Order)' : 'Seller (Product Listing)'} 
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                )}
              </Stack>
            </Box>
          </Stack>

          {/* Ratings & Reviews Section - Always visible for transparency */}
          {getUserRole() !== 'unknown' && (
            <>
              <Divider sx={{ my: 3 }} />
              
              <Box >
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                  <StarIcon sx={{ color: 'warning.main' }} />
                  <Typography variant="subtitle1" fontWeight="bold">
                    Ratings & Reviews
                  </Typography>
                </Stack>

                {/* Other User's Rating Summary - Show prominently for trust */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" fontWeight="medium" gutterBottom>
                    {getUserRole() === 'buyer' ? `Seller Rating: ${order.sellerName || 'Seller'}` : `Buyer Rating: ${order.buyerName || 'Buyer'}`}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setShowOtherUserRating(!showOtherUserRating)}
                    sx={{ mb: 2 }}
                  >
                    {showOtherUserRating ? 'Hide' : 'View'} Rating History
                  </Button>
                  {showOtherUserRating && (
                    <RatingSummary
                      userId={getUserRole() === 'buyer' ? order.sellerId : order.buyerId}
                      compact={false}
                    />
                  )}
                </Box>

                {/* Your Rating - Only show for completed/rejected/cancelled orders */}
                {(order.status === 'Completed' || order.status === 'Rejected' || order.status === 'Cancelled') && (
                  <Box>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="body2" color="text.secondary" fontWeight="medium" gutterBottom>
                      Your Rating
                    </Typography>
                    
                    {existingRating ? (
                      // Show existing rating
                      <Box>
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                          <MuiRating value={existingRating.score} readOnly size="large" />
                          <Typography variant="h6">{existingRating.score}.0</Typography>
                        </Stack>
                        
                        {existingRating.comment && (
                          <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Your Review
                            </Typography>
                            <Typography variant="body1">
                              {existingRating.comment}
                            </Typography>
                          </Paper>
                        )}
                        
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="caption" color="text.secondary">
                            Rated on {new Date(existingRating.createdAt).toLocaleDateString()}
                          </Typography>
                          {canEditRating && (
                            <>
                              <Typography variant="caption" color="text.secondary">•</Typography>
                              <Button
                                size="small"
                                startIcon={<EditIcon />}
                                onClick={() => setRatingModalOpen(true)}
                              >
                                Edit Rating
                              </Button>
                            </>
                          )}
                          {!canEditRating && (
                            <>
                              <Typography variant="caption" color="text.secondary">•</Typography>
                              <Typography variant="caption" color="error.main">
                                Edit period expired (30 days)
                              </Typography>
                            </>
                          )}
                        </Stack>
                      </Box>
                    ) : (
                      // Show rate button if not rated yet
                      <>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          startIcon={<StarIcon />}
                          onClick={() => setRatingModalOpen(true)}
                        >
                          Rate {getUserRole() === 'buyer' ? 'Seller' : 'Buyer'}
                        </Button>
                        <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                          Share your experience to help the community
                        </Typography>
                      </>
                    )}
                  </Box>
                )}
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Order Status Timeline */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>Order Status Timeline</Typography>
          <OrderStatusTimeline order={order} />
        </CardContent>
      </Card>

      {order.items && order.items.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>Order Items</Typography>
            <Stack spacing={2}>
              {order.items.map((it, idx) => (
                <Paper key={idx} variant="outlined" sx={{ p: 2 }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
                    <Stack flex={1}>
                      <Typography variant="body1" fontWeight="medium">{it.name}</Typography>
                      {it.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {it.description}
                        </Typography>
                      )}
                      <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Quantity: <span style={{ fontWeight: 500 }}>{it.quantity}</span>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Unit Price: <span style={{ fontWeight: 500 }}>{order.currency} {it.unitPrice.toLocaleString()}</span>
                        </Typography>
                      </Stack>
                    </Stack>
                    <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                      <Typography variant="h6" fontWeight="bold">
                        {order.currency} {(it.quantity * it.unitPrice).toLocaleString()}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              ))}
              
              <Divider sx={{ my: 2 }} />
              
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" fontWeight="bold">Total Amount</Typography>
                <Typography variant="h6" fontWeight="bold" color="primary.main">
                  {order.currency} {order.amount ? order.amount.toLocaleString() : '0'}
                </Typography>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}

      {order.shipment && (order.shipment.courier || order.shipment.trackingNumber || order.shipment.addressLine1) && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>Shipping & Delivery Information</Typography>
            <Stack spacing={2}>
              {(order.shipment.courier || order.shipment.trackingNumber) && (
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'primary.50' }}>
                  <Stack spacing={1}>
                    {order.shipment.courier && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">Courier Service</Typography>
                        <Typography variant="body1" fontWeight="medium">{order.shipment.courier}</Typography>
                      </Box>
                    )}
                    {order.shipment.trackingNumber && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">Tracking Number</Typography>
                        <Typography variant="body1" fontWeight="medium" sx={{ fontFamily: 'monospace' }}>
                          {order.shipment.trackingNumber}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Paper>
              )}

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                {order.shipment.shippedAt && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">Shipped Date</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {new Date(order.shipment.shippedAt).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Typography>
                  </Box>
                )}
                {order.shipment.deliveredAt && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">Delivered Date</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {new Date(order.shipment.deliveredAt).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Typography>
                  </Box>
                )}
              </Stack>

              {(order.shipment.addressLine1 || order.shipment.city) && (
                <Box>
                  <Typography variant="body2" color="text.secondary">Delivery Address</Typography>
                  <Typography variant="body1">
                    {order.shipment.addressLine1}
                    {order.shipment.addressLine2 && `, ${order.shipment.addressLine2}`}
                    <br />
                    {order.shipment.city && `${order.shipment.city}, `}
                    {order.shipment.state && `${order.shipment.state} `}
                    {order.shipment.postalCode && `${order.shipment.postalCode}`}
                    {order.shipment.country && (
                      <>
                        <br />
                        {order.shipment.country}
                      </>
                    )}
                  </Typography>
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Order Images */}
      {(getAllOrderImages().length > 0 || import.meta.env.DEV) && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              <ImageIcon /> Order Images
            </Typography>
            {getAllOrderImages().length > 0 ? (
              <>
                <ImageList cols={3} gap={8} sx={{ maxHeight: 400 }}>
                  {getAllOrderImages().map((imageUrl, index) => (
                    <ImageListItem 
                      key={index} 
                      sx={{ cursor: 'pointer', borderRadius: 1, overflow: 'hidden' }}
                      onClick={() => handleImageClick(normalizeImageUrl(imageUrl) || imageUrl)}
                    >
                      <img
                        src={normalizeImageUrl(imageUrl)}
                        alt={`Order attachment ${index + 1}`}
                        loading="lazy"
                        style={{
                          width: '100%',
                          height: '120px',
                          objectFit: 'cover',
                          transition: 'transform 0.2s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                        onError={(e) => {
                          console.warn('Image failed to load:', imageUrl, 'resolved =>', normalizeImageUrl(imageUrl));
                          e.currentTarget.src = placeholderDataUri(120);
                        }}
                      />
                    </ImageListItem>
                  ))}
                </ImageList>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                No images attached to this order
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} flexWrap="wrap" gap={2}>
            {/* Buyer Pay Now button when order not yet paid */}
            {getUserRole() === 'buyer' && ['Created','created','PaymentPending','pending-payment'].includes(order.status) && (
              <Button
                variant="contained"
                color="primary"
                onClick={() => setConfirmState({ open: true, action: 'pay', title: 'Confirm Payment', message: 'Are you sure you want to pay for this order? The amount will be held in escrow as Wallet Credits.' })}
              >
                Pay Now
              </Button>
            )}
            {/* Buyer Delivery Confirmation (only show when order has been shipped) */}
            {getUserRole() === 'buyer' && (order.status === 'Shipped' || order.status === 'Delivered' || order.status === 'DeliveredPendingDecision') && (
              <Button
                variant="contained"
                color="success"
                onClick={() => setConfirmState({ open: true, action: 'confirmDelivery', title: 'Confirm Delivery', message: 'Confirm you have received the order in good condition. This will release escrowed Wallet Credits to the seller.' })}
              >
                Confirm Delivery
              </Button>
            )}
            <Button variant="outlined" color="error" onClick={() => setDecisionOpen(true)}>
              Reject / Dispute
            </Button>
            {/* Seller Mark As Shipped button visible when awaiting shipment composite step */}
            {getUserRole() === 'seller' && (
              ['AwaitingShipment','Confirmed','PaymentConfirmed'].includes(order.status) ||
              // Fallback: paymentDate exists but status not advanced yet
              (!!order.paymentDate && ['Created','PaymentPending','pending-payment','created'].includes(order.status))
            ) && (
              <Button
                variant="contained"
                color="primary"
                onClick={() => setConfirmState({ open: true, action: 'ship', title: 'Mark as Shipped', message: 'Are you sure you want to mark this order as shipped? Buyer will be notified.' })}
              >
                Mark as Shipped
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Rating Modal */}
      {order && getUserRole() !== 'unknown' && (
        <RateUserModal
          open={ratingModalOpen}
          onClose={() => setRatingModalOpen(false)}
          orderId={order.id}
          revieweeId={getUserRole() === 'buyer' ? order.sellerId : order.buyerId}
          revieweeName={getUserRole() === 'buyer' ? (order.sellerName || 'Seller') : (order.buyerName || 'Buyer')}
          revieweeRole={getUserRole() === 'buyer' ? 'seller' : 'buyer'}
          existingRating={existingRating || undefined}
          onRatingSubmitted={async () => {
            setSnack({ open: true, message: existingRating ? 'Rating updated successfully!' : 'Rating submitted successfully!', severity: 'success' });
            setRatingModalOpen(false);
            // Reload the existing rating
            if (orderId) {
              await loadExistingRating(orderId);
            }
          }}
        />
      )}

      {/* Image Preview Dialog */}
      <Dialog 
        open={imageDialogOpen} 
        onClose={() => setImageDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Order Image
          <IconButton onClick={() => setImageDialogOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          {selectedImageUrl && (
            <img
              data-orig={selectedImageUrl}
              src={debugNormalize(selectedImageUrl) || selectedImageUrl}
              alt="Order attachment full view"
              style={{
                maxWidth: '100%',
                maxHeight: '70vh',
                objectFit: 'contain',
              }}
              onError={(e) => {
                const attempted = debugNormalize(selectedImageUrl) || selectedImageUrl;
                logger.error('[ImageDebug] modal image failed', { selectedImageUrl, attempted });
                if (attempted.startsWith('https://')) {
                  const httpAlt = attempted.replace('https://', 'http://');
                  fetch(httpAlt, { method: 'HEAD' }).then(r => {
                    if (r.ok) {
                      logger.info('[ImageDebug] modal switching to http:', httpAlt);
                      e.currentTarget.src = httpAlt;
                    } else {
                      e.currentTarget.src = placeholderDataUri(400);
                    }
                  }).catch(() => { e.currentTarget.src = placeholderDataUri(400); });
                } else {
                  e.currentTarget.src = placeholderDataUri(400);
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <DeliveryDecisionDialog
        open={decisionOpen}
        onClose={() => setDecisionOpen(false)}
        onSubmit={(reason: string, evidence?: string[]) => { setDecisionOpen(false); handleRejectDelivery(reason, evidence); }}
      />

      {/* Generic Confirmation Dialog */}
      <Dialog open={confirmState.open} onClose={() => !confirmState.processing && setConfirmState({ open: false, action: null })} maxWidth="xs" fullWidth>
        <DialogTitle>{confirmState.title || 'Please Confirm'}</DialogTitle>
        <DialogContent>
          <Stack gap={2} py={1}>
            <Typography variant="body2">{confirmState.message}</Typography>
            <Stack direction="row" justifyContent="flex-end" gap={1}>
              <Button disabled={!!confirmState.processing} onClick={() => setConfirmState({ open: false, action: null })}>Cancel</Button>
              <Button variant="contained" color="primary" disabled={!!confirmState.processing} onClick={executeConfirmedAction}>
                {confirmState.processing ? 'Processing...' : 'Yes, Continue'}
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))}>
        <Alert onClose={() => setSnack(s => ({ ...s, open: false }))} severity={snack.severity} sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default OrderDetailsPage;
