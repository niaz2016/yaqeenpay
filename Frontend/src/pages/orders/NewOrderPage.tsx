import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, Stack, Snackbar, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ordersService from '../../services/ordersService';
import type { CreateOrderPayload, Order } from '../../types/order';
import OrderCreateStepper from '../../components/orders/OrderCreateStepper';

const NewOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const handleSubmit = async (payload: CreateOrderPayload) => {
    try {
      setSubmitting(true);
      const order: Order = await ordersService.create(payload);
      setSnack({ open: true, message: 'Order created successfully', severity: 'success' });
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
