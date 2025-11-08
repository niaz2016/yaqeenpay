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
  Collapse,
  IconButton,
  Avatar,
  FormControlLabel,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  Pagination,
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
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon
} from '@mui/icons-material';
import {
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
import { normalizeImageUrl, placeholderDataUri } from '../../utils/image';

// Resolve product main image from various possible shapes returned by API
const resolveProductImage = (product: any, size = 48): string => {
  try {
    const candidates: any[] = [];
    // common fields
    candidates.push(product?.imageUrl, product?.ImageUrl, product?.image, product?.images?.[0]?.imageUrl, product?.images?.[0]?.ImageUrl);
    // other possible shapes
    candidates.push(product?.images?.[0], product?.thumbnail, product?.thumbnailUrl, product?.primaryImageUrl, product?.primaryImage?.imageUrl, product?.mainImageUrl);

    for (const c of candidates) {
      if (!c) continue;
      if (typeof c === 'string' && c.trim() !== '') {
        const normalized = normalizeImageUrl(c);
        if (normalized) return normalized;
      }
      if (typeof c === 'object') {
        // maybe it's an image object with url fields
        const url = c.imageUrl || c.ImageUrl || c.url || c.src || c.path || c.pathUrl;
        if (typeof url === 'string' && url.trim() !== '') {
          const normalized = normalizeImageUrl(url);
          if (normalized) return normalized;
        }
      }
    }
  } catch (err) {
    // swallow
  }
  // fallback placeholder sized to requested size
  return placeholderDataUri(size, '#F5F5F5');
};
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
  const [viewMode, setViewMode] = useState<'table' | 'detailed'>('table');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [chartPeriod, setChartPeriod] = useState<'1d' | '1w' | '1m' | '6m' | '1y' | 'all'>('1w');

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
      // Ensure UI toggle flags exist (default to true) so charts respond to checkbox state
      const withFlags = Array.isArray(data)
        ? data.map(d => ({ ...d, showViews: d.showViews !== false, showUniqueVisitors: d.showUniqueVisitors !== false }))
        : [];
      setProductViews(withFlags);
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

  useEffect(() => {
    // Reset to first page when view mode or rows per page changes
    setPage(0);
  }, [viewMode, rowsPerPage]);

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

  const totalPages = Math.max(1, Math.ceil(safeProductViews.length / rowsPerPage));
  const displayedProducts = safeProductViews.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleChangePage = (_event: unknown, value: number) => {
    setPage(value - 1);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any) => {
    const val = parseInt(event.target.value, 10) || 10;
    setRowsPerPage(val);
    setPage(0);
  };

  const toggleExpandRow = (id: string) => {
    setExpandedRow(prev => (prev === id ? null : id));
  };

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
        {/* Product View Trends (Last 30 Days) - toggle between table (default) and detailed charts */}
        {productViews.length > 0 && (
          <>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              Products Performance 
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(_e, val) => { if (val) setViewMode(val); }}
                size="small"
              >
                <ToggleButton value="table">Table</ToggleButton>
                <ToggleButton value="detailed">Detailed</ToggleButton>
              </ToggleButtonGroup>

                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <FormControl size="small">
                  <InputLabel id="chart-period-label">Period</InputLabel>
                  <Select
                  labelId="chart-period-label"
                  value={chartPeriod}
                  label="Period"
                  onChange={(e) => setChartPeriod(e.target.value as typeof chartPeriod)}
                  sx={{ minWidth: 120 }}
                  >
                  <MenuItem value="1d">Day</MenuItem>
                  <MenuItem value="1w">Week</MenuItem>
                  <MenuItem value="1m">Month</MenuItem>
                  <MenuItem value="6m">6 Months</MenuItem>
                  <MenuItem value="1y">1 Year</MenuItem>
                  <MenuItem value="all">All time</MenuItem>
                  </Select>
                </FormControl>

                <FormControl size="small">
                  <InputLabel id="rows-per-page-label">Rows</InputLabel>
                  <Select
                    labelId="rows-per-page-label"
                    value={rowsPerPage}
                    label="Rows"
                    onChange={handleRowsPerPageChange}
                  >
                    <MenuItem value={5}>5</MenuItem>
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={20}>20</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {viewMode === 'table' ? (
              <Card>
                <CardContent>
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell />
                          <TableCell><strong>Product Name</strong></TableCell>
                          <TableCell align="right"><strong>Total Views</strong></TableCell>
                          <TableCell align="right"><strong>Unique Visitors</strong></TableCell>
                          <TableCell align="right"><strong>Today</strong></TableCell>
                          <TableCell align="right"><strong>This Week</strong></TableCell>
                          <TableCell align="right"><strong>This Month</strong></TableCell>
                          <TableCell align="right"><strong>In Carts</strong></TableCell>
                          <TableCell align="right"><strong>Favorites</strong></TableCell>
                          <TableCell align="right"><strong>Avg Views/Visitor</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {displayedProducts.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={10} align="center">
                              <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                                No product views data available yet
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          displayedProducts.map((product) => (
                            <React.Fragment key={product.productId}>
                              <TableRow hover>
                                <TableCell>
                                  <IconButton size="small" onClick={() => toggleExpandRow(product.productId)}>
                                    {expandedRow === product.productId ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                  </IconButton>
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          {(() => {
                                            const imgSrc = resolveProductImage(product, 36);
                                            return (
                                              <Avatar
                                                src={imgSrc}
                                                alt={product.productName}
                                                sx={{ width: 36, height: 36, bgcolor: imgSrc ? undefined : theme.palette.grey[200] }}
                                              >
                                                {!imgSrc && product.productName ? product.productName.charAt(0) : undefined}
                                              </Avatar>
                                            );
                                          })()}
                                    <Typography variant="body2" fontWeight={500}>{product.productName}</Typography>
                                  </Box>
                                </TableCell>
                                <TableCell align="right"><Chip label={product.totalViews.toLocaleString()} color="primary" size="small" variant="outlined" /></TableCell>
                                <TableCell align="right">{product.uniqueVisitors.toLocaleString()}</TableCell>
                                <TableCell align="right">{product.todayViews.toLocaleString()}</TableCell>
                                <TableCell align="right">{product.weekViews.toLocaleString()}</TableCell>
                                <TableCell align="right">{product.monthViews.toLocaleString()}</TableCell>
                                <TableCell align="right">{(product.inCartCount || 0).toLocaleString()}</TableCell>
                                <TableCell align="right">{(product.favoritesCount || 0).toLocaleString()}</TableCell>
                                <TableCell align="right">{product.uniqueVisitors > 0 ? (product.totalViews / product.uniqueVisitors).toFixed(2) : '0'}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={10}>
                                  <Collapse in={expandedRow === product.productId} timeout="auto" unmountOnExit>
                                    <Box sx={{ margin: 2 }}>
                                      <Typography variant="subtitle2" gutterBottom>Daily Breakdown (Last 30 days)</Typography>
                                      <Table size="small">
                                        <TableHead>
                                          <TableRow>
                                            <TableCell><strong>Date</strong></TableCell>
                                            <TableCell align="right"><strong>Views</strong></TableCell>
                                            <TableCell align="right"><strong>Unique Visitors</strong></TableCell>
                                          </TableRow>
                                        </TableHead>
                                        <TableBody>
                                          {(product.dailyViews || []).map(d => (
                                            <TableRow key={d.date}>
                                              <TableCell>{d.date}</TableCell>
                                              <TableCell align="right">{d.views.toLocaleString()}</TableCell>
                                              <TableCell align="right">{d.uniqueVisitors.toLocaleString()}</TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </Box>
                                  </Collapse>
                                </TableCell>
                              </TableRow>
                            </React.Fragment>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <Pagination count={totalPages} page={page + 1} onChange={handleChangePage} color="primary" />
                  </Box>
                </CardContent>
              </Card>
            ) : (
              // Detailed view (charts) but paginated by page & rowsPerPage
              <>
                <Stack spacing={4}>
                  {displayedProducts
                    .filter(product => (product.monthViews || 0) > 0)
                    .slice()
                    .sort((a, b) => (b.monthViews || 0) - (a.monthViews || 0))
                    .map((product) => (
                      <Card key={product.productId}>
                        <CardContent>
                          <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {(() => {
                                const imgSrc = resolveProductImage(product, 48);
                                return (
                                  <Avatar
                                    src={imgSrc}
                                    alt={product.productName}
                                    sx={{ width: 48, height: 48, bgcolor: imgSrc ? undefined : theme.palette.grey[100] }}
                                  >
                                    {!imgSrc && product.productName ? product.productName.charAt(0) : undefined}
                                  </Avatar>
                                );
                              })()}
                              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>{product.productName}</Typography>
                            </Box>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 2, mt: 1 }}>
                              <Box>
                                <Typography variant="caption" color="text.secondary">Total Views</Typography>
                                <Typography variant="h6" color="primary">{product.totalViews.toLocaleString()}</Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" color="text.secondary">Unique Visitors</Typography>
                                <Typography variant="h6" color="secondary">{product.uniqueVisitors.toLocaleString()}</Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" color="text.secondary">In Carts</Typography>
                                <Typography variant="h6" color="warning.main">{(product.inCartCount || 0).toLocaleString()}</Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" color="text.secondary">Favorites</Typography>
                                <Typography variant="h6" color="error">{(product.favoritesCount || 0).toLocaleString()}</Typography>
                              </Box>
                            </Box>
                          </Box>
                          <Divider sx={{ my: 2 }} />
                          <Box sx={{ mt: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mr: 2 }}>
                                Daily Views & Unique Visitors
                              </Typography>
                              <FormControl component="fieldset" variant="standard">
                                <Stack direction="row" spacing={2} alignItems="center">
                                  <FormControlLabel
                                    control={(
                                      <Checkbox
                                        size="small"
                                        checked={product.showViews !== false}
                                        onChange={() => {
                                          setProductViews(prev =>
                                            prev.map(p =>
                                              p.productId === product.productId
                                                ? { ...p, showViews: !(p.showViews !== false) }
                                                : p
                                            )
                                          );
                                        }}
                                      />
                                    )}
                                    label="Views"
                                  />
                                  <FormControlLabel
                                    control={(
                                      <Checkbox
                                        size="small"
                                        checked={product.showUniqueVisitors !== false}
                                        onChange={() => {
                                          setProductViews(prev =>
                                            prev.map(p =>
                                              p.productId === product.productId
                                                ? { ...p, showUniqueVisitors: !(p.showUniqueVisitors !== false) }
                                                : p
                                            )
                                          );
                                        }}
                                      />
                                    )}
                                    label="Unique Visitors"
                                  />
                                </Stack>
                              </FormControl>
                            </Box>
                            <ResponsiveContainer width="100%" height={300}>
                              {(() => {
                                const daily = product.dailyViews || [];
                                const periodMap: Record<string, number | null> = { '1d': 1, '1w': 7, '1m': 30, '6m': 180, '1y': 365, 'all': null };
                                const n = periodMap[chartPeriod] ?? 1;
                                const filtered = n === null ? daily : (daily.length > n ? daily.slice(-n) : daily);
                                return (
                                  <AreaChart data={filtered} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                                    <XAxis dataKey="date" tickFormatter={(date) => { const d = new Date(date); return `${d.getMonth() + 1}/${d.getDate()}`; }} />
                                    <YAxis />
                                    <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #ccc', borderRadius: 8 }} />
                                    <Legend />
                                    {product.showViews !== false && (
                                      <Area
                                        type="monotone"
                                        dataKey="views"
                                        stroke={theme.palette.primary.main}
                                        fillOpacity={1}
                                        fill={`url(#colorViews-${product.productId})`}
                                        name="Views"
                                      />
                                    )}
                                    {product.showUniqueVisitors !== false && (
                                      <Area
                                        type="monotone"
                                        dataKey="uniqueVisitors"
                                        stroke={theme.palette.secondary.main}
                                        fillOpacity={1}
                                        fill={`url(#colorVisitors-${product.productId})`}
                                        name="Unique Visitors"
                                      />
                                    )}
                                  </AreaChart>
                                );
                              })()}
                            </ResponsiveContainer>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                </Stack>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Pagination count={totalPages} page={page + 1} onChange={handleChangePage} color="primary" />
                </Box>
              </>
            )}
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
