import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TableSortLabel,
  Chip,
  TextField,
  Button,
  Stack,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  ShoppingBag as ProductIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import analyticsService, { type AnalyticsData } from '../../services/analyticsService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminAnalyticsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [visitorStats, setVisitorStats] = useState<Array<{
    visitorId: string;
    totalVisits: number;
    firstSeen: string;
    lastSeen: string;
    sampleIp?: string | null;
    sampleUserAgent?: string | null;
    sampleBrowser?: string | null;
  }>>([]);
  const [visitorsLoading, setVisitorsLoading] = useState(false);
  const [visitorsPage, setVisitorsPage] = useState(1);
  const [visitorsPageSize, setVisitorsPageSize] = useState<number>(50);
  const [visitorsTotal, setVisitorsTotal] = useState(0);
  const [visitorsSortBy, setVisitorsSortBy] = useState<'totalVisits' | 'firstSeen' | 'lastSeen'>('lastSeen');
  const [visitorsSortDir, setVisitorsSortDir] = useState<'asc' | 'desc'>('desc');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      let start: Date | undefined;
      let end: Date | undefined;

      if (dateRange === 'today') {
        start = new Date();
        start.setHours(0, 0, 0, 0);
      } else if (dateRange === 'week') {
        start = new Date();
        start.setDate(start.getDate() - 7);
      } else if (dateRange === 'month') {
        start = new Date();
        start.setMonth(start.getMonth() - 1);
      } else if (startDate && endDate) {
        start = new Date(startDate);
        end = new Date(endDate);
      }

      const data = await analyticsService.getAdminAnalytics(start, end);
      setAnalytics(data);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to load analytics data';
      setError(errorMsg);
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  useEffect(() => {
    // fetch visitor stats when Visitors tab is selected
    if (tabValue === 4) {
      fetchVisitorStats(visitorsPage, visitorsPageSize);
    }
  }, [tabValue]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCustomDateFilter = () => {
    if (startDate && endDate) {
      fetchAnalytics();
    }
  };

  const fetchVisitorStats = async (page = 1, pageSize = 200, sortBy = visitorsSortBy, sortDir: 'asc' | 'desc' = visitorsSortDir) => {
    try {
      setVisitorsLoading(true);
      const start = startDate ? new Date(startDate) : undefined;
      const end = endDate ? new Date(endDate) : undefined;
      const data = await analyticsService.getVisitorStats(page, pageSize, start, end, sortBy, sortDir);
      console.debug('[AdminAnalyticsPage] fetched visitor stats', { page, pageSize, sortBy, sortDir, data });
      setVisitorStats((data.items || []).map((v: any) => ({
        visitorId: v.visitorId,
        totalVisits: v.totalVisits,
        firstSeen: v.firstSeen,
        lastSeen: v.lastSeen,
        sampleIp: v.sampleIp,
        sampleUserAgent: v.sampleUserAgent,
        sampleBrowser: v.sampleBrowser
      })));
      setVisitorsTotal(data.totalCount || 0);
    } catch (err) {
      console.error('Failed to load visitor stats', err);
    } finally {
      setVisitorsLoading(false);
    }
  };

  const handleVisitorsPageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setVisitorsPage(value);
    fetchVisitorStats(value, visitorsPageSize, visitorsSortBy, visitorsSortDir);
  };

  const handleVisitorsSortChange = (field: 'totalVisits' | 'firstSeen' | 'lastSeen') => {
    if (visitorsSortBy === field) {
      // toggle direction
      const nextDir = visitorsSortDir === 'asc' ? 'desc' : 'asc';
      setVisitorsSortDir(nextDir);
      // refetch first page with new direction
      setVisitorsPage(1);
      fetchVisitorStats(1, visitorsPageSize, field, nextDir);
    } else {
      setVisitorsSortBy(field);
      setVisitorsSortDir('desc');
      setVisitorsPage(1);
      fetchVisitorStats(1, visitorsPageSize, field, 'desc');
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={fetchAnalytics}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!analytics) return null;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Analytics & Tracking
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchAnalytics}
        >
          Refresh
        </Button>
      </Box>

      {/* Date Range Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Date Range
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Quick Filter</InputLabel>
              <Select
                value={dateRange}
                label="Quick Filter"
                onChange={(e) => setDateRange(e.target.value as any)}
              >
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="week">Last 7 Days</MenuItem>
                <MenuItem value="month">Last 30 Days</MenuItem>
              </Select>
            </FormControl>

            <Divider orientation="vertical" flexItem />

            <TextField
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 200 }}
            />
            <TextField
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 200 }}
            />
            <Button
              variant="contained"
              onClick={handleCustomDateFilter}
              disabled={!startDate || !endDate}
            >
              Apply
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <VisibilityIcon color="primary" />
              <Typography variant="body2" color="text.secondary">
                Total Page Views
              </Typography>
            </Box>
            <Typography variant="h4" color="primary">
              {analytics.totalPageViews.toLocaleString()}
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
              {analytics.totalUniqueVisitors.toLocaleString()}
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <TrendingUpIcon color="success" />
              <Typography variant="body2" color="text.secondary">
                Avg. Views/Visitor
              </Typography>
            </Box>
            <Typography variant="h4" color="success.main">
              {analytics.totalUniqueVisitors > 0
                ? (analytics.totalPageViews / analytics.totalUniqueVisitors).toFixed(2)
                : '0'}
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <ProductIcon color="info" />
              <Typography variant="body2" color="text.secondary">
                Product Page Views
              </Typography>
            </Box>
            <Typography variant="h4" color="info.main">
              {analytics.pageTypeBreakdown.find(p => p.pageType === 'Product')?.totalViews.toLocaleString() || '0'}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Overview" />
            <Tab label="Page Type Breakdown" />
            <Tab label="Device Analytics" />
            <Tab label="Time Analysis" />
            <Tab label="Visitors" />
          </Tabs>
        </Box>

        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Traffic Summary
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Metric</TableCell>
                    <TableCell align="right">Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Total Page Views</TableCell>
                    <TableCell align="right">{analytics.totalPageViews.toLocaleString()}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Unique Visitors</TableCell>
                    <TableCell align="right">{analytics.totalUniqueVisitors.toLocaleString()}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Views Today</TableCell>
                    <TableCell align="right">{analytics.todayViews.toLocaleString()}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Unique Visitors Today</TableCell>
                    <TableCell align="right">{analytics.todayUniqueVisitors.toLocaleString()}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Views This Week</TableCell>
                    <TableCell align="right">{analytics.weekViews.toLocaleString()}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Unique Visitors This Week</TableCell>
                    <TableCell align="right">{analytics.weekUniqueVisitors.toLocaleString()}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Views This Month</TableCell>
                    <TableCell align="right">{analytics.monthViews.toLocaleString()}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Unique Visitors This Month</TableCell>
                    <TableCell align="right">{analytics.monthUniqueVisitors.toLocaleString()}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        {/* Page Type Breakdown Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Traffic by Page Type
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Page Type</TableCell>
                    <TableCell align="right">Total Views</TableCell>
                    <TableCell align="right">Unique Visitors</TableCell>
                    <TableCell align="right">Avg Views/Visitor</TableCell>
                    <TableCell align="right">% of Total Views</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analytics.pageTypeBreakdown.map((pageType) => (
                    <TableRow key={pageType.pageType}>
                      <TableCell>
                        <Chip label={pageType.pageType} color="primary" variant="outlined" />
                      </TableCell>
                      <TableCell align="right">{pageType.totalViews.toLocaleString()}</TableCell>
                      <TableCell align="right">{pageType.uniqueVisitors.toLocaleString()}</TableCell>
                      <TableCell align="right">
                        {pageType.uniqueVisitors > 0
                          ? (pageType.totalViews / pageType.uniqueVisitors).toFixed(2)
                          : '0'}
                      </TableCell>
                      <TableCell align="right">
                        {analytics.totalPageViews > 0
                          ? ((pageType.totalViews / analytics.totalPageViews) * 100).toFixed(1)
                          : '0'}%
                      </TableCell>
                    </TableRow>
                  ))}
                  {analytics.pageTypeBreakdown.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        {/* Device Analytics Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 2 }}>
            <Stack spacing={4}>
              {/* Device Type Breakdown */}
              <Box>
                <Typography variant="h6" gutterBottom>
                  Traffic by Device Type
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Device Type</TableCell>
                        <TableCell align="right">Total Views</TableCell>
                        <TableCell align="right">Unique Visitors</TableCell>
                        <TableCell align="right">Avg Views/Visitor</TableCell>
                        <TableCell align="right">% of Total Views</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {analytics.deviceBreakdown.map((device) => (
                        <TableRow key={device.deviceType}>
                          <TableCell>
                            <Chip label={device.deviceType} color="secondary" variant="outlined" />
                          </TableCell>
                          <TableCell align="right">{device.totalViews.toLocaleString()}</TableCell>
                          <TableCell align="right">{device.uniqueVisitors.toLocaleString()}</TableCell>
                          <TableCell align="right">
                            {device.uniqueVisitors > 0
                              ? (device.totalViews / device.uniqueVisitors).toFixed(2)
                              : '0'}
                          </TableCell>
                          <TableCell align="right">
                            {analytics.totalPageViews > 0
                              ? ((device.totalViews / analytics.totalPageViews) * 100).toFixed(1)
                              : '0'}%
                          </TableCell>
                        </TableRow>
                      ))}
                      {analytics.deviceBreakdown.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            No data available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              {/* Browser Breakdown */}
              <Box>
                <Typography variant="h6" gutterBottom>
                  Traffic by Browser
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Browser</TableCell>
                        <TableCell align="right">Total Views</TableCell>
                        <TableCell align="right">Unique Visitors</TableCell>
                        <TableCell align="right">Avg Views/Visitor</TableCell>
                        <TableCell align="right">% of Total Views</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {analytics.browserBreakdown.map((browser) => (
                        <TableRow key={browser.browser}>
                          <TableCell>
                            <Chip label={browser.browser} color="info" variant="outlined" />
                          </TableCell>
                          <TableCell align="right">{browser.totalViews.toLocaleString()}</TableCell>
                          <TableCell align="right">{browser.uniqueVisitors.toLocaleString()}</TableCell>
                          <TableCell align="right">
                            {browser.uniqueVisitors > 0
                              ? (browser.totalViews / browser.uniqueVisitors).toFixed(2)
                              : '0'}
                          </TableCell>
                          <TableCell align="right">
                            {analytics.totalPageViews > 0
                              ? ((browser.totalViews / analytics.totalPageViews) * 100).toFixed(1)
                              : '0'}%
                          </TableCell>
                        </TableRow>
                      ))}
                      {analytics.browserBreakdown.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            No data available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              {/* Operating System Breakdown */}
              <Box>
                <Typography variant="h6" gutterBottom>
                  Traffic by Operating System
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Operating System</TableCell>
                        <TableCell align="right">Total Views</TableCell>
                        <TableCell align="right">Unique Visitors</TableCell>
                        <TableCell align="right">Avg Views/Visitor</TableCell>
                        <TableCell align="right">% of Total Views</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {analytics.osBreakdown.map((os) => (
                        <TableRow key={os.operatingSystem}>
                          <TableCell>
                            <Chip label={os.operatingSystem} color="success" variant="outlined" />
                          </TableCell>
                          <TableCell align="right">{os.totalViews.toLocaleString()}</TableCell>
                          <TableCell align="right">{os.uniqueVisitors.toLocaleString()}</TableCell>
                          <TableCell align="right">
                            {os.uniqueVisitors > 0
                              ? (os.totalViews / os.uniqueVisitors).toFixed(2)
                              : '0'}
                          </TableCell>
                          <TableCell align="right">
                            {analytics.totalPageViews > 0
                              ? ((os.totalViews / analytics.totalPageViews) * 100).toFixed(1)
                              : '0'}%
                          </TableCell>
                        </TableRow>
                      ))}
                      {analytics.osBreakdown.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            No data available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Stack>
          </Box>
        </TabPanel>

        {/* Time Analysis Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Traffic Trends Over Time
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, mt: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Today
                  </Typography>
                  <Typography variant="h5" color="primary" gutterBottom>
                    {analytics.todayViews.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {analytics.todayUniqueVisitors.toLocaleString()} unique visitors
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Avg: {analytics.todayUniqueVisitors > 0 ? (analytics.todayViews / analytics.todayUniqueVisitors).toFixed(2) : '0'} views/visitor
                  </Typography>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Last 7 Days
                  </Typography>
                  <Typography variant="h5" color="secondary" gutterBottom>
                    {analytics.weekViews.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {analytics.weekUniqueVisitors.toLocaleString()} unique visitors
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Avg: {analytics.weekUniqueVisitors > 0 ? (analytics.weekViews / analytics.weekUniqueVisitors).toFixed(2) : '0'} views/visitor
                  </Typography>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Last 30 Days
                  </Typography>
                  <Typography variant="h5" color="success.main" gutterBottom>
                    {analytics.monthViews.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {analytics.monthUniqueVisitors.toLocaleString()} unique visitors
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Avg: {analytics.monthUniqueVisitors > 0 ? (analytics.monthViews / analytics.monthUniqueVisitors).toFixed(2) : '0'} views/visitor
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </TabPanel>

        {/* Visitors Tab */}
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Visitor Activity (by visitorId)
            </Typography>

            {visitorsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 2 }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel id="visitors-page-size-label">Page size</InputLabel>
                  <Select
                    labelId="visitors-page-size-label"
                    value={visitorsPageSize}
                    label="Page size"
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setVisitorsPageSize(val);
                      setVisitorsPage(1);
                      fetchVisitorStats(1, val, visitorsSortBy, visitorsSortDir);
                    }}
                  >
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={25}>25</MenuItem>
                    <MenuItem value={50}>50</MenuItem>
                    <MenuItem value={100}>100</MenuItem>
                    <MenuItem value={200}>200</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Visitor ID</TableCell>
                      <TableCell align="right">
                        <TableSortLabel
                          active={visitorsSortBy === 'totalVisits'}
                          direction={visitorsSortBy === 'totalVisits' ? visitorsSortDir : 'desc'}
                          onClick={() => handleVisitorsSortChange('totalVisits')}
                        >
                          Total Visits
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="right">
                        <TableSortLabel
                          active={visitorsSortBy === 'firstSeen'}
                          direction={visitorsSortBy === 'firstSeen' ? visitorsSortDir : 'desc'}
                          onClick={() => handleVisitorsSortChange('firstSeen')}
                        >
                          First Seen
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="right">
                        <TableSortLabel
                          active={visitorsSortBy === 'lastSeen'}
                          direction={visitorsSortBy === 'lastSeen' ? visitorsSortDir : 'desc'}
                          onClick={() => handleVisitorsSortChange('lastSeen')}
                        >
                          Last Seen
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Sample IP</TableCell>
                      <TableCell>Sample User Agent</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {visitorStats.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">No visitor data</TableCell>
                      </TableRow>
                    ) : (
                      visitorStats.map((v) => (
                        <TableRow key={v.visitorId}>
                          <TableCell sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.visitorId}</TableCell>
                          <TableCell align="right">{v.totalVisits}</TableCell>
                          <TableCell align="right">{new Date(v.firstSeen).toLocaleString()}</TableCell>
                          <TableCell align="right">{new Date(v.lastSeen).toLocaleString()}</TableCell>
                          <TableCell sx={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.sampleIp || '-'}</TableCell>
                          <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.sampleUserAgent || '-'}</TableCell>
                        </TableRow>
                      )))}
                  </TableBody>
                </Table>
                {/* Pagination for visitors */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Pagination
                    count={Math.max(1, Math.ceil((visitorsTotal || 0) / visitorsPageSize))}
                    page={visitorsPage}
                    onChange={handleVisitorsPageChange}
                    color="primary"
                    size="small"
                  />
                </Box>
              </TableContainer>
              </>
            )}
          </Box>
        </TabPanel>
      </Card>
    </Box>
  );
};


export default AdminAnalyticsPage;
