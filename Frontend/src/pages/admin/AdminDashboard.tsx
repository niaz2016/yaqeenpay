import React, { useEffect, useState } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent
} from '@mui/material';
import AdminTopUpReview from '../../components/dashboard/AdminTopUpReview';
import AdminAnalyticsCard from '../../components/admin/AdminAnalyticsCard';
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
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getAdminStats();
      // Fetch additional counts: pending top-ups and withdrawals stats (backend may include these already)
      try {
        const [pendingTopUps, withdrawalsStats] = await Promise.all([
          adminService.getPendingTopUpsCount(),
          adminService.getWithdrawalsStats()
        ]);
        setStats({ ...data, pendingTopUps, totalWithdrawals: withdrawalsStats.total, pendingWithdrawals: withdrawalsStats.pending });
      } catch (e) {
        // Fallback: set whatever admin stats returned
        setStats(data);
      }
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

  if (error) {
    return (
      <Box>
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
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Main content */}
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={{ xs: 2, sm: 3 }}>
          <Tooltip title="Refresh Statistics">
            <IconButton onClick={fetchStats} color="primary" size="medium">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Quick Stats Grid */}
        <Box mb={{ xs: 2, sm: 3 }} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: { xs: 2, sm: 2.5, md: 3 } }}>
          {/* Pending Top-Ups Card */}
          <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 }, transition: 'all 0.2s' }} onClick={() => setTopUpDialogOpen(true)}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box flex={1}>
                  <Typography variant="subtitle2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Pending Top-Ups
                  </Typography>
                  <Typography variant="h4" color="primary.main" sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' }, fontWeight: 600, mt: 0.5 }}>
                    {stats.pendingTopUps ?? 0}
                  </Typography>
                </Box>
                <Box sx={{ color: 'primary.main', fontSize: { xs: 32, sm: 40 } }}>
                  <VerifiedUserIcon fontSize="inherit" />
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Withdrawals Card */}
          <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 }, transition: 'all 0.2s' }} onClick={() => handleCardClick('/admin/withdrawals')}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box flex={1}>
                  <Typography variant="subtitle2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Withdrawals
                  </Typography>
                  <Typography variant="h4" color="secondary.main" sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' }, fontWeight: 600, mt: 0.5 }}>
                    {stats.totalWithdrawals ?? 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' }, mt: 0.5 }}>
                    Pending: {stats.pendingWithdrawals ?? 0}
                  </Typography>
                </Box>
                <Box sx={{ color: 'secondary.main', fontSize: { xs: 32, sm: 40 } }}>
                  <ShoppingCartIcon fontSize="inherit" />
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Email Management Card */}
          <Card sx={{ cursor: 'pointer', bgcolor: '#e3f2fd', '&:hover': { boxShadow: 4 }, transition: 'all 0.2s' }} onClick={() => handleCardClick('/admin/email')}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box flex={1}>
                  <Typography variant="subtitle2" color="primary.main" fontWeight={600} sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Email Management
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' }, mt: 0.5 }}>
                    Create email accounts
                  </Typography>
                </Box>
                <Box sx={{ fontSize: { xs: 32, sm: 40 } }}>
                  ✉️
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
        {/* Top-Up Dialog */}
        <Dialog
          open={topUpDialogOpen}
          onClose={() => setTopUpDialogOpen(false)}
          maxWidth="lg"
          fullWidth
          fullScreen={window.innerWidth < 600}
          PaperProps={{
            sx: {
              m: { xs: 0, sm: 2 },
              maxHeight: { xs: '100%', sm: '90vh' }
            }
          }}
        >
          <DialogTitle sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: 2,
            fontSize: { xs: '1.125rem', sm: '1.25rem' }
          }}>
            Wallet Top-Up Approvals
            <IconButton onClick={() => setTopUpDialogOpen(false)} size="small">
              <span style={{ fontSize: '1.5rem' }}>×</span>
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            <AdminTopUpReview />
          </DialogContent>
        </Dialog>

        {/* Main Stats Cards */}
        <Box
          display="grid"
          gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
          gap={{ xs: 2, sm: 2.5, md: 3 }}
          sx={{ mb: { xs: 3, sm: 4 } }}
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
                    top: { xs: 6, sm: 8 },
                    right: { xs: 6, sm: 8 },
                  }}
                >
                  <Chip
                    label="Urgent"
                    color="error"
                    size="small"
                    variant="filled"
                    sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                  />
                </Box>
              )}
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box flex={1}>
                    <Typography color="textSecondary" gutterBottom variant="h6" sx={{ fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem' } }}>
                      {card.title}
                    </Typography>
                    <Typography variant="h3" component="div" color={`${card.color}.main`} sx={{ fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' }, fontWeight: 600 }}>
                      {card.value.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      color: `${card.color}.main`,
                      fontSize: { xs: 32, sm: 40, md: 48 }
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
          gap={{ xs: 2, sm: 2.5, md: 3 }}
          sx={{ mb: { xs: 3, sm: 4 } }}
        >
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box display="flex" alignItems="center" mb={{ xs: 1.5, sm: 2 }}>
                <TrendingUpIcon color="success" sx={{ mr: 1, fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' } }}>
                  Transaction Volume
                </Typography>
              </Box>
              <Typography variant="h4" color="success.main" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }, fontWeight: 600 }}>
                {formatCurrency(stats.totalTransactionVolume)}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                Total processed volume
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box display="flex" alignItems="center" mb={{ xs: 1.5, sm: 2 }}>
                <TrendingUpIcon color="primary" sx={{ mr: 1, fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' } }}>
                  Monthly Growth
                </Typography>
              </Box>
              <Typography
                variant="h4"
                color={stats.monthlyGrowthRate >= 0 ? 'success.main' : 'error.main'}
                gutterBottom
                sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }, fontWeight: 600 }}
              >
                {stats.monthlyGrowthRate >= 0 ? '+' : ''}{formatPercentage(stats.monthlyGrowthRate)}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                Compared to last month
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Quick Actions Alert */}
        {(stats.pendingKycDocuments > 0 || stats.pendingSellers > 0 || stats.openDisputes > 0) && (
          <Box mt={{ xs: 2, sm: 3 }}>
            <Alert severity="info" sx={{ '& .MuiAlert-message': { width: '100%' } }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, fontWeight: 600 }}>
                Actions Required:
              </Typography>
              <Box display="flex" gap={{ xs: 0.75, sm: 1 }} flexWrap="wrap">
                {stats.pendingKycDocuments > 0 && (
                  <Chip
                    label={`${stats.pendingKycDocuments} KYC ${window.innerWidth < 600 ? 'docs' : 'documents'} to review`}
                    color="warning"
                    size="small"
                    onClick={() => navigate('/admin/kyc')}
                    clickable
                    sx={{ fontSize: { xs: '0.7rem', sm: '0.8125rem' } }}
                  />
                )}
                {stats.pendingSellers > 0 && (
                  <Chip
                    label={`${stats.pendingSellers} seller ${window.innerWidth < 600 ? 'apps' : 'applications'} to review`}
                    color="warning"
                    size="small"
                    onClick={() => navigate('/admin/sellers')}
                    clickable
                    sx={{ fontSize: { xs: '0.7rem', sm: '0.8125rem' } }}
                  />
                )}
                {stats.openDisputes > 0 && (
                  <Chip
                    label={`${stats.openDisputes} open disputes to resolve`}
                    color="error"
                    size="small"
                    onClick={() => navigate('/admin/disputes')}
                    clickable
                    sx={{ fontSize: { xs: '0.7rem', sm: '0.8125rem' } }}
                  />
                )}
              </Box>
            </Alert>
          </Box>
        )}
        <Box
          display="grid"
          gridTemplateColumns={{ xs: '1fr', md: 'repeat(2, 1fr)' }}
          gap={{ xs: 2, sm: 2.5, md: 3 }}
          sx={{ mb: { xs: 3, sm: 4 } }}
        >
          {/* Analytics Section */}
          <Box sx={{ mt: 3 }}>
            <AdminAnalyticsCard />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default AdminDashboard;