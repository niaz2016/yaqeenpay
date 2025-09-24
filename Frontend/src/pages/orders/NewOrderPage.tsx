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

  const handleSubmit = async (payload: CreateOrderPayload | any) => {
    try {
      setSubmitting(true);

      // Check if this is a seller request
      if (payload.isSellerRequest) {
        const { title, description, amount, currency, images, targetUserMobile } = payload;
        
        const order: Order = await ordersService.createSellerRequest(
          title,
          description,
          amount,
          currency,
          images,
          targetUserMobile
        );
        
        setSnack({ 
          open: true, 
          message: targetUserMobile 
            ? `Seller request created successfully for buyer ${targetUserMobile}! Your product listing for ${currency} ${amount.toLocaleString()} is now available.`
            : `Seller request created successfully! Your product listing for ${currency} ${amount.toLocaleString()} is now available for buyers.`, 
          severity: 'success' 
        });
        
        // Validate order ID before navigation
        if (order?.id && order.id !== 'undefined') {
          navigate(`/orders/${order.id}`);
        } else {
          navigate('/orders'); // Fallback to orders list
        }
        return;
      }

      // Check if this is the new format with images (buyer order)
      if (payload.images && Array.isArray(payload.images)) {
        // Use the new multipart endpoint
        const { title, description, amount, currency, targetUserMobile, images, creatorRole } = payload;
        
        if (!targetUserMobile || !targetUserMobile.trim()) {
          setSnack({ open: true, message: 'Target user mobile number is required.', severity: 'error' });
          return;
        }

        const order: Order = await ordersService.createWithImages(
          title,
          description,
          amount,
          currency,
          targetUserMobile.trim(),
          images,
          creatorRole
        );
        
        // Send notification based on creator role
        try {
          await notificationService.notifyOrderCreated(
            targetUserMobile, // Use mobile instead of ID
            amount,
            currency,
            order.id
          );
          
          if (creatorRole === 'buyer') {
            await notificationService.notifyEscrowFunded(
              targetUserMobile,
              amount,
              currency,
              order.id
            );
          }
        } catch (notifError) {
          console.warn('Failed to send notifications:', notifError);
          // Don't fail the order creation if notifications fail
        }
        
        setSnack({ 
          open: true, 
          message: creatorRole === 'buyer'
            ? `Order created successfully for seller ${targetUserMobile}! ${currency} ${amount.toLocaleString()} has been frozen in escrow and the seller has been notified.`
            : `Product listing created successfully for buyer ${targetUserMobile}!`, 
          severity: 'success' 
        });
        
        // Validate order ID before navigation
        if (order?.id && order.id !== 'undefined') {
          navigate(`/orders/${order.id}`);
        } else {
          navigate('/orders'); // Fallback to orders list
        }
        return;
      }

      // Original logic for orders without images - now uses mobile instead of seller ID
      if (!payload.targetUserMobile || !payload.targetUserMobile.trim()) {
        setSnack({ open: true, message: 'Target user mobile number is required.', severity: 'error' });
        return;
      }

      // API expects the payload wrapped in a `command` object (server validation error indicated "The command field is required.")
      const apiPayload = {
        command: {
          ...payload,
          targetUserMobile: payload.targetUserMobile.trim(),
        },
      };

      const order: Order = await ordersService.create(apiPayload as any);
      
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
          ? `Order created successfully for seller ${payload.targetUserMobile}! ${payload.currency} ${payload.amount.toLocaleString()} has been frozen in escrow and the seller has been notified.`
          : `Product listing created successfully for buyer ${payload.targetUserMobile}!`, 
        severity: 'success' 
      });
      
      // Validate order ID before navigation
      if (order?.id && order.id !== 'undefined') {
        navigate(`/orders/${order.id}`);
      } else {
        navigate('/orders'); // Fallback to orders list
      }
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
