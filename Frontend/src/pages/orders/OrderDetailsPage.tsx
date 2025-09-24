import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, Typography, Stack, Chip, Button, Divider, CircularProgress, Snackbar, Alert } from '@mui/material';
import ordersService from '../../services/ordersService';
import type { Order } from '../../types/order';
import OrderStatusTimeline from '../../components/orders/OrderStatusTimeline';
import DeliveryDecisionDialog from '../../components/orders/DeliveryDecisionDialog';

const OrderDetailsPage: React.FC = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decisionOpen, setDecisionOpen] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const load = async () => {
    // Validate orderId before making API call
    if (!orderId || orderId.trim() === '' || orderId === 'undefined') {
      setError('Invalid order ID. Redirecting to orders list...');
      setLoading(false);
      setTimeout(() => navigate('/orders'), 2000);
      return;
    }
    
    try {
      setLoading(true);
      const res = await ordersService.getById(orderId);
      setOrder(res);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    load(); 
  }, [orderId]);

  const handleConfirmDelivery = async () => {
    if (!orderId || orderId.trim() === '' || orderId === 'undefined') {
      setSnack({ open: true, message: 'Invalid order ID', severity: 'error' });
      return;
    }
    try {
      const updated = await ordersService.confirmDelivery(orderId);
      setOrder(updated);
      setSnack({ open: true, message: 'Delivery confirmed. Funds will be released to the seller.', severity: 'success' });
    } catch (e) {
      setSnack({ open: true, message: e instanceof Error ? e.message : 'Failed to confirm delivery', severity: 'error' });
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
          <Typography variant="h5">Order {order.code || order.id}</Typography>
          <Typography variant="body2" color="text.secondary">Seller: {order.sellerName || order.sellerId}</Typography>
        </Stack>
        <Stack alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
          <Chip label={order.status} />
          <Typography variant="h6" mt={1}>{order.amount.toFixed(2)} {order.currency}</Typography>
        </Stack>
      </Stack>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>Order Status</Typography>
          <OrderStatusTimeline order={order} />
        </CardContent>
      </Card>

      {order.items && order.items.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>Items</Typography>
            {order.items.map((it, idx) => (
              <Stack key={idx} direction="row" justifyContent="space-between" py={1}>
                <Typography>{it.name} x {it.quantity}</Typography>
                <Typography>{(it.quantity * it.unitPrice).toFixed(2)} {order.currency}</Typography>
              </Stack>
            ))}
            <Divider sx={{ my: 1 }} />
            <Stack direction="row" justifyContent="space-between">
              <Typography fontWeight={600}>Total</Typography>
              <Typography fontWeight={600}>{order.amount.toFixed(2)} {order.currency}</Typography>
            </Stack>
          </CardContent>
        </Card>
      )}

      {order.shipment && (order.shipment.courier || order.shipment.trackingNumber || order.shipment.addressLine1) && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>Shipping Information</Typography>
            <Stack gap={1}>
              {order.shipment.courier && (
                <Typography>Courier: <b>{order.shipment.courier}</b></Typography>
              )}
              {order.shipment.trackingNumber && (
                <Typography>Tracking #: <b>{order.shipment.trackingNumber}</b></Typography>
              )}
              {order.shipment.shippedAt && (
                <Typography>Shipped: {new Date(order.shipment.shippedAt).toLocaleString()}</Typography>
              )}
              {order.shipment.deliveredAt && (
                <Typography>Delivered: {new Date(order.shipment.deliveredAt).toLocaleString()}</Typography>
              )}
              {(order.shipment.addressLine1 || order.shipment.city) && (
                <Typography>
                  Address: {order.shipment.addressLine1} {order.shipment.addressLine2 ? `, ${order.shipment.addressLine2}` : ''}, {order.shipment.city} {order.shipment.state} {order.shipment.postalCode} {order.shipment.country}
                </Typography>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} gap={2}>
            <Button variant="contained" color="success" onClick={handleConfirmDelivery} disabled={order.status !== 'delivered'}>
              Confirm Delivery
            </Button>
            <Button variant="outlined" color="error" onClick={() => setDecisionOpen(true)}>
              Reject / Dispute
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <DeliveryDecisionDialog
        open={decisionOpen}
        onClose={() => setDecisionOpen(false)}
        onSubmit={(reason: string, evidence?: string[]) => { setDecisionOpen(false); handleRejectDelivery(reason, evidence); }}
      />

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))}>
        <Alert onClose={() => setSnack(s => ({ ...s, open: false }))} severity={snack.severity} sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default OrderDetailsPage;
