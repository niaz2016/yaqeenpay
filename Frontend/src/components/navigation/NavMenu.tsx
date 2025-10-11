// src/components/navigation/NavMenu.tsx
import React from 'react';
import { List, ListItem, ListItemIcon, ListItemText, ListItemButton, Divider, useMediaQuery, useTheme } from '@mui/material';
import { Dashboard as DashboardIcon, AccountCircle as AccountIcon, Payment as PaymentIcon, ShoppingCart as OrderIcon, Store as StoreIcon, LocalShipping as ShippingIcon, Assessment as ReportIcon, VerifiedUser as KycIcon, AdminPanelSettings as AdminIcon, Analytics as AnalyticsIcon, AccountBalance as WithdrawIcon, Inventory as MarketplaceIcon } from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import RoleBasedComponent from '../auth/RoleBasedComponent';
import { useAuth } from '../../context/AuthContext';
import { SELLER_ONLY, ADMIN_ONLY } from '../../types/roles';

interface NavMenuProps {
  collapsed?: boolean;
}

const ShowSellerRegistrationLink: React.FC<{ collapsed?: boolean }> = ({ collapsed = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const showCollapsed = collapsed && !isMobile;
  
  if (!user) return null;

  // Normalize roles which may be strings or objects depending on backend shape
  const rawRoles: any = user.roles || [];
  const roles: string[] = Array.isArray(rawRoles)
    ? rawRoles.map((r: any) => {
        if (!r) return '';
        if (typeof r === 'string') return r.toLowerCase();
        if (typeof r === 'object') return (r.name || r.role || r.type || '').toString().toLowerCase();
        return r.toString().toLowerCase();
      }).filter(Boolean)
    : (typeof rawRoles === 'string' ? rawRoles.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) : []);

  const isSeller = roles.includes('seller');
  const isAdmin = roles.includes('admin');

  const kycStatus = (user.kycStatus || '').toString().toLowerCase();
  // Treat 'verified' and 'rejected' as blocked (user has either been approved or explicitly rejected).
  // Users in 'pending' should still see the registration link so they can view/edit application if desired.
  const blockedStatuses = ['verified', 'rejected'];
  const kycSubmitted = blockedStatuses.includes(kycStatus);

  // Show registration to any authenticated user who is NOT a seller or admin
  // and who hasn't already submitted KYC (pending/verified/rejected).
  if (isSeller || isAdmin || kycSubmitted) return null;

  return (
    <ListItem disablePadding>
      <ListItemButton
        component={RouterLink}
        to="/seller/register"
        onClick={() => {
          // Fallback: ensure navigation occurs even if RouterLink composition misbehaves
          navigate('/seller/register');
        }}
        sx={{ minHeight: 48, justifyContent: showCollapsed ? 'center' : 'initial' }}
      >
        <ListItemIcon sx={{ minWidth: showCollapsed ? 0 : 56 }}>
          <StoreIcon />
        </ListItemIcon>
        {!showCollapsed && <ListItemText primary="Seller Registration" />}
      </ListItemButton>
    </ListItem>
  );
};

