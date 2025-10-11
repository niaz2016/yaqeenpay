// src/layouts/MainLayout.tsx
import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  Toolbar,
  Typography,
  Divider,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  AccountCircle,
  Logout,
  Settings,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import NavMenu from '../components/navigation/NavMenu';
import NotificationDropdown from '../components/notifications/NotificationDropdown';

const drawerWidth = 240;

const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // On mobile: drawer closed by default, on desktop: drawer open by default
  const [open, setOpen] = useState(!isMobile);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    logout();
  };

  const handleProfileClick = () => {
    handleProfileMenuClose();
    navigate('/profile');
  };

  const handleSettingsClick = () => {
    handleProfileMenuClose();
    navigate('/settings');
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          // Mobile: full width AppBar, Desktop: adjust for drawer
          ...(isMobile
            ? {
                width: '100%',
                ml: 0,
              }
            : {
                // Desktop: AppBar width adjusts to drawer
                ml: open ? `${drawerWidth}px` : '64px',
                width: open ? `calc(100% - ${drawerWidth}px)` : 'calc(100% - 64px)',
                transition: (theme) => theme.transitions.create(['width', 'margin'], {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.enteringScreen,
                }),
              }),
        }}
      >
        <Toolbar sx={{ gap: { xs: 1, md: 2 }, minHeight: { xs: 56, md: 64 }, px: { xs: 2, md: 3 } }}>
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: { xs: 1, md: 2 },
              p: { xs: 1.5, md: 1 }, // Larger touch target on mobile
            }}
          >
            {isMobile ? (open ? <CloseIcon /> : <MenuIcon />) : <MenuIcon />}
          </IconButton>
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontSize: { xs: '1rem', md: '1.25rem' },
              fontWeight: 'bold',
            }}
          >
            YaqeenPay
          </Typography>
          {/* Hide welcome text on mobile to save space */}
          {!isMobile && (
            <Typography variant="body1" color="inherit" sx={{ mr: 2 }}>
              Welcome back, {user?.firstName || 'User'}!
            </Typography>
          )}
          <NotificationDropdown />
          <IconButton
            size={isMobile ? 'medium' : 'large'}
            edge="end"
            aria-label="account of current user"
            aria-controls="profile-menu"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
            sx={{ p: { xs: 1.5, md: 1 } }} // Larger touch target on mobile
          >
            <Avatar sx={{ 
              width: { xs: 28, md: 32 }, 
              height: { xs: 28, md: 32 }, 
              bgcolor: 'secondary.main',
              fontSize: { xs: '0.875rem', md: '1rem' }
            }}>
              {user?.firstName?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>

          <Menu
            id="profile-menu"
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={handleProfileClick}>
              <ListItemIcon>
                <AccountCircle fontSize="small" />
              </ListItemIcon>
              <ListItemText>Profile</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleSettingsClick}>
              <ListItemIcon>
                <Settings fontSize="small" />
              </ListItemIcon>
              <ListItemText>Settings</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              <ListItemText>Logout</ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={open}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          width: isMobile ? drawerWidth : (open ? drawerWidth : 64),
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: isMobile ? drawerWidth : (open ? drawerWidth : 64),
            overflowX: 'hidden',
            boxSizing: 'border-box',
            ...(isMobile
              ? {
                  // Mobile: full height overlay
                  height: '100%',
                }
              : {
                  // Desktop: smooth width transition
                  transition: (theme) => theme.transitions.create('width', {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.enteringScreen,
                  }),
                }),
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', mt: 2 }}>
          <NavMenu collapsed={!open && !isMobile} />
        </Box>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 2, md: 3 },
          minWidth: 0, // prevent content overflow on narrow screens
          // Let flexbox handle the width automatically
          // No manual width or margin calculations needed
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, md: 64 } }} />
        <Box
          sx={{
            // Additional responsive container for content
            overflow: 'auto',
            // Responsive padding for different screen sizes
            px: { xs: 0, sm: 0 },
            // Ensure content doesn't get too wide on larger screens
            maxWidth: { xs: '100%', xl: '1400px' },
            mx: 'auto', // Center content on very large screens
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;