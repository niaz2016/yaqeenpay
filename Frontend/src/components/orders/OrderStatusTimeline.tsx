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
  status: string;
  label: string;
  completed: boolean;
  timestamp?: string;
  note?: string;
  icon: React.ReactNode;}

const getStatusIcon = (status: string, completed: boolean) => {
  const props = { fontSize: 'small' as const };
  
  switch (status) {
    case 'PaymentPending':
    case 'PaymentConfirmed':
    case 'pending-payment':
    case 'payment-confirmed':
      return <PaymentIcon {...props} />;
    case 'Confirmed':
    case 'Shipped':
    case 'awaiting-shipment':
    case 'shipped':
      return <LocalShippingIcon {...props} />;
    case 'Delivered':
    case 'DeliveredPendingDecision':
    case 'Completed':
    case 'delivered':
    case 'completed':
      return completed ? <CheckCircleIcon {...props} /> : <PendingIcon {...props} />;
    case 'Rejected':
    case 'Cancelled':
    case 'Disputed':
    case 'rejected':
    case 'cancelled':
    case 'disputed':
      return <CancelIcon {...props} />;
    default:
      return <PendingIcon {...props} />;
  }
};

const defaultTimeline = (order: Order): TimelineStep[] => {
  const statusMap: Record<string, string> = {
    // Backend enum values
    'Created': 'Order Created',
    'PaymentPending': 'Pending Payment',
    'PaymentConfirmed': 'Payment Confirmed',
    'Confirmed': 'Awaiting Shipment',
    'Shipped': 'Shipped',
    'Delivered': 'Delivered',
    'DeliveredPendingDecision': 'Pending Decision',
    'Completed': 'Completed',
    'Cancelled': 'Cancelled',
    'Rejected': 'Rejected',
    'Disputed': 'Disputed',
    'DisputeResolved': 'Dispute Resolved',
    // Legacy frontend values
    'created': 'Order Created',
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

  // Collapsed visual flow combining PaymentConfirmed + AwaitingShipment
  const visualFlow: Array<{ key: string; group: string[] }> = [
    { key: 'Created', group: ['Created'] },
    { key: 'PaymentPending', group: ['PaymentPending', 'pending-payment'] },
    { key: 'PaymentConfirmedAwaitingShipment', group: ['PaymentConfirmed','Confirmed','AwaitingShipment','payment-confirmed','awaiting-shipment'] },
    { key: 'Shipped', group: ['Shipped','shipped'] },
    { key: 'Delivered', group: ['Delivered','DeliveredPendingDecision','delivered'] },
    { key: 'Completed', group: ['Completed','completed'] },
  ];

  const currentStatus = order.status;
  const currentIndex = visualFlow.findIndex(v => v.group.includes(currentStatus));
  
  // Handle special cases (rejected, disputed, cancelled)
  if (['rejected','disputed','cancelled','Rejected','Disputed','Cancelled'].includes(currentStatus)) {
    // Show normal flow up to a certain point, then show current status
    const baseSubset = visualFlow.slice(0, 3); // up to composite step
    const steps: TimelineStep[] = baseSubset.map((vf, index) => {
      const displayStatus = vf.key;
      let timestamp: string | undefined = undefined;
      const isCompleted = index < baseSubset.length; // all base steps completed before terminal status
      
      if (isCompleted) {
        switch (displayStatus) {
          case 'Created':
            timestamp = order.createdAt;
            break;
          case 'PaymentPending':
            timestamp = order.createdAt;
            break;
          case 'PaymentConfirmedAwaitingShipment':
            timestamp = order.paymentDate || order.updatedAt || order.createdAt;
            break;
          default:
            timestamp = order.updatedAt || order.createdAt;
        }
      }
      
      return {
        status: displayStatus,
        label: displayStatus === 'PaymentConfirmedAwaitingShipment' ? 'Payment Confirmed / Awaiting Shipment' : (statusMap[displayStatus] || displayStatus),
        completed: isCompleted,
        timestamp,
        icon: getStatusIcon(displayStatus, isCompleted)
      };
    });
    
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

  // Normal flow with better timestamp handling
  let result = visualFlow.map((vf, index) => {
    const displayStatus = vf.key;
    let timestamp: string | undefined = undefined;
    const isCompleted = index <= currentIndex;
    
    if (isCompleted) {
      // Use specific timestamps where available, with intelligent fallbacks
      switch (displayStatus) {
        case 'Created':
          timestamp = order.createdAt;
          break;
        case 'PaymentPending':
          // PaymentPending would be shortly after creation
          timestamp = order.createdAt;
          break;
        case 'PaymentConfirmedAwaitingShipment':
          timestamp = order.paymentDate || order.updatedAt || order.createdAt;
          break;
        case 'Shipped':
          timestamp = order.shipment?.shippedAt || order.updatedAt || order.createdAt;
          break;
        case 'Delivered':
          timestamp = order.shipment?.deliveredAt || order.updatedAt || order.createdAt;
          break;
        case 'Completed':
          // Completed is usually the final step, use updatedAt
          timestamp = order.updatedAt || order.createdAt;
          break;
        default:
          timestamp = order.updatedAt || order.createdAt;
      }
    }

    // Determine label for composite
    const label = displayStatus === 'PaymentConfirmedAwaitingShipment'
      ? 'Payment Confirmed / Awaiting Shipment'
      : (statusMap[displayStatus] || displayStatus);
    const note = index === currentIndex ? 'Current status' : undefined;

    // If not completed and no timestamp assigned, use a placeholder predictive slot (keeps consistent layout)
    if (!isCompleted && !timestamp) {
      // Predictive placeholder not stored; we'll show 'Pending...' text later
      timestamp = undefined;
    }
    return {
      status: displayStatus,
      label,
      completed: isCompleted,
      timestamp,
      note,
      icon: getStatusIcon(displayStatus, isCompleted)
    };
  });

  // Inject explicit awaiting payment step for clarity when order still not paid
  const unpaidStatuses = ['Created','created','PaymentPending','pending-payment'];
  const alreadyHas = result.some(s => s.status === 'AwaitingBuyerPayment');
  if (unpaidStatuses.includes(order.status) && !alreadyHas) {
    const createdIdx = result.findIndex(s => s.status === 'Created');
    const awaitingStep = {
      status: 'AwaitingBuyerPayment',
      label: 'Awaiting Buyer Payment',
      completed: false,
      timestamp: undefined as string | undefined,
      note: order.status === 'PaymentPending' ? 'Buyer needs to pay' : 'Awaiting funding',
      icon: getStatusIcon('PaymentPending', false)
    };
    // Insert after Created
    if (createdIdx >= 0) {
      result.splice(createdIdx + 1, 0, awaitingStep);
    } else {
      result.unshift(awaitingStep);
    }
  }
  return result;
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
          let steps: TimelineStep[] = res.timeline.map(event => {
            // Provide fallback timestamp if missing/empty
            const rawAt = event.at && event.at.trim() !== '' ? event.at : undefined;
            const fallback = order.updatedAt || order.createdAt || new Date().toISOString();
            return {
              status: event.status as OrderStatus,
              label: event.status.split('-').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' '),
              completed: true,
              timestamp: rawAt || fallback,
              note: event.note,
              icon: getStatusIcon(event.status as OrderStatus, true)
            };
          });
          // If API timeline does not include an explicit awaiting payment and order is unpaid, inject it (uncompleted)
            const unpaidStatuses = ['Created','created','PaymentPending','pending-payment'];
            if (unpaidStatuses.includes(order.status) && !steps.some(s => s.status === 'AwaitingBuyerPayment')) {
              const createdIdx = steps.findIndex(s => /created/i.test(s.status));
              const awaitingStep = {
                status: 'AwaitingBuyerPayment',
                label: 'Awaiting Buyer Payment',
                completed: false,
                timestamp: undefined as string | undefined,
                note: order.status === 'PaymentPending' ? 'Buyer needs to pay' : 'Awaiting funding',
                icon: getStatusIcon('PaymentPending', false)
              };
              if (createdIdx >= 0) {
                steps.splice(createdIdx + 1, 0, awaitingStep);
              } else {
                steps.unshift(awaitingStep);
              }
              // Mark subsequent steps as not completed until payment
              steps = steps.map((s, idx) => {
                if (s.status === 'AwaitingBuyerPayment') return s;
                if (idx > steps.findIndex(st => st.status === 'AwaitingBuyerPayment')) {
                  return { ...s, completed: false, note: undefined };
                }
                return s;
              });
            }
          setTimeline(steps);
          if (import.meta.env.DEV) {
            console.log('Timeline loaded from API:', steps);
          }
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn('Failed to load timeline from API, using fallback:', error);
        }
        // Fallback to default timeline
        if (!ignore) {
          const fallbackTimeline = defaultTimeline(order);
          if (import.meta.env.DEV) {
            console.log('Using fallback timeline:', fallbackTimeline);
          }
          setTimeline(fallbackTimeline);
        }
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
      
      <Stepper orientation="vertical" activeStep={-1}>
        {timeline.map((step) => (
          <Step key={step.status} completed={step.completed} expanded={true}>
            <StepLabel 
              icon={step.icon}
              optional={
                <>
                  {step.note && (
                    <Chip label={step.note} size="small" color="primary" variant="outlined" sx={{ mt: 0.5 }} />
                  )}
                </>
              }
            >
              <Box>
                <Typography variant="subtitle2">{step.label}</Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                  {step.timestamp
                    ? `📅 ${new Date(step.timestamp).toLocaleDateString()} ⏰ ${new Date(step.timestamp).toLocaleTimeString()}`
                    : (step.completed 
                        ? '📅 Time information unavailable'
                        : '⏳ Pending...')}
                </Typography>
              </Box>
            </StepLabel>
            <StepContent>
              <Stack gap={0.5}>
                {step.note && step.note !== 'Current status'}
              </Stack>
            </StepContent>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};

export default OrderStatusTimeline;
