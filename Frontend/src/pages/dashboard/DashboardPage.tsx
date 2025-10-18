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
  Divider,
  Skeleton,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  ShoppingCart as OrderIcon,
  TrendingUp as TrendingIcon,
  Receipt as ReceiptIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
  ShoppingCart as ShoppingCartIcon,
  Storefront as StorefrontIcon,
  Add as AddIcon,
  Payment as PaymentIcon,
  AccessTime as TimeIcon,
  MonetizationOn as MoneyIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ordersService } from '../../services/ordersService';
import { normalizeImageUrl, placeholderDataUri } from '../../utils/image';
// Wallet summary removed from dashboard view
// walletService import removed; dashboard focuses on orders
import type { Order } from '../../types/order';

// Local image normalization removed; using centralized util

// Enhanced Dashboard State Types
interface DashboardStats {
  // Combined stats
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  pendingOrders: number;
  todayOrders: number;
  
  // Buying stats
  totalSpent: number;
  avgPurchaseValue: number;
  buyingOrders: number;
  
  // Selling stats  
  totalSales: number;
  avgSaleValue: number;
  sellingOrders: number;
  monthlyRevenue: number;
  weeklyRevenue: number;
}

interface UnifiedOrder extends Order {
  orderType: 'buying' | 'selling';
  partnerName?: string; // buyer name for selling orders, seller name for buying orders
}

