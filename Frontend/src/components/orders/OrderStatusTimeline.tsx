import React, { useEffect, useState } from 'react';
import { Box, Stack, Typography, Chip, LinearProgress, Stepper, Step, StepLabel, StepContent } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PaymentIcon from '@mui/icons-material/Payment';
import CancelIcon from '@mui/icons-material/Cancel';
import type { Order, OrderStatus } from '../../types/order';
import ordersService from '../../services/ordersService';

interface Props {
  order: Order;
}

interface TimelineStep {
  status: OrderStatus;
  label: string;
  completed: boolean;
  timestamp?: string;
  note?: string;
  icon: React.ReactNode;
}

const getStatusIcon = (status: OrderStatus, completed: boolean) => {
  const props = { fontSize: 'small' as const };
  
  switch (status) {
    case 'pending-payment':
    case 'payment-confirmed':
      return <PaymentIcon {...props} />;
    case 'awaiting-shipment':
    case 'shipped':
      return <LocalShippingIcon {...props} />;
    case 'delivered':
    case 'completed':
      return completed ? <CheckCircleIcon {...props} /> : <PendingIcon {...props} />;
    case 'rejected':
    case 'cancelled':
    case 'disputed':
      return <CancelIcon {...props} />;
    default:
      return <PendingIcon {...props} />;
  }
};

const defaultTimeline = (order: Order): TimelineStep[] => {
  const statusMap: Record<OrderStatus, string> = {
    'pending-payment': 'Pending Payment',
    'payment-confirmed': 'Payment Confirmed',
    'awaiting-shipment': 'Awaiting Shipment',
    'shipped': 'Shipped',
    'delivered': 'Delivered',
    'completed': 'Completed',
    'rejected': 'Rejected',
    'disputed': 'Disputed',
    'cancelled': 'Cancelled',
  };

  const normalFlow: OrderStatus[] = [
    'pending-payment',
    'payment-confirmed', 
    'awaiting-shipment',
    'shipped',
    'delivered',
    'completed'
  ];

  const currentStatus = order.status;
  const currentIndex = normalFlow.indexOf(currentStatus);
  
  // Handle special cases (rejected, disputed, cancelled)
  if (['rejected', 'disputed', 'cancelled'].includes(currentStatus)) {
    // Show normal flow up to a certain point, then show current status
    const steps: TimelineStep[] = normalFlow.slice(0, 3).map((status, index) => ({
      status,
      label: statusMap[status],
      completed: index < 2, // Only first two steps completed for rejected orders
      timestamp: index < 2 ? order.createdAt : undefined,
      icon: getStatusIcon(status, index < 2)
    }));
    
    // Add the final status
    steps.push({
      status: currentStatus,
      label: statusMap[currentStatus],
      completed: true,
      timestamp: order.updatedAt || order.createdAt,
      note: 'Current status',
      icon: getStatusIcon(currentStatus, true)
    });
    
    return steps;
  }

  // Normal flow
  return normalFlow.map((status, index) => ({
    status,
    label: statusMap[status],
    completed: index <= currentIndex,
    timestamp: index <= currentIndex ? order.createdAt : undefined,
    note: index === currentIndex ? 'Current status' : undefined,
    icon: getStatusIcon(status, index <= currentIndex)
  }));
};

const OrderStatusTimeline: React.FC<Props> = ({ order }) => {
  const [loading, setLoading] = useState(false);
  const [timeline, setTimeline] = useState<TimelineStep[]>([]);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        setLoading(true);
        const res = await ordersService.getTracking(order.id);
        if (!ignore) {
          // Convert API response to TimelineStep format
          const steps: TimelineStep[] = res.timeline.map(event => ({
            status: event.status as OrderStatus,
            label: event.status.split('-').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' '),
            completed: true,
            timestamp: event.at,
            note: event.note,
            icon: getStatusIcon(event.status as OrderStatus, true)
          }));
          setTimeline(steps);
        }
      } catch {
        // Fallback to default timeline
        if (!ignore) setTimeline(defaultTimeline(order));
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => { ignore = true; };
  }, [order.id, order.status]);

  return (
    <Box>
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      
      <Stepper orientation="vertical" activeStep={timeline.findIndex(step => !step.completed)}>
        {timeline.map((step) => (
          <Step key={step.status} completed={step.completed}>
            <StepLabel 
              icon={step.icon}
              optional={step.note && (
                <Chip label={step.note} size="small" color="primary" variant="outlined" />
              )}
            >
              <Typography variant="subtitle2">{step.label}</Typography>
            </StepLabel>
            <StepContent>
              <Stack gap={0.5}>
                {step.timestamp && (
                  <Typography variant="body2" color="text.secondary">
                    {new Date(step.timestamp).toLocaleString()}
                  </Typography>
                )}
                {step.note && step.note !== 'Current status' && (
                  <Typography variant="body2" color="text.secondary">
                    {step.note}
                  </Typography>
                )}
              </Stack>
            </StepContent>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};

export default OrderStatusTimeline;