const NavMenu: React.FC<NavMenuProps> = ({ collapsed = false }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // On mobile, never show collapsed state (drawer is temporary)
  // On desktop, respect the collapsed prop
  const showCollapsed = collapsed && !isMobile;
  
  return (
    <List component="nav">
      <ListItem disablePadding>
        <ListItemButton 
          component={RouterLink} 
          to="/dashboard"
          sx={{ minHeight: 48, justifyContent: showCollapsed ? 'center' : 'initial' }}
        >
          <ListItemIcon sx={{ minWidth: showCollapsed ? 0 : 56 }}>
            <DashboardIcon />
          </ListItemIcon>
          {!showCollapsed && <ListItemText primary="Dashboard" />}
        </ListItemButton>
      </ListItem>

      <ListItem disablePadding>
        <ListItemButton 
          component={RouterLink} 
          to="/profile"
          sx={{ minHeight: 48, justifyContent: showCollapsed ? 'center' : 'initial' }}
        >
          <ListItemIcon sx={{ minWidth: showCollapsed ? 0 : 56 }}>
            <AccountIcon />
          </ListItemIcon>
          {!showCollapsed && <ListItemText primary="My Profile" />}
        </ListItemButton>
      </ListItem>

      <Divider sx={{ my: 1 }} />

      <ListItem disablePadding>
        <ListItemButton 
          component={RouterLink} 
          to="/wallet"
          sx={{ minHeight: 48, justifyContent: showCollapsed ? 'center' : 'initial' }}
        >
          <ListItemIcon sx={{ minWidth: showCollapsed ? 0 : 56 }}>
            <PaymentIcon />
          </ListItemIcon>
          {!showCollapsed && <ListItemText primary="My Wallet" />}
        </ListItemButton>
      </ListItem>

      <ListItem disablePadding>
        <ListItemButton 
          component={RouterLink} 
          to="/withdrawals"
          sx={{ minHeight: 48, justifyContent: showCollapsed ? 'center' : 'initial' }}
        >
          <ListItemIcon sx={{ minWidth: showCollapsed ? 0 : 56 }}>
            <WithdrawIcon />
          </ListItemIcon>
          {!showCollapsed && <ListItemText primary="Withdrawals" />}
        </ListItemButton>
      </ListItem>

      <ListItem disablePadding>
        <ListItemButton 
          component={RouterLink} 
          to="/orders"
          sx={{ minHeight: 48, justifyContent: showCollapsed ? 'center' : 'initial' }}
        >
          <ListItemIcon sx={{ minWidth: showCollapsed ? 0 : 56 }}>
            <OrderIcon />
          </ListItemIcon>
          {!showCollapsed && <ListItemText primary="My Orders" />}
        </ListItemButton>
      </ListItem>

      <ListItem disablePadding>
        <ListItemButton 
          component={RouterLink} 
          to="/orders/new"
          sx={{ minHeight: 48, justifyContent: showCollapsed ? 'center' : 'initial' }}
        >
          <ListItemIcon sx={{ minWidth: showCollapsed ? 0 : 56 }}>
            <OrderIcon />
          </ListItemIcon>
          {!showCollapsed && <ListItemText primary="Create Order" />}
        </ListItemButton>
      </ListItem>

      <ListItem disablePadding>
        <ListItemButton 
          component={RouterLink} 
          to="/marketplace"
          sx={{ minHeight: 48, justifyContent: showCollapsed ? 'center' : 'initial' }}
        >
          <ListItemIcon sx={{ minWidth: showCollapsed ? 0 : 56 }}>
            <MarketplaceIcon />
          </ListItemIcon>
          {!showCollapsed && <ListItemText primary="Marketplace" />}
        </ListItemButton>
      </ListItem>

      <Divider sx={{ my: 1 }} />

      <ShowSellerRegistrationLink collapsed={showCollapsed} />

      <RoleBasedComponent roleAccess={SELLER_ONLY}>
        <>
          <ListItem disablePadding>
            <ListItemButton 
              component={RouterLink} 
              to="/seller/marketplace"
              sx={{ minHeight: 48, justifyContent: showCollapsed ? 'center' : 'initial' }}
            >
              <ListItemIcon sx={{ minWidth: showCollapsed ? 0 : 56 }}>
                <MarketplaceIcon />
              </ListItemIcon>
              {!showCollapsed && <ListItemText primary="My Products" />}
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton 
              component={RouterLink} 
              to="/seller/orders"
              sx={{ minHeight: 48, justifyContent: showCollapsed ? 'center' : 'initial' }}
            >
              <ListItemIcon sx={{ minWidth: showCollapsed ? 0 : 56 }}>
                <ShippingIcon />
              </ListItemIcon>
              {!showCollapsed && <ListItemText primary="Seller Orders" />}
            </ListItemButton>
          </ListItem>

        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to="/seller/analytics">
            <ListItemIcon><AnalyticsIcon /></ListItemIcon>
            <ListItemText primary="Analytics" />
          </ListItemButton>
        </ListItem>
      </>
    </RoleBasedComponent>

    <RoleBasedComponent roleAccess={ADMIN_ONLY}>
      <>
        <Divider sx={{ my: 1 }} />

        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to="/admin">
            <ListItemIcon><AdminIcon /></ListItemIcon>
            <ListItemText primary="Admin Dashboard" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to="/admin/users">
            <ListItemIcon><AdminIcon /></ListItemIcon>
            <ListItemText primary="User Management" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to="/admin/kyc">
            <ListItemIcon><KycIcon /></ListItemIcon>
            <ListItemText primary="KYC Verification" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to="/admin/sellers">
            <ListItemIcon><StoreIcon /></ListItemIcon>
            <ListItemText primary="Seller Approval" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to="/admin/orders">
            <ListItemIcon><ReportIcon /></ListItemIcon>
            <ListItemText primary="Order Monitoring" />
          </ListItemButton>
        </ListItem>
      </>
    </RoleBasedComponent>
  </List>
  );
};

export default NavMenu;
