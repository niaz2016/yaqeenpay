import React from 'react';
import { AppBar, Box, Button, Container, CssBaseline, Toolbar, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

interface PublicMarketplaceLayoutProps {
  children: React.ReactNode;
}

// Minimal layout that keeps marketplace browsable by unauthenticated visitors
const PublicMarketplaceLayout: React.FC<PublicMarketplaceLayoutProps> = ({ children }) => {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <CssBaseline />
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar sx={{ gap: 2 }}>
          <Typography
            component={RouterLink}
            to="/"
            variant="h6"
            sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit', fontWeight: 'bold' }}
          >
            YaqeenPay
          </Typography>
          <Button component={RouterLink} to="/auth/login" color="primary">
            Login
          </Button>
          <Button component={RouterLink} to="/auth/register" variant="contained">
            Sign Up
          </Button>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1, py: { xs: 2, md: 4 }, backgroundColor: 'background.default' }}>
        <Container maxWidth="xl">
          {children}
        </Container>
      </Box>
      <Box component="footer" sx={{ py: 3, backgroundColor: 'grey.100', textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} YaqeenPay. Browse the marketplace freely.
        </Typography>
      </Box>
    </Box>
  );
};

export default PublicMarketplaceLayout;
