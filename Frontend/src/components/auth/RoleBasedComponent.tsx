// src/components/auth/RoleBasedComponent.tsx
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import type { RoleAccess } from '../../types/roles';

interface RoleBasedComponentProps {
  roleAccess: RoleAccess;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const RoleBasedComponent: React.FC<RoleBasedComponentProps> = ({
  roleAccess,
  children,
  fallback = null,
}) => {
  const { user } = useAuth();
  
  // If no user is logged in, show fallback
  if (!user) {
    return <>{fallback}</>;
  }
  
  // Check if user has any of the allowed roles
  const hasAccess = user.roles.some((role) => {
    const normalizedRole = role.toLowerCase();
    // Check against all possible role keys
    return (normalizedRole === 'admin' && roleAccess.admin) ||
           (normalizedRole === 'seller' && roleAccess.seller) ||
           (normalizedRole === 'buyer' && roleAccess.buyer);
  });
  
  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

export default RoleBasedComponent;