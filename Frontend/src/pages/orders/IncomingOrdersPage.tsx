// src/pages/orders/IncomingOrdersPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Stack,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Badge,
  Snackbar
} from '@mui/material';
import { Inbox, Schedule, CheckCircle, Cancel } from '@mui/icons-material';
import ordersService from '../../services/ordersService';
import notificationService from '../../services/notificationService';
import IncomingOrderCard from '../../components/orders/IncomingOrderCard';
import type { Order } from '../../types/order';

type OrderFilterType = 'all' | 'pending' | 'awaiting-action' | 'accepted' | 'rejected';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

const IncomingOrdersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ 
    open: false, 
    message: '', 
    severity: 'success' 
  });

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      // In a real app, this would fetch orders for the current seller
      const sellerOrders = await ordersService.getSellerOrders();
      setOrders(sellerOrders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveOrder = async (orderId: string) => {
    try {
      await ordersService.approveOrder(orderId);
      
      // Send notification (mock for now)
      const order = orders.find(o => o.id === orderId);
      if (order) {
        await notificationService.sendNotification({
          recipientId: order.buyerId,
          type: 'order_approved',
          title: 'Order Approved! ✅',
          message: `Your order for ${order.currency} ${order.amount.toLocaleString()} has been approved by the seller.`,
          data: { orderId: order.id, amount: order.amount, currency: order.currency }
        });
      }

      setSnack({ 
        open: true, 
        message: 'Order approved successfully! The buyer has been notified.', 
        severity: 'success' 
      });
      
      // Reload orders to reflect changes
      await loadOrders();
    } catch (err) {
      setSnack({ 
        open: true, 
        message: err instanceof Error ? err.message : 'Failed to approve order', 
        severity: 'error' 
      });
    }
  };

  const handleRejectOrder = async (orderId: string, reason: string) => {
    try {
      await ordersService.rejectOrder(orderId, reason);
      
      // Send notification (mock for now)
      const order = orders.find(o => o.id === orderId);
      if (order) {
        await notificationService.sendNotification({
          recipientId: order.buyerId,
          type: 'order_rejected',
          title: 'Order Rejected ❌',
          message: `Your order for ${order.currency} ${order.amount.toLocaleString()} has been rejected. Reason: ${reason}`,
          data: { orderId: order.id, amount: order.amount, currency: order.currency, reason }
        });
      }

      setSnack({ 
        open: true, 
        message: 'Order rejected. The buyer has been notified and funds will be refunded.', 
        severity: 'success' 
      });
      
      // Reload orders to reflect changes
      await loadOrders();
    } catch (err) {
      setSnack({ 
        open: true, 
        message: err instanceof Error ? err.message : 'Failed to reject order', 
        severity: 'error' 
      });
    }
  };

  const filterOrders = (filter: OrderFilterType): Order[] => {
    switch (filter) {
      case 'pending':
        return orders.filter(o => ['pending-payment'].includes(o.status));
      case 'awaiting-action':
        return orders.filter(o => ['payment-confirmed'].includes(o.status));
      case 'accepted':
        return orders.filter(o => ['awaiting-shipment', 'shipped', 'delivered', 'completed'].includes(o.status));
      case 'rejected':
        return orders.filter(o => ['rejected', 'cancelled'].includes(o.status));
      default:
        return orders;
    }
  };

  const getTabCounts = () => {
    return {
      all: orders.length,
      pending: filterOrders('pending').length,
      awaitingAction: filterOrders('awaiting-action').length,
      accepted: filterOrders('accepted').length,
      rejected: filterOrders('rejected').length
    };
  };

  const tabCounts = getTabCounts();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Incoming Orders</Typography>
      </Stack>

      <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
        <Tab 
          icon={<Badge badgeContent={tabCounts.all} color="primary"><Inbox /></Badge>} 
          label="All Orders" 
        />
        <Tab 
          icon={<Badge badgeContent={tabCounts.pending} color="warning"><Schedule /></Badge>} 
          label="Pending Payment" 
        />
        <Tab 
          icon={<Badge badgeContent={tabCounts.awaitingAction} color="error"><Schedule /></Badge>} 
          label="Awaiting Action" 
        />
        <Tab 
          icon={<Badge badgeContent={tabCounts.accepted} color="success"><CheckCircle /></Badge>} 
          label="Accepted" 
        />
        <Tab 
          icon={<Badge badgeContent={tabCounts.rejected} color="error"><Cancel /></Badge>} 
          label="Rejected" 
        />
      </Tabs>

      <TabPanel value={activeTab} index={0}>
        {filterOrders('all').length === 0 ? (
          <Alert severity="info">No orders found.</Alert>
        ) : (
          <Stack spacing={2}>
            {filterOrders('all').map(order => (
              <IncomingOrderCard
                key={order.id}
                order={order}
                onApprove={handleApproveOrder}
                onReject={handleRejectOrder}
              />
            ))}
          </Stack>
        )}
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        {filterOrders('pending').length === 0 ? (
          <Alert severity="info">No orders pending payment.</Alert>
        ) : (
          <Stack spacing={2}>
            {filterOrders('pending').map(order => (
              <IncomingOrderCard
                key={order.id}
                order={order}
                onApprove={handleApproveOrder}
                onReject={handleRejectOrder}
              />
            ))}
          </Stack>
        )}
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        {filterOrders('awaiting-action').length === 0 ? (
          <Alert severity="info">No orders awaiting your action.</Alert>
        ) : (
          <Stack spacing={2}>
            {filterOrders('awaiting-action').map(order => (
              <IncomingOrderCard
                key={order.id}
                order={order}
                onApprove={handleApproveOrder}
                onReject={handleRejectOrder}
              />
            ))}
          </Stack>
        )}
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        {filterOrders('accepted').length === 0 ? (
          <Alert severity="info">No accepted orders.</Alert>
        ) : (
          <Stack spacing={2}>
            {filterOrders('accepted').map(order => (
              <IncomingOrderCard
                key={order.id}
                order={order}
                onApprove={handleApproveOrder}
                onReject={handleRejectOrder}
                disabled={true}
              />
            ))}
          </Stack>
        )}
      </TabPanel>

      <TabPanel value={activeTab} index={4}>
        {filterOrders('rejected').length === 0 ? (
          <Alert severity="info">No rejected orders.</Alert>
        ) : (
          <Stack spacing={2}>
            {filterOrders('rejected').map(order => (
              <IncomingOrderCard
                key={order.id}
                order={order}
                onApprove={handleApproveOrder}
                onReject={handleRejectOrder}
                disabled={true}
              />
            ))}
          </Stack>
        )}
      </TabPanel>

      <Snackbar 
        open={snack.open} 
        autoHideDuration={6000} 
        onClose={() => setSnack(s => ({ ...s, open: false }))}
      >
        <Alert onClose={() => setSnack(s => ({ ...s, open: false }))} severity={snack.severity}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default IncomingOrdersPage;