import React from 'react';

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import AdminLayout from './layouts/AdminLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import VerifyOtpPage from './pages/auth/VerifyOtpPage';

// Public Pages
import LandingPage from './pages/landing/LandingPage';
import Terms from './pages/Terms.tsx';

// Protected Pages
import DashboardPage from './pages/dashboard/DashboardPage';
import ProfilePage from './pages/profile/ProfilePage';
import SettingsPage from './pages/settings/SettingsPage';
// Orders (Phase 3)
import OrderListPage from './pages/orders/OrderListPage';
import NewOrderPage from './pages/orders/NewOrderPage';
import OrderDetailsPage from './pages/orders/OrderDetailsPage';

// Seller Pages (Phase 4)
import UserRegistrationPage from './pages/seller/SellerRegistrationPage';
import UserOrdersPage from './pages/seller/SellerOrdersPage';
import UserOrderDetailsPage from './pages/seller/SellerOrderDetailsPage';
import UserAnalyticsPage from './pages/seller/SellerAnalyticsPage';
import SellerProductsPage from './pages/seller/SellerProductsPage';
import NewProductPage from './pages/seller/NewProductPage';
import EditProductPage from './pages/seller/EditProductPage';
// General Pages
import MarketplacePage from './pages/MarketplacePage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import WithdrawalsPage from './pages/WithdrawalsPage.tsx';
import NotificationsPage from './pages/notifications/NotificationsPage';
// Admin Pages (Phase 6)
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import KycVerification from './pages/admin/KycVerification';
import SellerApproval from './pages/admin/SellerApproval';
import OrderMonitoring from './pages/admin/OrderMonitoring';
import AdminWithdrawals from './pages/admin/AdminWithdrawals';
import AdminProfilePage from './pages/admin/AdminProfilePage';
import AdminSettings from './pages/admin/AdminSettings';

// Error Pages
import NotFoundPage from './pages/NotFoundPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

// Protected Route Component
import ProtectedRoute from './components/auth/ProtectedRoute';
import Privacy from './pages/Privacy.tsx';
import WalletPage from './pages/wallet/WalletPage.tsx';
import NotificationSentToaster from './components/notifications/NotificationSentToaster';


// Theme configuration
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

// No debug UI in production or development

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
          <Routes>
            {/* Landing page without layout */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Public routes with AuthLayout */}
            <Route element={<AuthLayout />}>
              <Route path="/auth/login" element={<LoginPage />} />
              <Route path="/auth/register" element={<RegisterPage />} />
              <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
              <Route path="/auth/verify-email" element={<VerifyOtpPage />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              
              {/* Debug routes removed */}
            </Route>

            {/* Protected routes with MainLayout */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/settings/:section" element={<SettingsPage />} />
                <Route path="/wallet" element={<WalletPage />} />
                <Route path="/withdrawals" element={<WithdrawalsPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                {/* Orders */}
                <Route path="/orders" element={<OrderListPage />} />
                <Route path="/orders/new" element={<NewOrderPage />} />
                <Route path="/orders/:orderId" element={<OrderDetailsPage />} />
                
                {/* Marketplace */}
                <Route path="/marketplace" element={<MarketplacePage />} />
                <Route path="/products/:id" element={<ProductDetailPage />} />
                <Route path="/cart" element={<CartPage />} />
                
                {/* Seller Dashboard */}
                <Route path="/seller/register" element={<UserRegistrationPage />} />
                <Route path="/seller/marketplace" element={<SellerProductsPage />} />
                <Route path="/seller/products" element={<SellerProductsPage />} />
                <Route path="/seller/products/new" element={<NewProductPage />} />
                <Route path="/seller/products/:productId/edit" element={<EditProductPage />} />
                <Route path="/seller/orders" element={<UserOrdersPage />} />
                <Route path="/seller/orders/:orderId" element={<UserOrderDetailsPage />} />
                <Route path="/seller/analytics" element={<UserAnalyticsPage />} />
                <Route path="/seller/withdrawals" element={<WithdrawalsPage />} />
                
                {/* Error pages */}
                <Route path="/unauthorized" element={<UnauthorizedPage />} />
              </Route>
            </Route>

            {/* Admin routes with AdminLayout */}
            <Route element={<ProtectedRoute allowedRoles={["Admin", "admin"]} />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/profile" element={<AdminProfilePage />} />
                <Route path="/admin/users" element={<UserManagement />} />
                <Route path="/admin/kyc" element={<KycVerification />} />
                <Route path="/admin/sellers" element={<SellerApproval />} />
                <Route path="/admin/orders" element={<OrderMonitoring />} />
                <Route path="/admin/withdrawals" element={<AdminWithdrawals />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
              </Route>
            </Route>

            {/* Catch-all for unknown routes */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          
          {/* Debug panel removed */}
          <NotificationSentToaster />
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
