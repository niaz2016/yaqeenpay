// src/components/auth/ProtectedRoute.tsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: string[];
  redirectPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles = [],
  redirectPath = '/auth/login',
}) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Show loading state
  if (loading) {
    // You could replace this with a loading spinner
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div className="spinner" style={{
        width: 40,
        height: 40,
        border: '4px solid #ccc',
        borderTop: '4px solid #007bff',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <style>
        {`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        `}
      </style>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated || !user) {
    // Save the intended location for redirection after login
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // If route restricts roles, verify user has one of the allowed roles (case-insensitive)
  if (allowedRoles.length > 0) {
    const userRoles = (user.roles || []).map(r => r.toLowerCase());
    const required = allowedRoles.map(r => r.toLowerCase());

    // grant access if any match
    const hasMatch = userRoles.some(r => required.includes(r));

    if (!hasMatch) {
      // Optional: temp allowances for admin/test accounts can be added here if needed
      return <Navigate to={"/unauthorized"} replace />;
    }
  }

  // If authenticated (and authorized if roles required), render the protected content
  return <Outlet />;
};

export default ProtectedRoute;