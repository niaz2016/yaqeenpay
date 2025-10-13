// src/pages/seller/SellerOrderDetailsPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Chip,
  Alert,
  Divider,
  Stack,
  Card,
  CardContent,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ArrowBack,
  LocalShipping,
  Upload,
  Edit
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { userService } from '../../services/userService';
import type { SellerOrder, ShippingInfo } from '../../types/user';

const shippingInfoSchema = z.object({
  trackingNumber: z.string().min(1, 'Tracking number is required'),
  carrier: z.string().min(1, 'Carrier is required'),
  shippingMethod: z.string().min(1, 'Shipping method is required'),
  estimatedDelivery: z.string().optional(),
  notes: z.string().optional()
});

type ShippingInfoFormData = z.infer<typeof shippingInfoSchema>;

const UserOrderDetailsPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState<SellerOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shippingDialogOpen, setShippingDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ShippingInfoFormData>({
    resolver: zodResolver(shippingInfoSchema),
    defaultValues: {
      trackingNumber: '',
      carrier: '',
      shippingMethod: '',
      estimatedDelivery: '',
      notes: ''
    }
  });

  const loadOrder = async () => {
    // Validate orderId before making API call
    if (!orderId || orderId.trim() === '' || orderId === 'undefined') {
      setError('Invalid order ID. Redirecting to orders list...');
      setLoading(false);
      setTimeout(() => navigate('/seller/orders'), 2000);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const orderData = await userService.getSellerOrderById(orderId);
      setOrder(orderData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const handleUpdateShipping = async (data: ShippingInfoFormData) => {
    if (!orderId || orderId.trim() === '' || orderId === 'undefined') {
      setError('Invalid order ID');
      return;
    }
    
    setActionLoading(true);
    try {
      const shippingInfo: ShippingInfo = {
        trackingNumber: data.trackingNumber,
        carrier: data.carrier,
        shippingMethod: data.shippingMethod,
        estimatedDelivery: data.estimatedDelivery || undefined,
        notes: data.notes || undefined
      };

  await userService.updateShippingInfo(orderId as string, shippingInfo as any);
      setShippingDialogOpen(false);
      reset();
      await loadOrder(); // Refresh order data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update shipping info');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAsShipped = async () => {
    if (!orderId || orderId.trim() === '' || orderId === 'undefined' || !order) {
      setError('Invalid order ID or order data');
      return;
    }
    
    setActionLoading(true);
    try {
  await userService.markOrderAsShipped(orderId, order.trackingNumber || '');
      await loadOrder(); // Refresh order data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark order as shipped');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUploadProof = async () => {
    if (!orderId || orderId.trim() === '' || orderId === 'undefined' || !selectedFile) {
      setError('Invalid order ID or no file selected');
      return;
    }
    
    setActionLoading(true);
    try {
  await userService.uploadShipmentProof(orderId, selectedFile);
      setUploadDialogOpen(false);
      setSelectedFile(null);
      await loadOrder(); // Refresh order data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload proof');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusChip = (status: string) => {
    const statusColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
      'PendingPayment': 'warning',
      'Paid': 'info',
      'Shipped': 'primary',
      'Delivered': 'success',
      'Completed': 'success',
      'Disputed': 'error',
      'Cancelled': 'error'
    };

    return (
      <Chip
        label={status}
        color={statusColors[status] || 'default'}
        size="medium"
      />
    );
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography>Loading order details...</Typography>
        </Box>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography>Order not found</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/seller/orders')}
            sx={{ mr: 2 }}
          >
            Back to Orders
          </Button>
          <Typography variant="h4" component="h1">
            Order #{order.orderNumber}
          </Typography>
          <Box sx={{ ml: 2 }}>
            {getStatusChip(order.status)}
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Stack spacing={3}>
          {/* Order Information */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Order Information
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, mt: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Buyer
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {order.buyerName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {order.buyerEmail}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Amount
                </Typography>
                <Typography variant="h6" color="primary">
                  {order.currency} {order.amount.toFixed(2)}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Created
                </Typography>
                <Typography variant="body1">
                  {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}
                </Typography>
              </Box>
              
              {order.shippedDate && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Shipped
                  </Typography>
                  <Typography variant="body1">
                    {order.shippedDate ? new Date(order.shippedDate).toLocaleString() : 'N/A'}
                  </Typography>
                </Box>
              )}
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Description
            </Typography>
            <Typography variant="body1">
              {order.description}
            </Typography>
            
            {order.shippingAddress && (
              <>
                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                  Shipping Address
                </Typography>
                <Typography variant="body1">
                  {order.shippingAddress}
                </Typography>
              </>
            )}
          </Paper>

          {/* Order Status Timeline */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Order Status
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" fontWeight="medium">
                Current Status: {getStatusChip(order.status)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Last updated: {order.updatedAt ? new Date(order.updatedAt).toLocaleString() : 'N/A'}
              </Typography>
            </Box>
          </Paper>

          {/* Shipping Information */}
          {(order.trackingNumber || order.canShip) && (
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Shipping Information
                </Typography>
                {order.canUpdateShipping && (
                  <Button
                    startIcon={<Edit />}
                    onClick={() => setShippingDialogOpen(true)}
                    variant="outlined"
                    size="small"
                  >
                    Update Shipping
                  </Button>
                )}
              </Box>
              
              {order.trackingNumber ? (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Tracking Number
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {order.trackingNumber}
                  </Typography>
                </Box>
              ) : (
                <Alert severity="info">
                  No shipping information available yet.
                </Alert>
              )}
            </Paper>
          )}

          {/* Actions */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Actions
              </Typography>
              
              <Stack direction="row" spacing={2}>
                {order.canShip && (
                  <Button
                    variant="contained"
                    startIcon={<LocalShipping />}
                    onClick={handleMarkAsShipped}
                    disabled={actionLoading}
                  >
                    Mark as Shipped
                  </Button>
                )}
                
                {order.canUpdateShipping && (
                  <Button
                    variant="outlined"
                    startIcon={<Edit />}
                    onClick={() => setShippingDialogOpen(true)}
                  >
                    Update Shipping Info
                  </Button>
                )}
                
                <Button
                  variant="outlined"
                  startIcon={<Upload />}
                  onClick={() => setUploadDialogOpen(true)}
                >
                  Upload Proof
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Stack>

        {/* Shipping Info Dialog */}
        <Dialog open={shippingDialogOpen} onClose={() => setShippingDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Update Shipping Information</DialogTitle>
          <DialogContent>
            <Box component="form" sx={{ mt: 2 }}>
              <Stack spacing={3}>
                <Controller
                  name="trackingNumber"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Tracking Number"
                      error={!!errors.trackingNumber}
                      helperText={errors.trackingNumber?.message}
                      required
                    />
                  )}
                />
                
                <Controller
                  name="carrier"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Carrier"
                      error={!!errors.carrier}
                      helperText={errors.carrier?.message}
                      required
                    />
                  )}
                />
                
                <Controller
                  name="shippingMethod"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Shipping Method"
                      error={!!errors.shippingMethod}
                      helperText={errors.shippingMethod?.message}
                      required
                    />
                  )}
                />
                
                <Controller
                  name="estimatedDelivery"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Estimated Delivery Date"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
                
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Notes"
                      multiline
                      rows={3}
                    />
                  )}
                />
              </Stack>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShippingDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit(handleUpdateShipping)}
              variant="contained"
              disabled={actionLoading}
            >
              {actionLoading ? 'Updating...' : 'Update'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Upload Proof Dialog */}
        <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)}>
          <DialogTitle>Upload Shipment Proof</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <input
                accept="image/*,.pdf"
                style={{ display: 'none' }}
                id="proof-upload"
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              <label htmlFor="proof-upload">
                <Button variant="outlined" component="span" fullWidth>
                  Choose File
                </Button>
              </label>
              {selectedFile && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Selected: {selectedFile.name}
                </Typography>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUploadProof}
              variant="contained"
              disabled={!selectedFile || actionLoading}
            >
              {actionLoading ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default UserOrderDetailsPage;