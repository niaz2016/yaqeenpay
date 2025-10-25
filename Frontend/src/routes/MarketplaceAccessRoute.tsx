import React from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../layouts/MainLayout';
import PublicMarketplaceLayout from '../layouts/PublicMarketplaceLayout';

interface MarketplaceAccessRouteProps {
  children: React.ReactElement;
}

// Chooses an appropriate layout for marketplace pages based on auth state
const MarketplaceAccessRoute: React.FC<MarketplaceAccessRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isAuthenticated) {
    return <MainLayout>{children}</MainLayout>;
  }

  return <PublicMarketplaceLayout>{children}</PublicMarketplaceLayout>;
};

export default MarketplaceAccessRoute;
