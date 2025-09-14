// src/components/navigation/NavMenu.tsx
import React from 'react';
import { 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  ListItemButton,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  AccountCircle as AccountIcon,
  Payment as PaymentIcon,
  ShoppingCart as OrderIcon,
  Store as StoreIcon,
  LocalShipping as ShippingIcon,
  Assessment as ReportIcon,
  VerifiedUser as KycIcon,
  AdminPanelSettings as AdminIcon,
  Analytics as AnalyticsIcon,
  AccountBalance as WithdrawIcon,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import RoleBasedComponent from '../auth/RoleBasedComponent';
import { 
  SELLER_ONLY, 
  ADMIN_ONLY,
} from '../../types/roles';

const NavMenu: React.FC = () => {
  return (
    <List component="nav">
      {/* All users see Dashboard and Profile */}
      <ListItem disablePadding>
        <ListItemButton component={RouterLink} to="/dashboard">
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItemButton>
      </ListItem>

      <ListItem disablePadding>
        <ListItemButton component={RouterLink} to="/profile">
          <ListItemIcon>
            <AccountIcon />
          </ListItemIcon>
          <ListItemText primary="My Profile" />
        </ListItemButton>
      </ListItem>

      <Divider sx={{ my: 1 }} />

      {/* Wallet - Accessible to all users */}
      <ListItem disablePadding>
        <ListItemButton component={RouterLink} to="/wallet">
          <ListItemIcon>
            <PaymentIcon />
          </ListItemIcon>
          <ListItemText primary="My Wallet" />
        </ListItemButton>
      </ListItem>

      {/* Withdrawals - Accessible to all users */}
      <ListItem disablePadding>
        <ListItemButton component={RouterLink} to="/withdrawals">
          <ListItemIcon>
            <WithdrawIcon />
          </ListItemIcon>
          <ListItemText primary="Withdrawals" />
        </ListItemButton>
      </ListItem>

      {/* Orders - Temporarily accessible to all users for testing */}
      <ListItem disablePadding>
        <ListItemButton component={RouterLink} to="/orders">
          <ListItemIcon>
            <OrderIcon />
          </ListItemIcon>
          <ListItemText primary="My Orders" />
        </ListItemButton>
      </ListItem>

      <ListItem disablePadding>
        <ListItemButton component={RouterLink} to="/orders/new">
          <ListItemIcon>
            <OrderIcon />
          </ListItemIcon>
          <ListItemText primary="Create Order" />
        </ListItemButton>
      </ListItem>

      <Divider sx={{ my: 1 }} />

      {/* Seller specific menu items */}
      <RoleBasedComponent roleAccess={SELLER_ONLY}>
        <>
          <ListItem disablePadding>
            <ListItemButton component={RouterLink} to="/seller/register">
              <ListItemIcon>
                <StoreIcon />
              </ListItemIcon>
              <ListItemText primary="Seller Registration" />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton component={RouterLink} to="/seller/orders">
              <ListItemIcon>
                <ShippingIcon />
              </ListItemIcon>
              <ListItemText primary="Seller Orders" />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton component={RouterLink} to="/seller/analytics">
              <ListItemIcon>
                <AnalyticsIcon />
              </ListItemIcon>
              <ListItemText primary="Analytics" />
            </ListItemButton>
          </ListItem>
        </>
      </RoleBasedComponent>

      {/* Admin specific menu items */}
      <RoleBasedComponent roleAccess={ADMIN_ONLY}>
        <>
          <Divider sx={{ my: 1 }} />
          
          <ListItem disablePadding>
            <ListItemButton component={RouterLink} to="/admin">
              <ListItemIcon>
                <AdminIcon />
              </ListItemIcon>
              <ListItemText primary="Admin Dashboard" />
            </ListItemButton>
          </ListItem>
          
          <ListItem disablePadding>
            <ListItemButton component={RouterLink} to="/admin/users">
              <ListItemIcon>
                <AdminIcon />
              </ListItemIcon>
              <ListItemText primary="User Management" />
            </ListItemButton>
          </ListItem>
          
          <ListItem disablePadding>
            <ListItemButton component={RouterLink} to="/admin/kyc">
              <ListItemIcon>
                <KycIcon />
              </ListItemIcon>
              <ListItemText primary="KYC Verification" />
            </ListItemButton>
          </ListItem>
          
          <ListItem disablePadding>
            <ListItemButton component={RouterLink} to="/admin/sellers">
              <ListItemIcon>
                <StoreIcon />
              </ListItemIcon>
              <ListItemText primary="Seller Approval" />
            </ListItemButton>
          </ListItem>
          
          <ListItem disablePadding>
            <ListItemButton component={RouterLink} to="/admin/orders">
              <ListItemIcon>
                <ReportIcon />
              </ListItemIcon>
              <ListItemText primary="Order Monitoring" />
            </ListItemButton>
          </ListItem>
        </>
      </RoleBasedComponent>
    </List>
  );
};

export default NavMenu;