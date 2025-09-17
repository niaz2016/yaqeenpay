// src/components/navigation/NavMenu.tsx
import React from 'react';
import { List, ListItem, ListItemIcon, ListItemText, ListItemButton, Divider } from '@mui/material';
import { Dashboard as DashboardIcon, AccountCircle as AccountIcon, Payment as PaymentIcon, ShoppingCart as OrderIcon, Store as StoreIcon, LocalShipping as ShippingIcon, Assessment as ReportIcon, VerifiedUser as KycIcon, AdminPanelSettings as AdminIcon, Analytics as AnalyticsIcon, AccountBalance as WithdrawIcon } from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import RoleBasedComponent from '../auth/RoleBasedComponent';
import { useAuth } from '../../context/AuthContext';
import { SELLER_ONLY, ADMIN_ONLY } from '../../types/roles';

const ShowSellerRegistrationLink: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  // DEBUG: Log user shape to help diagnose missing registration link
  // (remove this log after verifying in browser console)
  // eslint-disable-next-line no-console
  console.log('NavMenu - user debug', {
    id: user.id,
    email: user.email,
    roles: user.roles,
    kycStatus: user.kycStatus,
  });

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
      >
        <ListItemIcon><StoreIcon /></ListItemIcon>
        <ListItemText primary="Seller Registration" />
      </ListItemButton>
    </ListItem>
  );
};

const NavMenu: React.FC = () => (
  <List component="nav">
    <ListItem disablePadding>
      <ListItemButton component={RouterLink} to="/dashboard">
        <ListItemIcon><DashboardIcon /></ListItemIcon>
        <ListItemText primary="Dashboard" />
      </ListItemButton>
    </ListItem>

    <ListItem disablePadding>
      <ListItemButton component={RouterLink} to="/profile">
        <ListItemIcon><AccountIcon /></ListItemIcon>
        <ListItemText primary="My Profile" />
      </ListItemButton>
    </ListItem>

    <Divider sx={{ my: 1 }} />

    <ListItem disablePadding>
      <ListItemButton component={RouterLink} to="/wallet">
        <ListItemIcon><PaymentIcon /></ListItemIcon>
        <ListItemText primary="My Wallet" />
      </ListItemButton>
    </ListItem>

    <ListItem disablePadding>
      <ListItemButton component={RouterLink} to="/withdrawals">
        <ListItemIcon><WithdrawIcon /></ListItemIcon>
        <ListItemText primary="Withdrawals" />
      </ListItemButton>
    </ListItem>

    <ListItem disablePadding>
      <ListItemButton component={RouterLink} to="/orders">
        <ListItemIcon><OrderIcon /></ListItemIcon>
        <ListItemText primary="My Orders" />
      </ListItemButton>
    </ListItem>

    <ListItem disablePadding>
      <ListItemButton component={RouterLink} to="/orders/new">
        <ListItemIcon><OrderIcon /></ListItemIcon>
        <ListItemText primary="Create Order" />
      </ListItemButton>
    </ListItem>

    <Divider sx={{ my: 1 }} />

    <ShowSellerRegistrationLink />

    <RoleBasedComponent roleAccess={SELLER_ONLY}>
      <>
        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to="/seller/orders">
            <ListItemIcon><ShippingIcon /></ListItemIcon>
            <ListItemText primary="Seller Orders" />
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

export default NavMenu;
