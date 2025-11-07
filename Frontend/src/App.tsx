import React, { lazy } from 'react';

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ErrorProvider } from './context/ErrorContext';
import { WishlistProvider } from './context/WishlistContext';
import { AppInitializer } from './components/AppInitializer';

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
import VerifyEmailPage from './pages/auth/VerifyEmailPage';

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
import SellerProductAnalyticsPage from './pages/seller/SellerProductAnalyticsPage';
import SellerProductsPage from './pages/seller/SellerProductsPage';
import NewProductPage from './pages/seller/NewProductPage';
import EditProductPage from './pages/seller/EditProductPage';
// General Pages
import MarketplacePage from './pages/MarketplacePage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import WithdrawalsPage from './pages/WithdrawalsPage.tsx';
import NotificationsPage from './pages/notifications/NotificationsPage';
import MarketplaceAccessRoute from './routes/MarketplaceAccessRoute';

// Admin Pages (Phase 6) - Lazy loaded for code splitting
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const KycVerification = lazy(() => import('./pages/admin/KycVerification'));
const SellerApproval = lazy(() => import('./pages/admin/SellerApproval'));
const OrderMonitoring = lazy(() => import('./pages/admin/OrderMonitoring'));
const AdminWithdrawals = lazy(() => import('./pages/admin/AdminWithdrawals'));
const AdminProfilePage = lazy(() => import('./pages/admin/AdminProfilePage'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const EmailManagement = lazy(() => import('./pages/admin/EmailManagement'));
const AdminAnalyticsPage = lazy(() => import('./pages/admin/AdminAnalyticsPage'));

// Error Pages
import NotFoundPage from './pages/NotFoundPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

// Protected Route Component
import ProtectedRoute from './components/auth/ProtectedRoute';
import Privacy from './pages/Privacy.tsx';
import WalletPage from './pages/wallet/WalletPage.tsx';
import NotificationSentToaster from './components/notifications/NotificationSentToaster';
import PwaInstallPrompt from './components/common/PwaInstallPrompt';
import SuspenseLoader from './components/common/SuspenseLoader';


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
  const routerBase = getRouterBase();
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorProvider>
        <AppInitializer>
          <AuthProvider>
            <NotificationProvider>
              <WishlistProvider>
                <BrowserRouter basename={routerBase}>
          <Routes>
            {/* Landing page without layout */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Public routes with AuthLayout */}
            <Route element={<AuthLayout />}>
              <Route path="/auth/login" element={<LoginPage />} />
              <Route path="/auth/register" element={<RegisterPage />} />
              <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
              <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
              <Route path="/auth/verify-otp" element={<VerifyOtpPage />} />
              <Route path="/auth/verify-phone" element={<VerifyOtpPage />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              
              {/* Debug routes removed */}
            </Route>

              {/* Public marketplace routes */}
              <Route
                path="/marketplace"
                element={
                  <MarketplaceAccessRoute>
                    <MarketplacePage />
                  </MarketplaceAccessRoute>
                }
              />
              <Route
                path="/products/:id/:slug?"
                element={
                  <MarketplaceAccessRoute>
                    <ProductDetailPage />
                  </MarketplaceAccessRoute>
                }
              />
              <Route
                path="/cart"
                element={
                  <MarketplaceAccessRoute>
                    <CartPage />
                  </MarketplaceAccessRoute>
                }
              />

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
                
                {/* Seller Dashboard */}
                <Route path="/seller/register" element={<UserRegistrationPage />} />
                <Route path="/seller/marketplace" element={<SellerProductsPage />} />
                <Route path="/seller/products" element={<SellerProductsPage />} />
                <Route path="/seller/products/new" element={<NewProductPage />} />
                <Route path="/seller/products/:productId/edit" element={<EditProductPage />} />
                <Route path="/seller/orders" element={<UserOrdersPage />} />
                <Route path="/seller/orders/:orderId" element={<UserOrderDetailsPage />} />
                <Route path="/seller/analytics" element={<SellerProductAnalyticsPage />} />
                <Route path="/seller/withdrawals" element={<WithdrawalsPage />} />
                
                {/* Error pages */}
                <Route path="/unauthorized" element={<UnauthorizedPage />} />
              </Route>
            </Route>

            {/* Admin routes with AdminLayout - Code Split with Suspense */}
            <Route element={<ProtectedRoute allowedRoles={["Admin", "admin"]} />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={
                  <React.Suspense fallback={<SuspenseLoader message="Loading Admin Dashboard..." />}>
                    <AdminDashboard />
                  </React.Suspense>
                } />
                <Route path="/admin/profile" element={
                  <React.Suspense fallback={<SuspenseLoader message="Loading Profile..." />}>
                    <AdminProfilePage />
                  </React.Suspense>
                } />
                <Route path="/admin/users" element={
                  <React.Suspense fallback={<SuspenseLoader message="Loading User Management..." />}>
                    <UserManagement />
                  </React.Suspense>
                } />
                <Route path="/admin/kyc" element={
                  <React.Suspense fallback={<SuspenseLoader message="Loading KYC Verification..." />}>
                    <KycVerification />
                  </React.Suspense>
                } />
                <Route path="/admin/sellers" element={
                  <React.Suspense fallback={<SuspenseLoader message="Loading Seller Approval..." />}>
                    <SellerApproval />
                  </React.Suspense>
                } />
                <Route path="/admin/orders" element={
                  <React.Suspense fallback={<SuspenseLoader message="Loading Order Monitoring..." />}>
                    <OrderMonitoring />
                  </React.Suspense>
                } />
                <Route path="/admin/withdrawals" element={
                  <React.Suspense fallback={<SuspenseLoader message="Loading Withdrawals..." />}>
                    <AdminWithdrawals />
                  </React.Suspense>
                } />
                <Route path="/admin/settings" element={
                  <React.Suspense fallback={<SuspenseLoader message="Loading Settings..." />}>
                    <AdminSettings />
                  </React.Suspense>
                } />
                <Route path="/admin/email" element={
                  <React.Suspense fallback={<SuspenseLoader message="Loading Email Management..." />}>
                    <EmailManagement />
                  </React.Suspense>
                } />
                <Route path="/admin/analytics" element={
                  <React.Suspense fallback={<SuspenseLoader message="Loading Analytics..." />}>
                    <AdminAnalyticsPage />
                  </React.Suspense>
                } />
              </Route>
            </Route>

            {/* Catch-all for unknown routes */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          
          {/* Debug panel removed */}
          <NotificationSentToaster />
          <PwaInstallPrompt position="bottom" />
          </BrowserRouter>
        </WishlistProvider>
        </NotificationProvider>
      </AuthProvider>
      </AppInitializer>
      </ErrorProvider>
    </ThemeProvider>
  );
};

export default App;

function getRouterBase(): string {
  const raw = (import.meta.env.VITE_BASE_PATH as string | undefined) ?? '/';
  if (!raw || raw === '/') {
    return '/';
  }

  const trimmed = raw.trim().replace(/\/+$/, '');
  
  // For Capacitor mobile apps, use root path
  if (trimmed === '.' || trimmed === './') {
    return '/';
  }
  
  const withLeading = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withLeading || '/';
}
