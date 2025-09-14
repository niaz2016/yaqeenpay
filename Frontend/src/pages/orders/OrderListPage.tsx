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
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { type PagedResult } from '../../services/ordersService';
import type { Order } from '../../types/order';

const statusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'success';
    case 'rejected': return 'error';
    case 'disputed': return 'warning';
    case 'shipped': return 'info';
    default: return 'default';
  }
};

const OrderListPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PagedResult<Order>>({ items: [], total: 0, page: 1, pageSize: 10 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');

  const load = async (page = 1) => {
    try {
      setLoading(true);
      // Temporarily show mock data since backend might not be ready
      const mockData: PagedResult<Order> = {
        items: [
          {
            id: '1',
            code: 'ORD-2024-001',
            sellerId: 'seller-1',
            sellerName: 'Acme Supplies',
            buyerId: 'buyer-1',
            amount: 299.99,
            currency: 'USD',
            description: 'Premium Wireless Headphones',
            status: 'shipped',
            createdAt: new Date().toISOString(),
            items: [
              { id: '1', name: 'Wireless Headphones', quantity: 1, unitPrice: 299.99 }
            ]
          },
          {
            id: '2',
            code: 'ORD-2024-002',
            sellerId: 'seller-2',
            sellerName: 'Tech Store',
            buyerId: 'buyer-1',
            amount: 149.99,
            currency: 'USD',
            description: 'Bluetooth Speaker',
            status: 'delivered',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            items: [
              { id: '2', name: 'Bluetooth Speaker', quantity: 1, unitPrice: 149.99 }
            ]
          }
        ],
        total: 2,
        page: page,
        pageSize: 10
      };
      
      setData(mockData);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); }, []);
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
          {data.items.map(order => (
            <Card key={order.id} onClick={() => navigate(`/orders/${order.id}`)} sx={{ cursor: 'pointer' }}>
              <CardContent>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1}>
                  <Stack>
                    <Typography variant="subtitle2" color="text.secondary">{order.code || order.id}</Typography>
                    <Typography variant="h6">{order.description || 'Escrow order'}</Typography>
                    <Typography variant="body2" color="text.secondary">Seller: {order.sellerName || order.sellerId}</Typography>
                  </Stack>
                  <Stack alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
                    <Chip label={order.status} color={statusColor(order.status) as any} sx={{ mb: 1 }} />
                    <Typography variant="h6">{order.amount.toFixed(2)} {order.currency}</Typography>
                    <Typography variant="body2" color="text.secondary">Created {new Date(order.createdAt).toLocaleString()}</Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}

          <Stack alignItems="center" py={2}>
            <Pagination
              count={Math.ceil(data.total / data.pageSize) || 1}
              page={data.page}
              onChange={(_, p) => load(p)}
            />
          </Stack>
        </Stack>
      )}
    </Box>
  );
};

export default OrderListPage;
