import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, Stack, Snackbar, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ordersService from '../../services/ordersService';
import notificationService from '../../services/notificationService';
import type { CreateOrderPayload, Order } from '../../types/order';
import OrderCreateStepper from '../../components/orders/OrderCreateStepper';

const NewOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const handleSubmit = async (payload: CreateOrderPayload) => {
    try {
      setSubmitting(true);

      // Normalize sellerId to a GUID string (server requires a Guid)
      // payload may provide sellerId as string, number, or nested object (seller.id)
      const rawSellerId = (payload as any).sellerId ?? (payload as any).seller?.id;
      const sellerId = rawSellerId != null ? String(rawSellerId) : undefined;

      const guidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
      if (!sellerId || !guidRegex.test(sellerId)) {
        setSnack({ open: true, message: 'Invalid sellerId — expected a GUID.', severity: 'error' });
        return;
      }

      // API expects the payload wrapped in a `command` object (server validation error indicated "The command field is required.")
      const apiPayload = {
        command: {
          ...payload,
          sellerId, // ensure sellerId is the GUID string
        },
      };

      const order: Order = await ordersService.create(apiPayload as any);
      
      // Send notification to seller about new order and escrow funding
      try {
        await notificationService.notifyOrderCreated(
          sellerId,
          payload.amount,
          payload.currency,
          order.id
        );
        await notificationService.notifyEscrowFunded(
          sellerId,
          payload.amount,
          payload.currency,
          order.id
        );
      } catch (notifError) {
        console.warn('Failed to send notifications:', notifError);
        // Don't fail the order creation if notifications fail
      }
      
      setSnack({ 
        open: true, 
        message: `Order created successfully! ${payload.currency} ${payload.amount.toLocaleString()} has been frozen in escrow and the seller has been notified.`, 
        severity: 'success' 
      });
      navigate(`/orders/${order.id}`);
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
          <OrderCreateStepper submitting={submitting} onSubmit={handleSubmit} />
        </CardContent>
      </Card>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))}>
        <Alert onClose={() => setSnack(s => ({ ...s, open: false }))} severity={snack.severity} sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NewOrderPage;
