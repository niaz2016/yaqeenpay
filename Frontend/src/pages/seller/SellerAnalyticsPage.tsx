import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import { selectedUserService } from '../../services/userServiceSelector';
import analyticsService from '../../services/analyticsService';
import type { UserAnalytics as SellerAnalytics } from '../../types/user';
const UserAnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<SellerAnalytics | null>(null);
  const [productViews, setProductViews] = useState<number | null>(null);
  const [productUniqueVisitors, setProductUniqueVisitors] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await selectedUserService.getAnalytics();
      setAnalytics(data);

      // Fetch seller product view stats and aggregate totals for visits
      try {
        const views = await analyticsService.getSellerProductViews();
        // sum totals
        const totalViews = views.reduce((sum, v) => sum + (v.totalViews || 0), 0);
        const totalUnique = views.reduce((sum, v) => sum + (v.uniqueVisitors || 0), 0);
        setProductViews(totalViews);
        setProductUniqueVisitors(totalUnique);
      } catch (err) {
        // non-fatal: log and continue
        console.debug('Failed to load product views:', err);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadAnalytics();
  }, []);
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
          <Alert severity="error">{error}</Alert>
        </Box>
      </Container>
    );
  }
  if (!analytics) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <Alert severity="info">No analytics data available</Alert>
        </Box>
      </Container>
    );
  }
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Sales Analytics
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2, mb: 4 }}>
          <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="h6">Total Revenue</Typography>
            <Typography variant="h4" color="primary">
              ${(analytics.revenue || 0).toLocaleString()}
            </Typography>
          </Box>
          <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="h6">Total Orders</Typography>
            <Typography variant="h4" color="primary">
              {analytics.totalOrders || 0}
            </Typography>
          </Box>
          <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="h6">Completion Rate</Typography>
            <Typography variant="h4" color="primary">
              {(analytics.completionRate || 0).toFixed(1)}%
            </Typography>
          </Box>
          <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="h6">Avg Order Value</Typography>
            <Typography variant="h4" color="primary">
              ${(analytics.averageOrderValue || 0).toFixed(2)}
            </Typography>
          </Box>
          <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="h6">Total Product Views</Typography>
            <Typography variant="h4" color="primary">
              {productViews !== null ? productViews.toLocaleString() : '—'}
            </Typography>
          </Box>
          <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="h6">Unique Visitors (Products)</Typography>
            <Typography variant="h4" color="primary">
              {productUniqueVisitors !== null ? productUniqueVisitors.toLocaleString() : '—'}
            </Typography>
          </Box>
        </Box>
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          Monthly Performance
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2 }}>
          <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>This Month</Typography>
            <Typography variant="h4" color="success.main">
              ${(analytics.thisMonthSales || 0).toLocaleString()}
            </Typography>
          </Box>
          <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>Last Month</Typography>
            <Typography variant="h4" color="text.secondary">
              ${(analytics.lastMonthSales || 0).toLocaleString()}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};
export default UserAnalyticsPage;
