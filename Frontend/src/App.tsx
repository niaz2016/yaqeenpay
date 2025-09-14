import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { AuthProvider } from './context/AuthContext';

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

// Protected Pages
import DashboardPage from './pages/dashboard/DashboardPage';
import ProfilePage from './pages/profile/ProfilePage';
import WalletPage from './pages/wallet/WalletPage';
// Orders (Phase 3)
import OrderListPage from './pages/orders/OrderListPage';
import NewOrderPage from './pages/orders/NewOrderPage';
import OrderDetailsPage from './pages/orders/OrderDetailsPage';

// Seller Pages (Phase 4)
import SellerRegistrationPage from './pages/seller/SellerRegistrationPage';
import SellerOrdersPage from './pages/seller/SellerOrdersPage';
import SellerOrderDetailsPage from './pages/seller/SellerOrderDetailsPage';
import SellerAnalyticsPage from './pages/seller/SellerAnalyticsPage';
import SellerWithdrawalsPage from './pages/seller/SellerWithdrawalsPage';

// Admin Pages (Phase 6)
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import KycVerification from './pages/admin/KycVerification';
import SellerApproval from './pages/admin/SellerApproval';
import OrderMonitoring from './pages/admin/OrderMonitoring';

// Error Pages
import NotFoundPage from './pages/NotFoundPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

// Protected Route Component
import ProtectedRoute from './components/auth/ProtectedRoute';


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
        <BrowserRouter>
          <Routes>
            {/* Public routes with AuthLayout */}
            <Route element={<AuthLayout />}>
              <Route path="/" element={<Navigate to="/auth/login" />} />
              <Route path="/auth/login" element={<LoginPage />} />
              <Route path="/auth/register" element={<RegisterPage />} />
              <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
              <Route path="/auth/verify-email" element={<VerifyOtpPage />} />
              
              {/* Debug routes removed */}
            </Route>

            {/* Protected routes with MainLayout */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/wallet" element={<WalletPage />} />
                {/* Orders */}
                <Route path="/orders" element={<OrderListPage />} />
                <Route path="/orders/new" element={<NewOrderPage />} />
                <Route path="/orders/:orderId" element={<OrderDetailsPage />} />
                
                {/* Seller Dashboard */}
                <Route path="/seller/register" element={<SellerRegistrationPage />} />
                <Route path="/seller/orders" element={<SellerOrdersPage />} />
                <Route path="/seller/orders/:orderId" element={<SellerOrderDetailsPage />} />
                <Route path="/seller/analytics" element={<SellerAnalyticsPage />} />
                <Route path="/seller/withdrawals" element={<SellerWithdrawalsPage />} />
                
                {/* Error pages */}
                <Route path="/unauthorized" element={<UnauthorizedPage />} />
              </Route>
            </Route>

            {/* Admin routes with AdminLayout */}
            <Route element={<ProtectedRoute allowedRoles={["Admin", "admin"]} />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<UserManagement />} />
                <Route path="/admin/kyc" element={<KycVerification />} />
                <Route path="/admin/sellers" element={<SellerApproval />} />
                <Route path="/admin/orders" element={<OrderMonitoring />} />
              </Route>
            </Route>

            {/* Catch-all for unknown routes */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          
          {/* Debug panel removed */}
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
