// src/layouts/AuthLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Toolbar,
  Typography,
  Link,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const AuthLayout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Detect Android (Capacitor or UA) and treat as mobile app
  const isCapacitor = !!(window as any).Capacitor;
  const capPlatform = (window as any).Capacitor?.getPlatform?.() || (window as any).Capacitor?.platform;
  const uaIsAndroid = /Android/i.test(navigator.userAgent || '');
  const isAndroidApp = isCapacitor && (String(capPlatform).toLowerCase() === 'android') || (!isCapacitor && uaIsAndroid);
  const forceMobile = isAndroidApp || isMobile;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            <Link component={RouterLink} to="/" color="inherit" underline="none">
              YaqeenPay
            </Link>
          </Typography>
          {/* On mobile apps we hide the header links and rely on app navigation */}
          {!forceMobile && (
            <>
              <Link component={RouterLink} to="/auth/login" color="inherit" sx={{ mx: 1 }}>
                Login
              </Link>
              <Link component={RouterLink} to="/auth/register" color="inherit" sx={{ mx: 1 }}>
                Register
              </Link>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          px: { xs: 2, sm: 3 },
          py: { xs: 2, sm: 4 },
        }}
      >
        <Outlet />
      </Box>
      {/* Footer hidden on mobile app to provide immersive experience */}
      {!forceMobile && (
        <Box
          component="footer"
          sx={{
            py: 3,
            px: 2,
            mt: 'auto',
            backgroundColor: (theme) => theme.palette.grey[100],
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} YaqeenPay. All rights reserved.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default AuthLayout;