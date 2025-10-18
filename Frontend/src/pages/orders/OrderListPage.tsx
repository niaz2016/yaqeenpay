import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  Chip,
  TextField,
  InputAdornment,
  Pagination,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ImageNotSupportedIcon from '@mui/icons-material/ImageNotSupported';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { ordersService, type PagedResult } from '../../services/ordersService';
import ratingService from '../../services/ratingService';
import RatingBadge from '../../components/rating/RatingBadge';
import RatingStars from '../../components/rating/RatingStars';
import type { Order } from '../../types/order';
import type { RatingStats } from '../../types/rating';
import { useAuth } from '../../context/AuthContext';
import { normalizeImageUrl, placeholderDataUri } from '../../utils/image';

const statusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'success';
    case 'rejected': return 'error';
    case 'disputed': return 'warning';
    case 'shipped': return 'info';
    default: return 'default';
  }
};

// Helper function to map backend status to frontend OrderStatus
const mapBackendStatusToFrontend = (backendStatus: string) => {
  const statusMap: Record<string, string> = {
    'Created': 'pending-payment',
    'PaymentConfirmed': 'payment-confirmed', 
    'AwaitingShipment': 'awaiting-shipment',
    'Shipped': 'shipped',
    'Delivered': 'delivered',
    'Completed': 'completed',
    'Rejected': 'rejected',
    'Disputed': 'disputed',
    'Cancelled': 'cancelled'
  };
  
  return statusMap[backendStatus] || 'pending-payment';
};

// Local normalizeImageUrl removed in favor of centralized util

const OrderListPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PagedResult<Order>>({ items: [], total: 0, page: 1, pageSize: 10 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [userRatings, setUserRatings] = useState<Record<string, RatingStats>>({});

  // Helper function to determine user's role in an order
  const getUserRole = (order: Order): 'buyer' | 'seller' | 'unknown' => {
    if (!user?.id) return 'unknown';
    if (order.buyerId === user.id) return 'buyer';
    if (order.sellerId === user.id) return 'seller';
    return 'unknown';
  };

  // Load ratings for other parties in orders
  useEffect(() => {
    const loadUserRatings = async () => {
      if (!data.items.length || !user?.id) return;

      const otherUserIds = data.items.map(order => {
        const role = getUserRole(order);
        return role === 'buyer' ? order.sellerId : order.buyerId;
      }).filter((id, index, arr) => id && arr.indexOf(id) === index); // unique non-null ids

      const ratingsMap: Record<string, RatingStats> = {};
      
      await Promise.all(
        otherUserIds.map(async (userId) => {
          if (userId) {
            try {
              const stats = await ratingService.getRatingStats(userId);
              ratingsMap[userId] = stats;
            } catch (error) {
              console.error(`Failed to load ratings for user ${userId}:`, error);
            }
          }
        })
      );
      
      setUserRatings(ratingsMap);
    };

    loadUserRatings();
  }, [data.items, user?.id]);

  const load = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      // Wait for auth to finish loading before checking authentication
      if (authLoading) {
        setLoading(false);
        return;
      }
      
      // Check if user is authenticated using AuthContext
      if (!isAuthenticated) {
        setError('Please log in to view your orders.');
        setData({ items: [], total: 0, page: 1, pageSize: 10 });
        setLoading(false);
        return;
      }
      
      // Make real API call to fetch orders - use getAllUserOrders to get both buyer and seller orders
      const result = await ordersService.getAllUserOrders({
        status: status || undefined,
        page: page,
        pageSize: 10,
        search: search || undefined
      });
      
      
      // Handle the actual API response structure
      let orders: Order[] = [];
      let totalCount = 0;
      
      if (result && typeof result === 'object') {
        const response = result as any; // Cast to any to handle different response structures
        
        // Check if the result has the expected pagination structure
        if (Array.isArray(response.items)) {
          // Standard paginated response
          orders = response.items;
          totalCount = response.total || orders.length;
        } else if (Array.isArray(response.data)) {
          // Backend returns {success: true, data: [...]}
          orders = response.data;
          totalCount = orders.length;
        } else if (Array.isArray(response)) {
          // Direct array response
          orders = response;
          totalCount = orders.length;
        }
        
        // Map the backend fields to frontend Order interface
        const mappedOrders = orders.map(order => {
          const backendOrder = order as any; // Cast to access backend-specific fields
          return {
            ...order,
            // Map backend field names to frontend field names if needed
            sellerName: order.sellerName || order.sellerId,
            code: order.code || backendOrder.title || `ORD-${order.id?.slice(-8)}`, // Use title as code if no code exists
            // Map backend status to frontend status
            status: mapBackendStatusToFrontend(backendOrder.status) as any,
            // Ensure description exists
            description: order.description || backendOrder.title || 'Order'
          };
        });
        
        setData({
          items: mappedOrders,
          total: totalCount,
          page: page,
          pageSize: 10
        });
      } else {
        // Fallback if API returns unexpected structure
        console.warn('API returned unexpected structure:', result);
        setData({ items: [], total: 0, page: 1, pageSize: 10 });
      }
    } catch (e) {
      console.error('Failed to load orders:', e);
      
      // Check if it's a network error or API not available
      const isNetworkError = e instanceof Error && (
        e.message.includes('Network Error') ||
        e.message.includes('ERR_CONNECTION_REFUSED') ||
        e.message.includes('404')
      );
      
      const isAuthError = e instanceof Error && (
        e.message.includes('401') ||
        e.message.includes('Unauthorized') ||
        e.message.includes('403')
      );
      
      if (isAuthError) {
        setError('Authentication required. Please log in again.');
      } else if (isNetworkError) {
        setError('Unable to connect to the server. Please check if the backend is running.');
      } else {
        setError(e instanceof Error ? e.message : 'Failed to load orders');
      }
      
      // If API fails, show empty state instead of mock data
      setData({ items: [], total: 0, page: 1, pageSize: 10 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (!authLoading) {
      load(1); 
    }
  }, [isAuthenticated, authLoading]);
  
  // Debounced reload on filters
  useEffect(() => {
    const t = setTimeout(() => load(1), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status]);

  const exportCsv = () => {
    const rows = [
      ['Order Code', 'Seller', 'Amount', 'Currency', 'Status', 'Created At'],
      ...data.items.map(o => [
        o.code || o.id,
        o.sellerName || o.sellerId,
        o.amount.toFixed(2),
        o.currency,
        o.status,
        new Date(o.createdAt).toISOString(),
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} gap={2} mb={3}>
        <Typography variant="h5">My Orders</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
          <TextField
            size="small"
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              labelId="status-label"
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="pending-payment">Pending Payment</MenuItem>
              <MenuItem value="payment-confirmed">Payment Confirmed</MenuItem>
              <MenuItem value="awaiting-shipment">Awaiting Shipment</MenuItem>
              <MenuItem value="shipped">Shipped</MenuItem>
              <MenuItem value="delivered">Delivered</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
              <MenuItem value="disputed">Disputed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
          <Stack direction={{ xs: 'column', sm: 'row' }} gap={1}>
            <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={exportCsv}>
              Export CSV
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} component={RouterLink} to="/orders/new">
              New Order
            </Button>
          </Stack>
        </Stack>
      </Stack>

      {loading ? (
        <Stack alignItems="center" py={6}><CircularProgress /></Stack>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <Stack gap={2}>
          {(data?.items || []).map(order => (
            <Card 
              key={order.id} 
              onClick={() => {
                if (order.id && order.id !== 'undefined') {
                  navigate(`/orders/${order.id}`);
                }
              }} 
              sx={{ cursor: 'pointer' }}
            >
              <CardContent>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1}>
                  <Stack direction="row" gap={2} alignItems="center">
                    {/* Thumbnail */}
                    <Box sx={{ width: 64, height: 64, borderRadius: 1, overflow: 'hidden', bgcolor: 'background.paper', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {order.imageUrls && order.imageUrls.length > 0 ? (
                        <img
                          src={normalizeImageUrl(order.imageUrls[0])}
                          onError={(e: any) => { e.currentTarget.src = placeholderDataUri(64); console.warn('Order thumbnail failed to load:', order.imageUrls?.[0]); }}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          alt="order"
                        />
                      ) : (
                        <ImageNotSupportedIcon fontSize="large" color="disabled" />
                      )}
                    </Box>

                    <Stack>
                      <Stack direction="row" alignItems="center" gap={1} mb={0.5}>
                        <Typography variant="subtitle2" color="text.secondary">{order.code || order.id}</Typography>
                        <Chip 
                          label={getUserRole(order)} 
                          size="small" 
                          color={getUserRole(order) === 'buyer' ? 'primary' : 'secondary'} 
                          variant="outlined"
                        />
                      </Stack>
                      <Typography variant="h6">{order.description || 'Escrow order'}</Typography>
                      <Stack direction="row" alignItems="center" gap={1}>
                        <Typography variant="body2" color="text.secondary">
                          {getUserRole(order) === 'buyer' ? `Seller: ${order.sellerName || order.sellerId}` : `Buyer: ${order.buyerId}`}
                        </Typography>
                        {(() => {
                          const role = getUserRole(order);
                          const otherUserId = role === 'buyer' ? order.sellerId : order.buyerId;
                          const rating = otherUserId ? userRatings[otherUserId] : null;
                          return rating && rating.totalRatings > 0 ? (
                            <>
                              <RatingBadge stats={rating} size="small" />
                              <RatingStars value={rating.averageRating} readonly size="small" />
                              <Typography variant="caption" color="text.secondary">
                                ({rating.totalRatings})
                              </Typography>
                            </>
                          ) : null;
                        })()}
                      </Stack>
                    </Stack>
                  </Stack>

                  <Stack alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
                    <Chip label={order.status} color={statusColor(order.status) as any} sx={{ mb: 1 }} />
                    <Typography variant="h6">{order.amount.toFixed(2)} {order.currency}</Typography>
                    <Typography variant="body2" color="text.secondary">Created {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}</Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}

          <Stack alignItems="center" py={2}>
            <Pagination
              count={Math.ceil((data?.total || 0) / (data?.pageSize || 10)) || 1}
              page={data?.page || 1}
              onChange={(_, p) => load(p)}
            />
          </Stack>
        </Stack>
      )}
    </Box>
  );
};

export default OrderListPage;