interface DashboardData {
  stats: DashboardStats;
  recentOrders: UnifiedOrder[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  // refreshing state removed as BalanceCard not rendered here
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    stats: {
      totalOrders: 0,
      activeOrders: 0,
      completedOrders: 0,
      pendingOrders: 0,
      todayOrders: 0,
      totalSpent: 0,
      avgPurchaseValue: 0,
      buyingOrders: 0,
      totalSales: 0,
      avgSaleValue: 0,
      sellingOrders: 0,
      monthlyRevenue: 0,
      weeklyRevenue: 0,
    },
    recentOrders: [],
    loading: true,
    error: null,
    lastUpdated: null,
  });

  // Redirect admin users to admin dashboard
  useEffect(() => {
    if (user?.roles?.some(role => role.toLowerCase() === 'admin')) {
      navigate('/admin', { replace: true });
      return;
    }
    // Redirect seller users to marketplace as their first page
    if (user?.roles?.some(role => role.toLowerCase() === 'seller')) {
      navigate('/seller/marketplace', { replace: true });
      return;
    }
  }, [user, navigate]);

  // Load dashboard data
  const loadDashboardData = async () => {
    setDashboardData(prev => ({ ...prev, loading: true, error: null }));

    try {
  // Wallet summary loading moved elsewhere; focus on orders here

      // Load unified orders (both buyer and seller) using the same method as OrderListPage
      const allOrdersData = await ordersService.getAllUserOrders({ 
        page: 1, 
        pageSize: 20 // Get more to have a good mix for dashboard
      }).catch(err => {
        console.error('Failed to load orders:', err);
        return { items: [] };
      });

      // Use the unified orders data (primary source)
      const allOrders = allOrdersData?.items || [];
  
      // Create unified orders array with type information from all orders
      const unifiedOrders: UnifiedOrder[] = allOrders.map((order: any) => {
        // Determine if this is a buying or selling order based on user ID
        const isBuyingOrder = order.buyerId === user?.id;
        
        return {
          ...order,
          orderType: isBuyingOrder ? 'buying' as const : 'selling' as const,
          partnerName: isBuyingOrder 
            ? (order.sellerName || 'Unknown Seller') 
            : (order.buyerName || 'Unknown Buyer')
        };
      });

      // Sort by creation date (most recent first)
      unifiedOrders.sort((a, b) => 
        new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
      );

      // Calculate unified stats from both buying and selling orders
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

      // Helper to get amount from order
      const getOrderAmount = (order: any) => order.amount || 0;

      // Separate buying and selling orders
      const buyingOrders = unifiedOrders.filter(o => o.orderType === 'buying');
      const sellingOrders = unifiedOrders.filter(o => o.orderType === 'selling');

      // Calculate comprehensive stats
      const stats: DashboardStats = {
        // Combined stats
        totalOrders: unifiedOrders.length,
        activeOrders: unifiedOrders.filter(o => 
          ['Pending', 'PendingPayment', 'Paid', 'Shipped', 'Processing', 'PaymentPending', 'PaymentConfirmed', 'AwaitingShipment'].includes(o.status)
        ).length,
        completedOrders: unifiedOrders.filter(o => 
          ['Delivered', 'Completed'].includes(o.status)
        ).length,
        pendingOrders: unifiedOrders.filter(o => 
          ['Pending', 'PendingPayment', 'PaymentPending'].includes(o.status)
        ).length,
        todayOrders: unifiedOrders.filter(o => {
          const orderDate = new Date(o.createdAt || '');
          return orderDate >= todayStart;
        }).length,

        // Buying stats
        totalSpent: buyingOrders.reduce((sum, o) => sum + getOrderAmount(o), 0),
        avgPurchaseValue: buyingOrders.length > 0 ? 
          buyingOrders.reduce((sum, o) => sum + getOrderAmount(o), 0) / buyingOrders.length : 0,
        buyingOrders: buyingOrders.length,

        // Selling stats
        totalSales: sellingOrders.reduce((sum, o) => sum + getOrderAmount(o), 0),
        avgSaleValue: sellingOrders.length > 0 ? 
          sellingOrders.reduce((sum, o) => sum + getOrderAmount(o), 0) / sellingOrders.length : 0,
        sellingOrders: sellingOrders.length,
        monthlyRevenue: sellingOrders.filter(o => {
          const orderDate = new Date(o.createdAt || '');
          return orderDate >= monthAgo && ['Delivered', 'Completed'].includes(o.status);
        }).reduce((sum, o) => sum + getOrderAmount(o), 0),
        weeklyRevenue: sellingOrders.filter(o => {
          const orderDate = new Date(o.createdAt || '');
          return orderDate >= weekAgo && ['Delivered', 'Completed'].includes(o.status);
        }).reduce((sum, o) => sum + getOrderAmount(o), 0),
      };

      setDashboardData({
        stats,
        recentOrders: unifiedOrders.slice(0, 8), // Show latest 8 unified orders
        loading: false,
        error: null,
        lastUpdated: new Date(),
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setDashboardData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load dashboard data',
      }));
    }
  };

  // Initial data load
  useEffect(() => {
    loadDashboardData();
  }, [user?.id]); // Load when user changes, regardless of roles

  // Wallet summary handling removed from this view (BalanceCard commented out)

  const handleRefreshDashboard = () => {
    loadDashboardData();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return 'success';
      case 'shipped': return 'info';
      case 'processing': return 'warning';
      case 'pending': return 'default';
      default: return 'default';
    }
  };



  return (
    <Container maxWidth="lg">
      {/* Enhanced Quick Actions */}
      {/* <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Quick Actions
          </Typography>
        </Box>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(6, 1fr)' }, gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/orders/new')}
            size="large"
            sx={{ py: 2 }}
          >
            New Order
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<OrderIcon />}
            onClick={() => navigate('/orders')}
            size="large"
            sx={{ py: 2 }}
            color={dashboardData.stats.totalOrders > 0 ? 'info' : 'inherit'}
          >
            My Orders
            {dashboardData.stats.totalOrders > 0 && (
              <Chip 
                label={dashboardData.stats.totalOrders} 
                size="small" 
                color="info" 
                sx={{ ml: 1 }} 
              />
            )}
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<ShoppingCartIcon />}
            onClick={() => navigate('/orders')}
            size="large"
            sx={{ py: 2 }}
            color={dashboardData.stats.buyingOrders > 0 ? 'info' : 'inherit'}
          >
            Buying
            {dashboardData.stats.buyingOrders > 0 && (
              <Chip 
                label={dashboardData.stats.buyingOrders} 
                size="small" 
                color="info" 
                sx={{ ml: 1 }} 
              />
            )}
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<StorefrontIcon />}
            onClick={() => navigate('/seller/orders')}
            size="large"
            sx={{ py: 2 }}
            color={dashboardData.stats.sellingOrders > 0 ? 'success' : 'inherit'}
          >
            Selling
            {dashboardData.stats.sellingOrders > 0 && (
              <Chip 
                label={dashboardData.stats.sellingOrders} 
                size="small" 
                color="success" 
                sx={{ ml: 1 }} 
              />
            )}
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<PaymentIcon />}
            onClick={() => navigate('/wallet')}
            size="large"
            sx={{ py: 2 }}
            color={summary && summary.balance > 1000 ? 'success' : 'inherit'}
          >
            Wallet
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefreshDashboard}
            size="large"
            sx={{ py: 2 }}
            disabled={dashboardData.loading}
          >
            Refresh
          </Button>
        </Box>
      </Paper> */}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Error Alert */}
        {dashboardData.error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={handleRefreshDashboard}
                startIcon={<RefreshIcon />}
              >
                Retry
              </Button>
            }
          >
            {dashboardData.error}
          </Alert>
        )}

        {/* Loading Progress */}
        {dashboardData.loading && <LinearProgress sx={{ mb: 3 }} />}

        {/* Last Updated */}
        {dashboardData.lastUpdated && (
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
            Last updated: {dashboardData.lastUpdated.toLocaleTimeString()}
          </Typography>
        )}

        {/* Unified Statistics Cards */}
        <Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <OrderIcon color="primary" />
                  <Box>
                    <Typography variant="h6" component="div">
                      {dashboardData.loading ? (
                        <Skeleton width={40} />
                      ) : (
                        dashboardData.stats.totalOrders
                      )}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Orders
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ShoppingCartIcon color="info" />
                  <Box>
                    <Typography variant="h6" component="div">
                      {dashboardData.loading ? (
                        <Skeleton width={40} />
                      ) : (
                        dashboardData.stats.buyingOrders
                      )}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Buying Orders
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StorefrontIcon color="success" />
                  <Box>
                    <Typography variant="h6" component="div">
                      {dashboardData.loading ? (
                        <Skeleton width={40} />
                      ) : (
                        dashboardData.stats.sellingOrders
                      )}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Selling Orders
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleIcon color="primary" />
                  <Box>
                    <Typography variant="h6" component="div">
                      {dashboardData.loading ? (
                        <Skeleton width={40} />
                      ) : (
                        dashboardData.stats.completedOrders
                      )}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Completed
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
          
          {/* Financial Stats Row */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ReceiptIcon color="success" />
                  <Box>
                    <Typography variant="h6" component="div">
                      {dashboardData.loading ? (
                        <Skeleton width={60} />
                      ) : (
                        `PKR ${dashboardData.stats.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      )}
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
                  <PaymentIcon color="primary" />
                  <Box>
                    <Typography variant="h6" component="div">
                      {dashboardData.loading ? (
                        <Skeleton width={60} />
                      ) : (
                        `PKR ${dashboardData.stats.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      )}
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
                      {dashboardData.loading ? (
                        <Skeleton width={60} />
                      ) : (
                        `PKR ${dashboardData.stats.monthlyRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      )}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Monthly Revenue
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingIcon color="warning" />
                  <Box>
                    <Typography variant="h6" component="div">
                      {dashboardData.loading ? (
                        <Skeleton width={60} />
                      ) : (
                        `PKR ${dashboardData.stats.avgPurchaseValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      )}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg Order
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Additional Enhanced Stats Row */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
            <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" component="div">
                      {dashboardData.loading ? (
                        <Skeleton width={60} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
                      ) : (
                        dashboardData.stats.todayOrders
                      )}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      Today's Orders
                    </Typography>
                  </Box>
                  <TimeIcon sx={{ fontSize: 40, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
            
            <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h5" component="div">
                      {dashboardData.loading ? (
                        <Skeleton width={80} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
                      ) : (
                        `PKR ${dashboardData.stats.weeklyRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                      )}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      This Week
                    </Typography>
                  </Box>
                  <TrendingIcon sx={{ fontSize: 40, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ bgcolor: 'info.main', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h6" component="div">
                      {dashboardData.loading ? (
                        <Skeleton width={60} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
                      ) : (
                        `${((dashboardData.stats.completedOrders / Math.max(dashboardData.stats.activeOrders + dashboardData.stats.completedOrders, 1)) * 100).toFixed(1)}%`
                      )}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      Success Rate
                    </Typography>
                  </Box>
                  <CheckCircleIcon sx={{ fontSize: 40, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>

            <Card 
              sx={{ 
                bgcolor: 'error.main', 
                color: 'white',
                cursor: dashboardData.stats.pendingOrders > 0 ? 'pointer' : 'default',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': dashboardData.stats.pendingOrders > 0 ? {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                } : {}
              }}
              onClick={() => {
                if (dashboardData.stats.pendingOrders > 0) {
                  navigate('/orders');
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h6" component="div">
                      {dashboardData.loading ? (
                        <Skeleton width={60} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
                      ) : (
                        dashboardData.stats.pendingOrders
                      )}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      Pending Actions
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <CheckCircleIcon sx={{ fontSize: 40, opacity: 0.3 }} />
                    {dashboardData.stats.pendingOrders > 0 && (
                      <ArrowForwardIcon sx={{ fontSize: 20, opacity: 0.6, mt: 0.5 }} />
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Recent Orders and Wallet */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
            {/* Recent Activity (Unified Buying & Selling) */}
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Recent Activity
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton 
                    onClick={handleRefreshDashboard}
                    disabled={dashboardData.loading}
                    size="small"
                  >
                    <RefreshIcon />
                  </IconButton>
                  <Button 
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => navigate('/orders')}
                  >
                    View All
                  </Button>
                </Box>
              </Box>
              
              {dashboardData.loading ? (
                // Loading skeletons
                <List>
                  {[1, 2, 3].map((i) => (
                    <ListItem key={i} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Skeleton variant="circular" width={24} height={24} />
                      </ListItemIcon>
                      <ListItemText
                        primary={<Skeleton width="60%" />}
                        secondary={<Skeleton width="80%" />}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : dashboardData.recentOrders.length === 0 ? (
                // Empty state
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <OrderIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No activity yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Start buying or selling to see your activity here
                  </Typography>
                  <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/orders/new')}
                  >
                    Create Order
                  </Button>
                </Box>
              ) : (
                // Unified Orders list
                <List>
                  {dashboardData.recentOrders.map((order, index) => (
                    <React.Fragment key={order.id}>
                      <ListItem
                        sx={{ px: 0 }}
                        secondaryAction={
                          <IconButton 
                            onClick={() => navigate(`/orders/${order.id}`)}
                            edge="end"
                          >
                            <ArrowForwardIcon />
                          </IconButton>
                        }
                      >
                        <ListItemIcon>
                          {/* If the order has images, show the first as a thumbnail, otherwise show an icon */}
                          {order.imageUrls && order.imageUrls.length > 0 ? (
                            <Box component="img"
                              src={normalizeImageUrl(order.imageUrls[0])}
                              onError={(e: any) => { e.currentTarget.src = placeholderDataUri(48); console.warn('Dashboard order image failed to load:', order.imageUrls?.[0]); }}
                              sx={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 1 }}
                              alt="order"
                            />
                          ) : (
                            order.orderType === 'selling' ? (
                              <StorefrontIcon color="success" />
                            ) : (
                              <ShoppingCartIcon color="info" />
                            )
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography variant="subtitle1" noWrap>
                                {order.description || `Order ${order.code || order.id?.slice(0, 8) || 'N/A'}`}
                              </Typography>
                              <Chip 
                                label={order.orderType === 'selling' ? 'Selling' : 'Buying'} 
                                size="small" 
                                color={order.orderType === 'selling' ? 'success' : 'info'}
                                variant="outlined"
                              />
                              <Chip 
                                label={order.status} 
                                size="small" 
                                color={getStatusColor(order.status) as any}
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary" component="div">
                                {order.orderType === 'selling' 
                                  ? `Buyer: ${order.partnerName || 'Unknown'}` 
                                  : `Seller: ${order.partnerName || 'Unknown'}`
                                }
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <MoneyIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                <Typography variant="body2" color="text.secondary">
                                  PKR {order.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  •
                                </Typography>
                                <TimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  {new Date(order.createdAt).toLocaleDateString()}
                                </Typography>
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < dashboardData.recentOrders.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Paper>

            {/* Wallet Summary */}
            {/* <Box>
              <BalanceCard 
                summary={summary} 
                onRefresh={handleRefreshBalance}
                refreshing={refreshing}
              />
            </Box> */}
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default DashboardPage;