// src/components/orders/IncomingOrderCard.tsx
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Divider
} from '@mui/material';
import { 
  CheckCircle, 
  Cancel, 
  ShoppingCart, 
  AccountBalanceWallet,
  Schedule,
  Person
} from '@mui/icons-material';
import type { Order } from '../../types/order';

interface Props {
  order: Order;
  onApprove: (orderId: string) => Promise<void>;
  onReject: (orderId: string, reason: string) => Promise<void>;
  disabled?: boolean;
}

const IncomingOrderCard: React.FC<Props> = ({ order, onApprove, onReject, disabled = false }) => {
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending-payment': return 'warning';
      case 'payment-confirmed': return 'success';
      case 'awaiting-shipment': return 'info';
      case 'shipped': return 'primary';
      case 'delivered': return 'success';
      case 'completed': return 'success';
      case 'rejected': return 'error';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const canTakeAction = () => {
    return ['pending-payment', 'payment-confirmed'].includes(order.status);
  };

  const handleApprove = async () => {
    try {
      setProcessing(true);
      await onApprove(order.id);
    } catch (error) {
      console.error('Failed to approve order:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      return;
    }

    try {
      setProcessing(true);
      await onReject(order.id, rejectionReason);
      setShowRejectDialog(false);
      setRejectionReason('');
    } catch (error) {
      console.error('Failed to reject order:', error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack spacing={2}>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ShoppingCart />
                  Order #{order.code || order.id.slice(0, 8)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Created: {formatDate(order.createdAt)}
                </Typography>
              </Box>
              <Chip
                label={order.status.replace('-', ' ').toUpperCase()}
                color={getStatusColor(order.status) as any}
                size="small"
              />
            </Box>

            {/* Order Details */}
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Order Details
              </Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Typography variant="body1">
                  <strong>Amount:</strong> {order.currency} {order.amount.toLocaleString()}
                </Typography>
                <Typography variant="body1">
                  <strong>Currency:</strong> {order.currency}
                </Typography>
              </Stack>
              {order.description && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Description:</strong> {order.description}
                </Typography>
              )}
            </Box>

            {/* Items */}
            {order.items && order.items.length > 0 && (
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Items
                </Typography>
                {order.items.map((item, index) => (
                  <Box key={index} sx={{ ml: 1 }}>
                    <Typography variant="body2">
                      • {item.name} x {item.quantity} @ {order.currency} {item.unitPrice} each
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}

            {/* Buyer Info */}
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Buyer Information
              </Typography>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Person fontSize="small" />
                ID: {order.buyerId}
              </Typography>
            </Box>

            {/* Escrow Status */}
            {order.status === 'payment-confirmed' && (
              <Alert severity="success" icon={<AccountBalanceWallet />}>
                <Typography variant="body2">
                  <strong>Escrow Funded!</strong> {order.currency} {order.amount.toLocaleString()} has been frozen and will be released to your wallet once the buyer confirms receipt.
                </Typography>
              </Alert>
            )}

            {order.status === 'pending-payment' && (
              <Alert severity="warning" icon={<Schedule />}>
                <Typography variant="body2">
                  <strong>Awaiting Payment:</strong> The buyer needs to complete payment to fund the escrow.
                </Typography>
              </Alert>
            )}

            {/* Actions */}
            {canTakeAction() && !disabled && (
              <>
                <Divider />
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircle />}
                    onClick={handleApprove}
                    disabled={processing}
                    sx={{ flex: 1 }}
                  >
                    Accept Order
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Cancel />}
                    onClick={() => setShowRejectDialog(true)}
                    disabled={processing}
                    sx={{ flex: 1 }}
                  >
                    Reject Order
                  </Button>
                </Stack>
              </>
            )}

            {order.status === 'awaiting-shipment' && (
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Ready to Ship:</strong> You've accepted this order. Please ship the items and update the tracking information.
                </Typography>
              </Alert>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onClose={() => setShowRejectDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Order</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Please provide a reason for rejecting this order. This will be communicated to the buyer.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Rejection Reason"
            fullWidth
            multiline
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="e.g., Item out of stock, cannot ship to this location, etc."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRejectDialog(false)} disabled={processing}>
            Cancel
          </Button>
          <Button 
            onClick={handleReject} 
            color="error" 
            variant="contained"
            disabled={!rejectionReason.trim() || processing}
          >
            Reject Order
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default IncomingOrderCard;