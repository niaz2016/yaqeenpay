// src/layouts/MainLayout.tsx
import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
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
  BottomNavigation,
  BottomNavigationAction,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  AccountCircle,
  Logout,
  Settings,
} from '@mui/icons-material';
import HomeIcon from '@mui/icons-material/Home';
import WalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PersonIcon from '@mui/icons-material/Person';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useAuth } from '../context/AuthContext';
import NavMenu from '../components/navigation/NavMenu';
import NotificationDropdown from '../components/notifications/NotificationDropdown';
import cartService from '../services/cartService';
const drawerWidth = 240;

interface MainLayoutProps {
  children?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const [cartItemCount, setCartItemCount] = useState(cartService.getTotalItems());

  // Listen for cart updates
  React.useEffect(() => {
    const handleCartUpdate = (event: CustomEvent) => {
      setCartItemCount(event.detail.totalItems);
    };

    window.addEventListener('cartUpdated', handleCartUpdate as EventListener);
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate as EventListener);
    };
  }, []);

  // Detect Capacitor Android build or Android UA so we can force mobile "app-like" layout
  const isCapacitor = !!(window as any).Capacitor;
  const capPlatform = (window as any).Capacitor?.getPlatform?.() || (window as any).Capacitor?.platform;
  const uaIsAndroid = /Android/i.test(navigator.userAgent || '');
  const isAndroidApp = isCapacitor && (String(capPlatform).toLowerCase() === 'android') || (!isCapacitor && uaIsAndroid);
  const forceMobile = isAndroidApp || isMobile;
  
  // On mobile or Android app: drawer closed by default, on desktop: drawer open by default
  const [open, setOpen] = useState(!forceMobile);
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
          ...(forceMobile
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
            TechTorio
          </Typography>
          {/* Hide welcome text on mobile to save space */}
          {!forceMobile && (
            <Typography variant="body1" color="inherit" sx={{ mr: 2 }}>
              Welcome back, {user?.firstName || 'User'}!
            </Typography>
          )}
          <NotificationDropdown />
          <IconButton
            size={forceMobile ? 'medium' : 'large'}
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
        variant={forceMobile ? 'temporary' : 'permanent'}
        open={open}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          width: forceMobile ? drawerWidth : (open ? drawerWidth : 64),
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: forceMobile ? drawerWidth : (open ? drawerWidth : 64),
            overflowX: 'hidden',
            boxSizing: 'border-box',
            ...(forceMobile
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
          <NavMenu collapsed={!open && !forceMobile} />
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
            // Add bottom padding to prevent content from being hidden behind the navigation
            pb: forceMobile ? '88px' : 0, // Increased padding to account for lifted nav
          }}
        >
          {children ?? <Outlet />}
        </Box>
      </Box>
      {forceMobile && (
        <Box sx={{ 
          position: 'fixed', 
          bottom: 12, // Lift up from bottom
          left: 16,
          right: 16,
          zIndex: (theme) => theme.zIndex.appBar,
        }}>
          <BottomNavigation
            showLabels
            value={
              location.pathname === '/' ? '/marketplace' :
              location.pathname.startsWith('/marketplace') ? '/marketplace' :
              location.pathname === '/wallet' ? '/wallet' :
              location.pathname === '/cart' ? '/cart' :
              location.pathname === '/orders' ? '/orders' :
              location.pathname === '/profile' ? '/profile' :
              location.pathname === '/dashboard' ? '/dashboard' :
              '/marketplace'
            }
            onChange={(_e, value) => {
              // navigate to selected route
              navigate(value as string);
            }}
            sx={{
              borderRadius: 3, // Rounded corners on all sides
              boxShadow: 8, // More prominent shadow
              height: 64, // Keep the taller height
              backgroundColor: 'background.paper',
              '& .MuiBottomNavigationAction-root': {
                padding: '6px 0',
                minWidth: 0,
                flex: 1,
              },
              '& .Mui-selected': {
                fontSize: '0.875rem',
              },
            }}
          >
            <BottomNavigationAction 
              label="Home" 
              icon={<HomeIcon />} 
              value="/marketplace"
              onClick={() => navigate('/marketplace')} 
            />
            <BottomNavigationAction 
              label="Cart"
              icon={
                <Badge badgeContent={cartItemCount} color="primary" max={99}>
                  <ShoppingCartIcon />
                </Badge>
              }
              value="/cart"
              onClick={() => navigate('/cart')}
            />
            <BottomNavigationAction label="Orders" icon={<ListAltIcon />} value="/orders" />
            <BottomNavigationAction label="Wallet" icon={<WalletIcon />} value="/wallet" />
            <BottomNavigationAction label="Profile" icon={<PersonIcon />} value="/profile" />
          </BottomNavigation>
        </Box>
      )}
    </Box>
  );
};

export default MainLayout;