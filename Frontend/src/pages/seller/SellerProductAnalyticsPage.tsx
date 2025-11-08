import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  // Alert removed — using TopRightToast instead
  CircularProgress,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Divider,
  Stack,
  useTheme
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
  ShoppingCart as ShoppingCartIcon,
  Favorite as FavoriteIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import analyticsService from '../../services/analyticsService';
import type { ProductViewStats } from '../../types/analytics';
import { useAuth } from '../../context/AuthContext';
import { usePageViewTracking } from '../../hooks/usePageViewTracking';
import TopRightToast from '../../components/TopRightToast';

const SellerProductAnalyticsPage: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [productViews, setProductViews] = useState<ProductViewStats[]>([]);
  const [sellerUniqueVisitors, setSellerUniqueVisitors] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track page view for seller analytics
  usePageViewTracking({
    pageType: 'Seller',
    sellerId: user?.id
  });

  const loadProductAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await analyticsService.getSellerProductViews();
      setProductViews(data);
      // fetch seller-level unique visitors (deduped across products)
      try {
        const summary = await analyticsService.getSellerSummary();
        setSellerUniqueVisitors(summary?.totalUniqueVisitors ?? null);
      } catch (err) {
        console.debug('Failed to load seller summary:', err);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProductAnalytics();
  }, []);

  useEffect(() => {
    console.log('Product Views State:', productViews);
  }, [productViews]); // Log whenever productViews state updates

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Loading analytics...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            Product Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 4 }}>
            Track your product views and engagement metrics
          </Typography>
          {/* Show top-right toast for the error */}
          <TopRightToast open={Boolean(error)} message={error || ''} severity="error" onClose={() => setError(null)} />
        </Box>
      </Container>
    );
  }

  // Defensive: ensure productViews is an array
  const safeProductViews = Array.isArray(productViews) ? productViews : [];

  // Calculate total stats
  const totalViews = safeProductViews.reduce((sum, p) => sum + (p.totalViews || 0), 0);
  // total unique visitors deduped across products (prefer server-provided summary)
  const totalUniqueVisitors = sellerUniqueVisitors !== null
    ? sellerUniqueVisitors
    : safeProductViews.reduce((sum, p) => sum + (p.uniqueVisitors || 0), 0);
  const weekViews = safeProductViews.reduce((sum, p) => sum + (p.weekViews || 0), 0);
  const monthViews = safeProductViews.reduce((sum, p) => sum + (p.monthViews || 0), 0);
  const totalInCarts = safeProductViews.reduce((sum, p) => sum + (p.inCartCount || 0), 0);
  const totalFavorites = safeProductViews.reduce((sum, p) => sum + (p.favoritesCount || 0), 0);

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
          Product Analytics
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 4 }}>
          Track your product views and engagement metrics
        </Typography>

  {/* Overview Stats */}
  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(6, 1fr)' }, gap: 3, mb: 4 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <VisibilityIcon color="primary" />
                <Typography variant="body2" color="text.secondary">
                  Total Views
                </Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {totalViews.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                All time
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <ShoppingCartIcon color="warning" />
                <Typography variant="body2" color="text.secondary">
                  In Carts
                </Typography>
              </Box>
              <Typography variant="h4" color="warning.main">
                {totalInCarts.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Active carts containing your products
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <FavoriteIcon color="error" />
                <Typography variant="body2" color="text.secondary">
                  Favorites
                </Typography>
              </Box>
              <Typography variant="h4" color="error">
                {totalFavorites.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Times products were favorited (heart)
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <PeopleIcon color="secondary" />
                <Typography variant="body2" color="text.secondary">
                  Unique Visitors
                </Typography>
              </Box>
              <Typography variant="h4" color="secondary">
                {totalUniqueVisitors.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                All time
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TrendingUpIcon color="success" />
                <Typography variant="body2" color="text.secondary">
                  This Week
                </Typography>
              </Box>
              <Typography variant="h4" color="success.main">
                {weekViews.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Last 7 days
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CalendarIcon color="info" />
                <Typography variant="body2" color="text.secondary">
                  This Month
                </Typography>
              </Box>
              <Typography variant="h4" color="info.main">
                {monthViews.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Last 30 days
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Products Table */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Product Performance Summary
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Product Name</strong></TableCell>
                        <TableCell align="right"><strong>Total Views</strong></TableCell>
                        <TableCell align="right"><strong>Unique Visitors</strong></TableCell>
                        <TableCell align="right"><strong>Today</strong></TableCell>
                        <TableCell align="right"><strong>Total Views</strong></TableCell>
                        <TableCell align="right"><strong>This Month</strong></TableCell>
                        <TableCell align="right"><strong>In Carts</strong></TableCell>
                        <TableCell align="right"><strong>Favorites</strong></TableCell>
                        <TableCell align="right"><strong>Avg Views/Visitor</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {safeProductViews.length === 0 ? (
                    <TableRow>
                          <TableCell colSpan={9} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                          No product views data available yet
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    safeProductViews
                      .slice() // avoid mutating state
                      .sort((a, b) => (b.totalViews || 0) - (a.totalViews || 0))
                      .map((product) => (
                        <TableRow key={product.productId} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {product.productName}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={product.totalViews.toLocaleString()}
                              color="primary"
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="right">
                            {product.uniqueVisitors.toLocaleString()}
                          </TableCell>
                          <TableCell align="right">
                            {product.todayViews.toLocaleString()}
                          </TableCell>
                          <TableCell align="right">
                            {product.weekViews.toLocaleString()}
                          </TableCell>
                          <TableCell align="right">
                            {product.monthViews.toLocaleString()}
                          </TableCell>
                          <TableCell align="right">
                            {(product.inCartCount || 0).toLocaleString()}
                          </TableCell>
                          <TableCell align="right">
                            {(product.favoritesCount || 0).toLocaleString()}
                          </TableCell>
                          <TableCell align="right">
                            {product.uniqueVisitors > 0
                              ? (product.totalViews / product.uniqueVisitors).toFixed(2)
                              : '0'}
                          </TableCell>
                        </TableRow>
                      )))
                  }
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Individual Product Charts */}
        {productViews.length > 0 && (
          <>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              Product View Trends (Last 30 Days)
            </Typography>
            
            <Stack spacing={4}>
              {safeProductViews
                .filter(product => (product.monthViews || 0) > 0)
                .slice()
                .sort((a, b) => (b.monthViews || 0) - (a.monthViews || 0))
                .map((product) => (
                  <Card key={product.productId}>
                    <CardContent>
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                          {product.productName}
                        </Typography>
                        
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 2, mt: 1 }}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Total Views
                            </Typography>
                            <Typography variant="h6" color="primary">
                              {product.totalViews.toLocaleString()}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Unique Visitors
                            </Typography>
                            <Typography variant="h6" color="secondary">
                              {product.uniqueVisitors.toLocaleString()}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              In Carts
                            </Typography>
                            <Typography variant="h6" color="warning.main">
                              {(product.inCartCount || 0).toLocaleString()}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Favorites
                            </Typography>
                            <Typography variant="h6" color="error">
                              {(product.favoritesCount || 0).toLocaleString()}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Last 7 Days
                            </Typography>
                            <Typography variant="h6" color="success.main">
                              {product.weekViews.toLocaleString()}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Last 30 Days
                            </Typography>
                            <Typography variant="h6" color="info.main">
                              {product.monthViews.toLocaleString()}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      {/* Chart */}
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Daily Views & Unique Visitors
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart
                            data={product.dailyViews || []}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient id={`colorViews-${product.productId}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8} />
                                <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id={`colorVisitors-${product.productId}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={theme.palette.secondary.main} stopOpacity={0.8} />
                                <stop offset="95%" stopColor={theme.palette.secondary.main} stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="date"
                              tickFormatter={(date) => {
                                const d = new Date(date);
                                return `${d.getMonth() + 1}/${d.getDate()}`;
                              }}
                            />
                            <YAxis />
                            <Tooltip
                              labelFormatter={(date) => {
                                const d = new Date(date);
                                return d.toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric',
                                  year: 'numeric'
                                });
                              }}
                              contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                border: '1px solid #ccc',
                                borderRadius: '8px'
                              }}
                            />
                            <Legend />
                            <Area
                              type="monotone"
                              dataKey="views"
                              stroke={theme.palette.primary.main}
                              fillOpacity={1}
                              fill={`url(#colorViews-${product.productId})`}
                              name="Views"
                            />
                            <Area
                              type="monotone"
                              dataKey="uniqueVisitors"
                              stroke={theme.palette.secondary.main}
                              fillOpacity={1}
                              fill={`url(#colorVisitors-${product.productId})`}
                              name="Unique Visitors"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </Box>

                      {/* Line Chart Alternative */}
                      <Box sx={{ mt: 4 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          View Trends Comparison
                        </Typography>
                        <ResponsiveContainer width="100%" height={250}>
                          <LineChart
                            data={product.dailyViews || []}
                            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="date"
                              tickFormatter={(date) => {
                                const d = new Date(date);
                                return `${d.getMonth() + 1}/${d.getDate()}`;
                              }}
                            />
                            <YAxis />
                            <Tooltip
                              labelFormatter={(date) => {
                                const d = new Date(date);
                                return d.toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric',
                                  year: 'numeric'
                                });
                              }}
                            />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="views"
                              stroke={theme.palette.primary.main}
                              strokeWidth={2}
                              dot={{ fill: theme.palette.primary.main }}
                              name="Total Views"
                            />
                            <Line
                              type="monotone"
                              dataKey="uniqueVisitors"
                              stroke={theme.palette.secondary.main}
                              strokeWidth={2}
                              dot={{ fill: theme.palette.secondary.main }}
                              name="Unique Visitors"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
            </Stack>
          </>
        )}

        {productViews.length === 0 && (
          <Card>
            <CardContent>
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <VisibilityIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Product Views Yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Your product analytics will appear here once customers start viewing your products
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    </Container>
  );
};

export default SellerProductAnalyticsPage;
