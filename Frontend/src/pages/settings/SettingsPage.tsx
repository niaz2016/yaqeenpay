import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  useTheme,
  useMediaQuery,
  Drawer,
  IconButton,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  AccountCircle as AccountIcon,
  Security as SecurityIcon,
  Notifications as NotificationIcon,
  Payment as PaymentIcon,
  Business as BusinessIcon,
  Palette as AppearanceIcon,
  Api as IntegrationIcon,
  Menu as MenuIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SettingsProvider } from '../../context/SettingsContext';

// Settings components (to be created)
import AccountSettings from './sections/AccountSettings';
import SecuritySettings from './sections/SecuritySettings';
import NotificationSettings from './sections/NotificationSettings';
import PaymentSettings from './sections/PaymentSettings';
import BusinessSettings from './sections/BusinessSettings';
import AppearanceSettings from './sections/AppearanceSettings';
import IntegrationSettings from './sections/IntegrationSettings';

interface SettingsSection {
  id: string;
  title: string;
  icon: React.ReactElement;
  component: React.ComponentType;
  description: string;
  requiresRole?: string[];
}

const settingsSections: SettingsSection[] = [
  {
    id: 'account',
    title: 'Account',
    icon: <AccountIcon />,
    component: AccountSettings,
    description: 'Manage your profile and account preferences',
  },
  {
    id: 'security',
    title: 'Security & Privacy',
    icon: <SecurityIcon />,
    component: SecuritySettings,
    description: 'Password, 2FA, and privacy settings',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: <NotificationIcon />,
    component: NotificationSettings,
    description: 'Email, SMS, and push notification preferences',
  },
  {
    id: 'payments',
    title: 'Payments',
    icon: <PaymentIcon />,
    component: PaymentSettings,
    description: 'Payment methods and financial settings',
  },
  {
    id: 'business',
    title: 'Business',
    icon: <BusinessIcon />,
    component: BusinessSettings,
    description: 'Seller-specific business settings',
    requiresRole: ['seller', 'Seller'],
  },
  {
    id: 'appearance',
    title: 'Appearance',
    icon: <AppearanceIcon />,
    component: AppearanceSettings,
    description: 'Theme, language, and accessibility options',
  },
  {
    id: 'integrations',
    title: 'Integrations',
    icon: <IntegrationIcon />,
    component: IntegrationSettings,
    description: 'API keys, webhooks, and connected apps',
  },
];

const drawerWidth = 280;

const SettingsPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { section = 'account' } = useParams<{ section: string }>();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSectionChange = (sectionId: string) => {
    navigate(`/settings/${sectionId}`);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  const userRoles = user?.roles || [];
  const normalizedRoles = Array.isArray(userRoles) 
    ? userRoles.map((role: any) => typeof role === 'string' ? role : role?.name || '').filter(Boolean)
    : [];

  // Filter sections based on user roles
  const availableSections = settingsSections.filter(settingsSection => {
    if (!settingsSection.requiresRole) return true;
    return settingsSection.requiresRole.some(requiredRole => 
      normalizedRoles.includes(requiredRole)
    );
  });

  const currentSection = availableSections.find(s => s.id === section) || availableSections[0];
  const CurrentComponent = currentSection.component;

  const drawer = (
    <Box sx={{ height: '100%' }}>
      <Box sx={{ p: 0, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Settings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage your account preferences
        </Typography>
      </Box>
      
      <List sx={{ pt: 1 }}>
        {availableSections.map((settingsSection) => (
          <ListItem key={settingsSection.id} disablePadding>
            <ListItemButton
              selected={section === settingsSection.id}
              onClick={() => handleSectionChange(settingsSection.id)}
              sx={{
                mx: 1,
                mb: 0.5,
                borderRadius: 1,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'primary.contrastText',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {settingsSection.icon}
              </ListItemIcon>
              <ListItemText 
                primary={settingsSection.title}
                secondary={!isMobile ? settingsSection.description : undefined}
                secondaryTypographyProps={{
                  sx: { fontSize: '0.75rem', opacity: 0.8 }
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <SettingsProvider>
      <Box sx={{ display: 'flex', height: '100vh' }}>
        {/* Mobile App Bar */}
        {isMobile && (
          <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
            <Toolbar>
              <IconButton
                color="inherit"
                aria-label="back"
                edge="start"
                onClick={handleBack}
                sx={{ mr: 2 }}
              >
                <BackIcon />
              </IconButton>
              <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                {currentSection.title}
              </Typography>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="end"
                onClick={handleDrawerToggle}
              >
                <MenuIcon />
              </IconButton>
            </Toolbar>
          </AppBar>
        )}

        {/* Navigation Drawer */}
        <Box
          component="nav"
          sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        >
          {isMobile ? (
            <Drawer
              variant="temporary"
              anchor="right"
              open={mobileOpen}
              onClose={handleDrawerToggle}
              ModalProps={{ keepMounted: true }}
              sx={{
                '& .MuiDrawer-paper': {
                  boxSizing: 'border-box',
                  width: drawerWidth,
                  top: 64, // Below app bar
                },
              }}
            >
              {drawer}
            </Drawer>
          ) : (
            <Drawer
              variant="permanent"
              sx={{
                '& .MuiDrawer-paper': {
                  boxSizing: 'border-box',
                  width: drawerWidth,
                  borderRight: '1px solid',
                  borderColor: 'divider',
                },
              }}
            >
              {drawer}
            </Drawer>
          )}
        </Box>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: { md: `calc(100% - ${drawerWidth}px)` },
            mt: { xs: 8, md: 0 }, // Account for mobile app bar
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Container maxWidth="lg" sx={{ flex: 1, py: 3 }}>
            {/* Desktop Header */}
            {!isMobile && (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <IconButton onClick={handleBack} sx={{ mr: 1 }}>
                    <BackIcon />
                  </IconButton>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {currentSection.title}
                  </Typography>
                </Box>
                <Typography variant="body1" color="text.secondary">
                  {currentSection.description}
                </Typography>
                <Divider sx={{ mt: 2 }} />
              </Box>
            )}

            {/* Settings Content */}
            <Paper elevation={1} sx={{ flex: 1, overflow: 'auto' }}>
              <Box sx={{ p: { xs: 2, md: 3 } }}>
                <CurrentComponent />
              </Box>
            </Paper>
          </Container>
        </Box>
      </Box>
    </SettingsProvider>
  );
};

export default SettingsPage;