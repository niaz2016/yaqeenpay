import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent
} from '@mui/material';
import AdminTopUpReview from '../../components/dashboard/AdminTopUpReview';
import {
  People as PeopleIcon,
  VerifiedUser as VerifiedUserIcon,
  Store as StoreIcon,
  ShoppingCart as ShoppingCartIcon,
  Gavel as GavelIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import adminService from '../../services/adminServiceSelector';
import type { AdminStats } from '../../types/admin';

interface StatCard {
  title: string;
  value: number;
  icon: React.ReactElement;
  color: 'primary' | 'secondary' | 'warning' | 'error' | 'info' | 'success';
  path?: string;
  urgent?: boolean;
}

const AdminDashboard: React.FC = () => {
  const [topUpDialogOpen, setTopUpDialogOpen] = useState(false);
  // Debug: Get current user info
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getAdminStats();
      setStats(data);
    } catch (e) {
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleCardClick = (path?: string) => {
    if (path) {
      navigate(path);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <Box>
        <LinearProgress />
      </Box>
    );
  }

  // Debugger Info: Show current user roles and email
  const DebuggerInfo = () => (
    <Card sx={{ mb: 3, border: '2px dashed #1976d2', background: '#f5faff' }}>
      <CardContent>
        <Typography variant="subtitle2" color="primary" gutterBottom>
          Debugger Info: Current User
        </Typography>
        <Typography variant="body2">
          <strong>Email:</strong> {user?.email || 'N/A'}
        </Typography>
        <Typography variant="body2">
          <strong>Roles:</strong> {user?.roles?.length ? user.roles.join(', ') : 'N/A'}
        </Typography>
      </CardContent>
    </Card>
  );

  if (error) {
    return (
      <Box>
        <Box flexShrink={0} width={{ xs: '100%', md: 300 }}>
          <DebuggerInfo />
        </Box>
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>

        <Alert
          severity="error"
          action={
            <IconButton
              color="inherit"
              size="small"
              onClick={fetchStats}
            >
              <RefreshIcon />
            </IconButton>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  if (!stats) {
    return null;
  }

  const statCards: StatCard[] = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: <PeopleIcon />,
      color: 'primary',
      path: '/admin/users'
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      icon: <PeopleIcon />,
      color: 'success',
      path: '/admin/users'
    },
    {
      title: 'Pending KYC',
      value: stats.pendingKycDocuments,
      icon: <VerifiedUserIcon />,
      color: stats.pendingKycDocuments > 10 ? 'warning' : 'info',
      path: '/admin/kyc',
      urgent: stats.pendingKycDocuments > 10
    },
    {
      title: 'Pending Sellers',
      value: stats.pendingSellers,
      icon: <StoreIcon />,
      color: stats.pendingSellers > 5 ? 'warning' : 'info',
      path: '/admin/sellers',
      urgent: stats.pendingSellers > 5
    },
    {
      title: 'Active Orders',
      value: stats.activeOrders,
      icon: <ShoppingCartIcon />,
      color: 'secondary',
      path: '/admin/orders'
    },
    {
      title: 'Open Disputes',
      value: stats.openDisputes,
      icon: <GavelIcon />,
      color: stats.openDisputes > 0 ? 'error' : 'success',
      path: '/admin/disputes',
      urgent: stats.openDisputes > 0
    }
  ];

  return (
    <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={3}>
      {/* Sidebar with Debugger Info */}

      {/* Main content */}
      <Box flexGrow={1}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Tooltip title="Refresh Statistics">
            <IconButton onClick={fetchStats} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Quick Stats Grid */}
        <Box mb={2}>
          <Button variant="contained" color="primary" onClick={() => setTopUpDialogOpen(true)}>
            Review Wallet Top-Ups
          </Button>
        </Box>
        <Dialog open={topUpDialogOpen} onClose={() => setTopUpDialogOpen(false)} maxWidth="lg" fullWidth>
          <DialogTitle>Wallet Top-Up Approvals</DialogTitle>
          <DialogContent>
            <AdminTopUpReview />
          </DialogContent>
        </Dialog>
        <Box
          display="grid"
          gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }}
          gap={3}
          sx={{ mb: 4 }}
        >
          {statCards.map((card, index) => (
            <Card
              key={index}
              sx={{
                cursor: card.path ? 'pointer' : 'default',
                '&:hover': card.path ? {
                  transform: 'translateY(-2px)',
                  boxShadow: 4,
                } : {},
                transition: 'all 0.2s ease-in-out',
                position: 'relative'
              }}
              onClick={() => handleCardClick(card.path)}
            >
              {card.urgent && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                  }}
                >
                  <Chip
                    label="Urgent"
                    color="error"
                    size="small"
                    variant="filled"
                  />
                </Box>
              )}
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="h6">
                      {card.title}
                    </Typography>
                    <Typography variant="h3" component="div" color={`${card.color}.main`}>
                      {card.value.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      color: `${card.color}.main`,
                      fontSize: 40
                    }}
                  >
                    {card.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Business Metrics */}
        <Box
          display="grid"
          gridTemplateColumns={{ xs: '1fr', md: 'repeat(2, 1fr)' }}
          gap={3}
        >
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Transaction Volume
                </Typography>
              </Box>
              <Typography variant="h4" color="success.main" gutterBottom>
                {formatCurrency(stats.totalTransactionVolume)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total processed volume
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Monthly Growth
                </Typography>
              </Box>
              <Typography
                variant="h4"
                color={stats.monthlyGrowthRate >= 0 ? 'success.main' : 'error.main'}
                gutterBottom
              >
                {stats.monthlyGrowthRate >= 0 ? '+' : ''}{formatPercentage(stats.monthlyGrowthRate)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Compared to last month
              </Typography>
            </CardContent>
          </Card>
        </Box>      {/* Quick Actions Alert */}
        {(stats.pendingKycDocuments > 0 || stats.pendingSellers > 0 || stats.openDisputes > 0) && (
          <Box mt={3}>
            <Alert severity="info">
              <Typography variant="subtitle1" gutterBottom>
                Actions Required:
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {stats.pendingKycDocuments > 0 && (
                  <Chip
                    label={`${stats.pendingKycDocuments} KYC documents to review`}
                    color="warning"
                    size="small"
                    onClick={() => navigate('/admin/kyc')}
                    clickable
                  />
                )}
                {stats.pendingSellers > 0 && (
                  <Chip
                    label={`${stats.pendingSellers} seller applications to review`}
                    color="warning"
                    size="small"
                    onClick={() => navigate('/admin/sellers')}
                    clickable
                  />
                )}
                {stats.openDisputes > 0 && (
                  <Chip
                    label={`${stats.openDisputes} open disputes to resolve`}
                    color="error"
                    size="small"
                    onClick={() => navigate('/admin/disputes')}
                    clickable
                  />
                )}
              </Box>
            </Alert>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default AdminDashboard;