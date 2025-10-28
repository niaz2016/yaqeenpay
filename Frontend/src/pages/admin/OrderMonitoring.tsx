import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  LinearProgress,
  Stack,
  Button,
  Avatar,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Warning as WarningIcon,
  Person as PersonIcon,
  Store as StoreIcon
} from '@mui/icons-material';
import adminService from '../../services/adminServiceSelector';
import type { AdminOrder } from '../../types/admin';

const OrderMonitoring: React.FC = () => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    priority: false
  });

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const filterParams = {
        status: filters.status || undefined,
        priority: filters.priority || undefined
      };
      const data = await adminService.getOrders(filterParams);
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const getStatusChip = (status: string, isPriority: boolean = false) => {
    const statusMap: { [key: string]: { color: any, label: string } } = {
      'Pending': { color: 'warning', label: 'Pending' },
      'Confirmed': { color: 'info', label: 'Confirmed' },
      'Shipped': { color: 'primary', label: 'Shipped' },
      'Delivered': { color: 'success', label: 'Delivered' },
      'Cancelled': { color: 'error', label: 'Cancelled' },
      'Disputed': { color: 'error', label: 'Disputed' }
    };
    
    const config = statusMap[status] || { color: 'default', label: status };
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <Chip 
          label={config.label} 
          color={config.color} 
          size="small" 
        />
        {isPriority && (
          <Chip
            icon={<WarningIcon />}
            label="Priority"
            color="error"
            size="small"
            variant="outlined"
          />
        )}
      </Box>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Order Monitoring
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Order Monitoring
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Confirmed">Confirmed</MenuItem>
                <MenuItem value="Shipped">Shipped</MenuItem>
                <MenuItem value="Delivered">Delivered</MenuItem>
                <MenuItem value="Cancelled">Cancelled</MenuItem>
                <MenuItem value="Disputed">Disputed</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              onClick={() => setFilters({ status: '', priority: false })}
            >
              Clear Filters
            </Button>
          </Stack>
        </CardContent>
      </Card>

        {/* Orders Table */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Orders ({orders.length})
            </Typography>
          </CardContent>
          {isMobile ? (
            <Box sx={{ p: 2 }}>
              <Stack spacing={2}>
                {orders.map((order) => (
                  <Card key={order.id} variant="outlined">
                    <CardContent>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ width: 48, height: 48 }}>
                          <PersonIcon />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="subtitle1" fontWeight="medium">{order.orderNumber}</Typography>
                            <Typography variant="subtitle2" color="text.secondary">{formatCurrency(order.amount)}</Typography>
                          </Stack>
                          <Typography variant="body2" color="text.secondary">Buyer: {order.buyer?.firstName || 'Unknown'} {order.buyer?.lastName || ''}</Typography>
                          <Typography variant="body2" color="text.secondary">Seller: {order.seller?.firstName || 'Unknown'} {order.seller?.lastName || ''}</Typography>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                            {getStatusChip(order.status, order.isPriority)}
                            <Typography variant="caption" color="text.secondary">{formatDate(order.createdAt)}</Typography>
                          </Stack>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Order #</TableCell>
                    <TableCell>Buyer</TableCell>
                    <TableCell>Seller</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Days in Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {order.orderNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{ width: 24, height: 24 }}>
                            <PersonIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontSize="0.875rem">
                              {order.buyer?.firstName || 'Unknown'} {order.buyer?.lastName || ''}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {order.buyer?.email || ''}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{ width: 24, height: 24 }}>
                            <StoreIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontSize="0.875rem">
                              {order.seller?.firstName || 'Unknown'} {order.seller?.lastName || ''}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {order.seller?.email || ''}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(order.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {getStatusChip(order.status, order.isPriority)}
                      </TableCell>
                      <TableCell>
                        {formatDate(order.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2"
                          color={order.daysInCurrentStatus > 7 ? 'error' : 'textPrimary'}
                          fontWeight={order.daysInCurrentStatus > 7 ? 'medium' : 'normal'}
                        >
                          {order.daysInCurrentStatus} days
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {orders.length === 0 && (
            <Box p={3} textAlign="center">
              <Typography variant="h6" color="textSecondary">
                No orders found
              </Typography>
            </Box>
          )}
        </Card>
      </Box>
    );
  };

export default OrderMonitoring;