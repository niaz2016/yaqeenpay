// src/pages/seller/SellerOrdersPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Tab,
  Tabs,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Stack,
  Avatar
} from '@mui/material';
import {
  FilterList,
  Search,
  Refresh
} from '@mui/icons-material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../services/userService';
import type { SellerOrder, SellerOrdersFilters } from '../../types/user';
import TopRightToast from '../../components/TopRightToast';

const UserOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentTab, setCurrentTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const statusTabs = [
    { label: 'All Orders', value: '' },
    { label: 'Awaiting Payment', value: 'PendingPayment' },
    { label: 'Ready to Ship', value: 'Paid' },
    { label: 'Shipped', value: 'Shipped' },
    { label: 'Delivered', value: 'Delivered' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Issues', value: 'Disputed' }
  ];

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const filters: SellerOrdersFilters = {
        status: statusTabs[currentTab].value || undefined,
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
        sortBy: 'CreatedAt',
        sortDirection: 'desc'
      };

  const response = await userService.getSellerOrders(filters as any);

      // Ensure data structure integrity
      const sanitizedOrders = (response.items || []).map((order: any) => ({
        id: order.id || '',
        orderNumber: order.orderNumber || '',
        amount: Number(order.amount) || 0,
        currency: order.currency || 'PKR',
        description: order.description || '',
        status: order.status || 'Unknown',
        buyerName: order.buyerName || '',
        buyerEmail: order.buyerEmail || '',
        createdAt: order.createdAt || order.created || order.orderDate || order.dateCreated || new Date().toISOString(),
        updatedAt: order.updatedAt || order.updated || order.lastModified || null,
        shippedDate: order.shippedDate || null,
        deliveredDate: order.deliveredDate || null,
        trackingNumber: order.trackingNumber || null,
        shippingAddress: order.shippingAddress || null,
        canShip: Boolean(order.canShip),
        canMarkDelivered: Boolean(order.canMarkDelivered),
        canUpdateShipping: Boolean(order.canUpdateShipping),
        canDispute: Boolean(order.canDispute)
      }));
      setOrders(sanitizedOrders);
      setTotalCount(response.totalCount || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [currentTab, paginationModel]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
    setPaginationModel({ ...paginationModel, page: 0 });
  };

  const handleRefresh = () => {
    loadOrders();
  };

  const getStatusChip = (status: string) => {
    const statusColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
      'PendingPayment': 'warning',
      'Paid': 'info',
      'Shipped': 'primary',
      'Delivered': 'success',
      'Completed': 'success',
      'Disputed': 'error',
      'Cancelled': 'error'
    };

    return (
      <Chip
        label={status}
        color={statusColors[status] || 'default'}
        size="small"
        variant="outlined"
      />
    );
  };

  const columns: GridColDef[] = [
    {
      field: 'orderNumber',
      headerName: 'Order #',
      width: 140,
      renderCell: (params) => {
        if (!params || !params.row) return 'N/A';
        return (
          <Button
            variant="text"
            size="small"
            onClick={() => {
              if (params.row.id && params.row.id !== 'undefined') {
                navigate(`/seller/orders/${params.row.id}`);
              }
            }}
            sx={{ textTransform: 'none' }}
          >
            {params.value || `Order-${params.row.id?.slice(0, 8) || 'N/A'}`}
          </Button>
        );
      }
    },
    {
      field: 'buyerName',
      headerName: 'Customer',
      width: 150,
      renderCell: (params) => {
        if (!params || !params.row) return 'Unknown Customer';
        return (
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {params.value || 'Unknown Customer'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {params.row.buyerEmail || 'No email'}
            </Typography>
          </Box>
        );
      }
    },
    {
      field: 'description',
      headerName: 'Product/Service',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => {
        if (!params || !params.row) return 'No description';
        return (
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {params.value || 'No description'}
            </Typography>
            {params.row.trackingNumber && (
              <Typography variant="caption" color="primary.main">
                Tracking: {params.row.trackingNumber}
              </Typography>
            )}
          </Box>
        );
      }
    },
    {
      field: 'amount',
      headerName: 'Order Value',
      width: 120,
      renderCell: (params) => {
        if (!params || !params.row) return 'PKR 0.00';
        const amount = typeof params.value === 'number' ? params.value : 0;
        return (
          <Typography variant="body2" fontWeight="medium" color="success.main">
            {params.row.currency || 'PKR'} {amount.toFixed(2)}
          </Typography>
        );
      }
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => {
        if (!params) return getStatusChip('Unknown');
        return getStatusChip(params.value || 'Unknown');
      }
    },
    {
      field: 'shippingStatus',
      headerName: 'Shipping',
      width: 140,
      renderCell: (params) => {
        if (!params || !params.row) {
          return <Chip label="Unknown" color="default" size="small" />;
        }
        
        const row = params.row;
        if (row.status === 'Delivered') {
          return (
            <Chip label="Delivered" color="success" size="small" />
          );
        } else if (row.status === 'Shipped' && row.trackingNumber) {
          return (
            <Chip label="In Transit" color="info" size="small" />
          );
        } else if (row.status === 'Shipped') {
          return (
            <Chip label="Shipped" color="primary" size="small" />
          );
        } else if (row.canShip) {
          return (
            <Chip label="Ready to Ship" color="warning" size="small" />
          );
        } else {
          return (
            <Chip label="Awaiting Payment" color="default" size="small" />
          );
        }
      }
    },
    {
      field: 'createdAt',
      headerName: 'Order Date',
      width: 140,
      renderCell: (params) => {
        if (!params || !params.row) return 'N/A';
        
        // Try multiple date field sources
        const dateValue = params.value || params.row.createdAt || params.row.orderDate || params.row.created;
        
        if (!dateValue) return 'N/A';
        
        try {
          const date = new Date(dateValue);
          // Check if date is valid
          if (isNaN(date.getTime())) return 'Invalid Date';
          
          return (
            <Typography variant="body2">
              {date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })}
            </Typography>
          );
        } catch (error) {
          return 'Invalid Date';
        }
      }
    },
    {
      field: 'actions',
      headerName: 'Quick Actions',
      width: 180,
      sortable: false,
      renderCell: (params) => {
        if (!params || !params.row) {
          return (
            <Button size="small" variant="outlined" disabled>
              N/A
            </Button>
          );
        }
        
        return (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                if (params.row.id && params.row.id !== 'undefined') {
                  navigate(`/seller/orders/${params.row.id}`);
                }
              }}
            >
              View
            </Button>
            {params.row.canShip && (
              <Button
                size="small"
                variant="contained"
                color="primary"
                onClick={() => {
                  if (params.row.id && params.row.id !== 'undefined') {
                    navigate(`/seller/orders/${params.row.id}/ship`);
                  }
                }}
              >
                Ship
              </Button>
            )}
          </Box>
        );
      }
    }
  ];

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Orders to Fulfill
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, width: isMobile ? '100%' : 'auto' }}>
            <TextField
              size="small"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ width: isMobile ? '100%' : 250 }}
            />
            {!isMobile && (
              <>
                <IconButton onClick={(e) => setFilterAnchorEl(e.currentTarget)}>
                  <FilterList />
                </IconButton>
                
                <IconButton onClick={handleRefresh}>
                  <Refresh />
                </IconButton>
              </>
            )}
          </Box>
        </Box>

        <TopRightToast open={Boolean(error)} message={error || ''} severity="error" onClose={() => setError(null)} />

        <Paper sx={{ width: '100%' }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
          >
            {statusTabs.map((tab, index) => (
              <Tab key={index} label={tab.label} />
            ))}
          </Tabs>

          {/* Desktop: keep DataGrid. Mobile: show stacked cards */}
          {isMobile ? (
            <Box sx={{ p: 2 }}>
              <Stack spacing={2}>
                {orders.map((o) => (
                  <Card key={o.id} variant="outlined" sx={{ cursor: 'pointer' }} onClick={() => navigate(`/seller/orders/${o.id}`)}>
                    <CardContent>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ width: 56, height: 56 }}>{o.buyerName?.charAt(0) || 'U'}</Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="subtitle1" fontWeight="medium">{o.orderNumber || `Order-${o.id?.slice(0,8)}`}</Typography>
                            <Typography variant="subtitle1" color="success.main">{o.currency} {Number(o.amount).toFixed(2)}</Typography>
                          </Stack>
                          <Typography variant="body2" color="text.secondary">{o.description}</Typography>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                            <Chip label={o.status} size="small" />
                            <Typography variant="caption" color="text.secondary">{new Date(o.createdAt).toLocaleDateString()}</Typography>
                          </Stack>
                        </Box>
                      </Stack>
                      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                        <Button size="small" variant="outlined" onClick={(e) => { e.stopPropagation(); navigate(`/seller/orders/${o.id}`); }}>View</Button>
                        {o.canShip && (
                          <Button size="small" variant="contained" color="primary" onClick={(e) => { e.stopPropagation(); navigate(`/seller/orders/${o.id}/ship`); }}>Ship</Button>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Box>
          ) : (
            <Box sx={{ height: 600 }}>
              <DataGrid
                rows={orders || []}
                columns={columns}
                loading={loading}
                paginationMode="server"
                rowCount={totalCount}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={[5, 10, 25, 50]}
                disableRowSelectionOnClick
                sx={{
                  border: 0,
                  '& .MuiDataGrid-columnHeaders': {
                    backgroundColor: 'grey.50'
                  }
                }}
              />
            </Box>
          )}
        </Paper>

        {/* Filter Menu */}
        <Menu
          anchorEl={filterAnchorEl}
          open={Boolean(filterAnchorEl)}
          onClose={() => setFilterAnchorEl(null)}
        >
          <MenuItem onClick={() => setFilterAnchorEl(null)}>
            Date Range
          </MenuItem>
          <MenuItem onClick={() => setFilterAnchorEl(null)}>
            Amount Range
          </MenuItem>
          <MenuItem onClick={() => setFilterAnchorEl(null)}>
            Buyer
          </MenuItem>
        </Menu>
      </Box>
    </Container>
  );
};

export default UserOrdersPage;