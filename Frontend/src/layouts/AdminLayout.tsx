import React from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Container,
  useTheme,
  useMediaQuery,
  IconButton,
  Avatar,
  Menu,
  MenuItem
} from '@mui/material';
import {
  People as PeopleIcon,
  VerifiedUser as VerifiedUserIcon,
  Store as StoreIcon,
  ShoppingCart as ShoppingCartIcon,
  Gavel as GavelIcon,
  Settings as SettingsIcon,
  Dashboard as DashboardIcon,
  AccountBalance as WithdrawalsIcon,
  AccountCircle,
  Logout,
  Menu as MenuIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TechTorioLogo from '../components/common/TechTorioLogo';

const drawerWidth = 240;

interface AdminMenuItem {
  text: string;
  icon: React.ReactElement;
  path: string;
}

const menuItems: AdminMenuItem[] = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin' },
  { text: 'Analytics', icon: <AnalyticsIcon />, path: '/admin/analytics' },
  { text: 'User Management', icon: <PeopleIcon />, path: '/admin/users' },
  { text: 'KYC Verification', icon: <VerifiedUserIcon />, path: '/admin/kyc' },
  { text: 'Seller Approval', icon: <StoreIcon />, path: '/admin/sellers' },
  { text: 'Order Monitoring', icon: <ShoppingCartIcon />, path: '/admin/orders' },
  { text: 'Withdrawals', icon: <WithdrawalsIcon />, path: '/admin/withdrawals' },
  { text: 'Dispute Management', icon: <GavelIcon />, path: '/admin/disputes' },
  { text: 'System Settings', icon: <SettingsIcon />, path: '/admin/settings' },
];

interface AdminLayoutProps {
  children?: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
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

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Admin Panel
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}>
            <TechTorioLogo size="small" showText={false} sx={{ '& circle': { fill: '#fff' }, '& rect': { fill: '#1976d2' }, '& circle:last-child': { fill: '#ffa726' } }} />
          </Box>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            YaqeenPay Admin Dashboard
          </Typography>
          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            aria-controls="admin-profile-menu"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
              {user?.firstName?.charAt(0) || 'A'}
            </Avatar>
          </IconButton>
          <Menu
            id="admin-profile-menu"
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={handleProfileMenuClose}>
              <ListItemIcon>
                <AccountCircle fontSize="small" />
              </ListItemIcon>
              <ListItemText>Profile</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => { handleProfileMenuClose(); navigate('/settings'); }}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
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
      
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better mobile performance
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <Container maxWidth="xl">
          {children || <Outlet />}
        </Container>
      </Box>
    </Box>
  );
};

export default AdminLayout;