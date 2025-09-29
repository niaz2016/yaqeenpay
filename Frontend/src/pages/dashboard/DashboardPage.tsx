// src/pages/dashboard/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Card, 
  CardContent, 
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Divider
} from '@mui/material';
import {
  ShoppingCart as OrderIcon,
  TrendingUp as TrendingIcon,
  Receipt as ReceiptIcon,
  ArrowForward as ArrowForwardIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Store as StoreIcon,
  Assessment as AnalyticsIcon,
  AccountBalance as WithdrawIcon,
  Inventory as InventoryIcon,
  Add as AddIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import walletService from '../../services/walletService';
import BalanceCard from '../../components/wallet/BalanceCard';
import type { WalletSummary } from '../../types/wallet';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<WalletSummary | null>(null);

  // Redirect admin users to admin dashboard
  useEffect(() => {
    if (user?.roles?.some(role => role.toLowerCase() === 'admin')) {
      navigate('/admin', { replace: true });
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    walletService.getSummary().then(setSummary).catch(() => setSummary(null));
  }, []);

  const isSeller = user?.roles?.some(role => role.toLowerCase() === 'seller');

  // const dashboardTitle = isSeller ? 'Seller Dashboard' : 'Buyer Dashboard';

  // Mock data for demo - replace with real API calls
  const buyerStats = {
    activeOrders: 3,
    completedOrders: 12,
    totalSpent: 2450.00,
    avgOrderValue: 204.17
  };

  const sellerStats = {
    activeListings: 24,
    totalSales: 18500.00,
    pendingOrders: 5,
    monthlyRevenue: 3200.00
  };

  const recentOrders = [
    {
      id: '1',
      title: 'Electronics Purchase',
      seller: 'TechStore Inc.',
      amount: 299.99,
      status: 'Shipped',
      date: '2024-03-10'
    },
    {
      id: '2', 
      title: 'Home Goods',
      seller: 'HomeDecor Ltd.',
      amount: 156.50,
      status: 'Processing',
      date: '2024-03-08'
    },
    {
      id: '3',
      title: 'Books & Media',
      seller: 'BookWorld',
      amount: 89.99,
      status: 'Delivered',
      date: '2024-03-05'
    }
  ];

  const recentSales = [
    {
      id: '1',
      title: 'Wireless Headphones',
      buyer: 'John Doe',
      amount: 159.99,
      status: 'Shipped',
      date: '2024-03-10'
    },
    {
      id: '2',
      title: 'Smartphone Case',
      buyer: 'Jane Smith',
      amount: 29.99,
      status: 'Processing',
      date: '2024-03-09'
    },
    {
      id: '3',
      title: 'Laptop Stand',
      buyer: 'Mike Johnson',
      amount: 45.00,
      status: 'Delivered',
      date: '2024-03-07'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return 'success';
      case 'shipped': return 'info';
      case 'processing': return 'warning';
      case 'pending': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return <CheckCircleIcon />;
      case 'shipped': return <ShippingIcon />;
      case 'processing': return <PendingIcon />;
      default: return <OrderIcon />;
    }
  };

  return (
    <Container maxWidth="lg">
      {/* Welcome Header */}
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* <Typography variant="h4" component="h1" gutterBottom>
          {dashboardTitle}
        </Typography> */}
        <Typography variant="h5" color="text.secondary" gutterBottom>
          Welcome back, {user?.firstName || 'User'}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {isSeller 
            ? 'Manage your products, track sales, and view your earnings.' 
            : 'Manage your orders, track purchases, and view your wallet activity.'
          }
        </Typography>
      </Box>

      {/* Quick Actions */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {isSeller ? (
            <>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/seller/products/new')}
                size="large"
              >
                Add New Product
              </Button>
              <Button
                variant="outlined"
                startIcon={<InventoryIcon />}
                onClick={() => navigate('/seller/products')}
                size="large"
              >
                Manage Products
              </Button>
              <Button
                variant="outlined"
                startIcon={<OrderIcon />}
                onClick={() => navigate('/seller/orders')}
                size="large"
              >
                View Orders
              </Button>
              <Button
                variant="outlined"
                startIcon={<AnalyticsIcon />}
                onClick={() => navigate('/seller/analytics')}
                size="large"
              >
                View Analytics
              </Button>
              <Button
                variant="outlined"
                startIcon={<WithdrawIcon />}
                onClick={() => navigate('/seller/withdrawals')}
                size="large"
              >
                Manage Withdrawals
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/orders/new')}
                size="large"
              >
                Create New Order
              </Button>
              <Button
                variant="outlined"
                startIcon={<OrderIcon />}
                onClick={() => navigate('/orders')}
                size="large"
              >
                View All Orders
              </Button>
              <Button
                variant="outlined"
                startIcon={<PaymentIcon />}
                onClick={() => navigate('/wallet')}
                size="large"
              >
                Manage Wallet
              </Button>
            </>
          )}
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Statistics Cards */}
        <Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
            {isSeller ? (
              <>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <StoreIcon color="primary" />
                      <Box>
                        <Typography variant="h6" component="div">
                          {sellerStats.activeListings}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Active Listings
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PendingIcon color="warning" />
                      <Box>
                        <Typography variant="h6" component="div">
                          {sellerStats.pendingOrders}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Pending Orders
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ReceiptIcon color="success" />
                      <Box>
                        <Typography variant="h6" component="div">
                          ${sellerStats.totalSales.toFixed(2)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Sales
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingIcon color="info" />
                      <Box>
                        <Typography variant="h6" component="div">
                          ${sellerStats.monthlyRevenue.toFixed(2)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Monthly Revenue
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PendingIcon color="warning" />
                      <Box>
                        <Typography variant="h6" component="div">
                          {buyerStats.activeOrders}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Active Orders
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircleIcon color="success" />
                      <Box>
                        <Typography variant="h6" component="div">
                          {buyerStats.completedOrders}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Completed
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ReceiptIcon color="primary" />
                      <Box>
                        <Typography variant="h6" component="div">
                          ${buyerStats.totalSpent.toFixed(2)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Spent
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingIcon color="info" />
                      <Box>
                        <Typography variant="h6" component="div">
                          ${buyerStats.avgOrderValue.toFixed(2)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Avg Order
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </>
            )}
          </Box>

          {/* Recent Orders and Wallet */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
            {/* Recent Orders/Sales */}
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  {isSeller ? 'Recent Sales' : 'Recent Orders'}
                </Typography>
                <Button 
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate(isSeller ? '/seller/orders' : '/orders')}
                >
                  View All
                </Button>
              </Box>
              <List>
                {(isSeller ? recentSales : recentOrders).map((item, index) => (
                  <React.Fragment key={item.id}>
                    <ListItem
                      sx={{ px: 0 }}
                      secondaryAction={
                        <IconButton 
                          onClick={() => {
                            if (item.id && item.id !== 'undefined') {
                              navigate(`/orders/${item.id}`);
                            }
                          }}
                          edge="end"
                        >
                          <ArrowForwardIcon />
                        </IconButton>
                      }
                    >
                      <ListItemIcon>
                        {getStatusIcon(item.status)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1">
                              {item.title}
                            </Typography>
                            <Chip 
                              label={item.status} 
                              size="small" 
                              color={getStatusColor(item.status) as any}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary" component="div">
                              {isSeller ? `Buyer: ${(item as any).buyer}` : `Seller: ${(item as any).seller}`}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" component="div">
                              Amount: ${item.amount} • {item.date}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < (isSeller ? recentSales : recentOrders).length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>

            {/* Wallet Summary */}
            <Box>
              <BalanceCard summary={summary} />
            </Box>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default DashboardPage;