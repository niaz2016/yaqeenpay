import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import {
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import analyticsService from '../../services/analyticsService';
import type { AnalyticsData } from '../../types/analytics';
import type { SellerSummary } from '../../types/analytics';

const AdminAnalyticsCard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const data = await analyticsService.getAdminAnalytics();
        // prefer server-provided deduped unique visitors
        const summary: SellerSummary | null = await (analyticsService as any).getAdminSummary?.();
        if (summary && typeof summary.totalUniqueVisitors === 'number') {
          // copy and override totalUniqueVisitors
          const overridden = { ...(data as any), totalUniqueVisitors: summary.totalUniqueVisitors } as AnalyticsData;
          setAnalytics(overridden);
        } else {
          setAnalytics(data);
        }
      } catch (err) {
        setError('Failed to load analytics');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) return null;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <VisibilityIcon />
          Website Analytics
        </Typography>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2, mt: 2 }}>
          {/* Total Stats */}
          <Box>
            <Typography variant="body2" color="text.secondary">
              Total Page Views
            </Typography>
            <Typography variant="h4" color="primary">
              {analytics.totalPageViews.toLocaleString()}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Unique Visitors
            </Typography>
            <Typography variant="h4" color="secondary">
              {analytics.totalUniqueVisitors.toLocaleString()}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Time-based Stats */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Today
            </Typography>
            <Box display="flex" alignItems="baseline" gap={1}>
              <Typography variant="h6">{analytics.todayViews}</Typography>
              <Typography variant="caption" color="text.secondary">
                ({analytics.todayUniqueVisitors} unique)
              </Typography>
            </Box>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              This Week
            </Typography>
            <Box display="flex" alignItems="baseline" gap={1}>
              <Typography variant="h6">{analytics.weekViews}</Typography>
              <Typography variant="caption" color="text.secondary">
                ({analytics.weekUniqueVisitors} unique)
              </Typography>
            </Box>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              This Month
            </Typography>
            <Box display="flex" alignItems="baseline" gap={1}>
              <Typography variant="h6">{analytics.monthViews}</Typography>
              <Typography variant="caption" color="text.secondary">
                ({analytics.monthUniqueVisitors} unique)
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Page Type Breakdown */}
        {analytics.pageTypeBreakdown.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              Page Type Breakdown
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 1, mt: 1 }}>
              {analytics.pageTypeBreakdown.map((pageType) => (
                <Box key={pageType.pageType} sx={{ p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {pageType.pageType}
                  </Typography>
                  <Box display="flex" alignItems="baseline" gap={1}>
                    <Typography variant="body1" fontWeight={500}>
                      {pageType.totalViews}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ({pageType.uniqueVisitors} unique)
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminAnalyticsCard;
