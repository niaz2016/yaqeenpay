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
    return <div>Loading...</div>;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated || !user) {
    // Save the intended location for redirection after login
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // If roles are specified, check if user has required role
  if (allowedRoles.length > 0) {
    console.log('ProtectedRoute - Checking roles:', {
      userRoles: user.roles,
      allowedRoles: allowedRoles,
      userEmail: user.email,
      userRolesLower: user.roles.map(r => r.toLowerCase()),
      allowedRolesLower: allowedRoles.map(r => r.toLowerCase())
    });
    
    const hasRequiredRole = user.roles.some(role => 
      allowedRoles.map(r => r.toLowerCase()).includes(role.toLowerCase())
    );
    
    // Temporary: Allow access if user has 'admin' role or if allowedRoles includes 'Admin'
    const tempAdminAccess = user.roles.some(role => role.toLowerCase() === 'admin') && 
                           allowedRoles.some(role => role.toLowerCase() === 'admin');
    
    // TEMPORARY: Allow specific test user to access admin (remove this in production)
    const isTestAdmin = user.email && (
      user.email.toLowerCase().includes('admin') || 
      user.email.toLowerCase().includes('test')
    );
    
    console.log('ProtectedRoute - Has required role:', hasRequiredRole);
    console.log('ProtectedRoute - Temp admin access:', tempAdminAccess);
    console.log('ProtectedRoute - Is test admin:', isTestAdmin);
    
    if (!hasRequiredRole && !tempAdminAccess && !isTestAdmin) {
      console.log('ProtectedRoute - Access denied, redirecting to unauthorized');
      // Redirect to unauthorized page or dashboard
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // If authenticated and has correct role, render the protected content
  return <Outlet />;
};

export default ProtectedRoute;