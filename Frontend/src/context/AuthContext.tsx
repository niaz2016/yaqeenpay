// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useReducer } from 'react';
import type { User, AuthState } from '../types/auth';
import authService from '../services/authService';

// Define context types
interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (formData: any) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

// Initial auth state
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: true,
  error: null,
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Action types
type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User };

// Auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
        loading: false,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    default:
      return state;
  }
};

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Listen for logout events from token expiry or other tabs
  useEffect(() => {
    const handleLogout = () => {
      dispatch({ type: 'LOGOUT' });
    };

    const handleTokensUpdated = () => {
      console.log('Token update detected, refreshing auth state...');
      checkAuth();
    };

    window.addEventListener('auth:logout', handleLogout);
    window.addEventListener('auth:tokens:updated', handleTokensUpdated);
    
    return () => {
      window.removeEventListener('auth:logout', handleLogout);
      window.removeEventListener('auth:tokens:updated', handleTokensUpdated);
    };
  }, []);

  // Shared auth check function
  const checkAuth = async () => {
    try {
      // Check if tokens exist and are valid
      if (authService.isAuthenticated()) {
        try {
          const fetched = await authService.getCurrentUser();
          // Normalize roles to an array of strings for consistent downstream checks
          const normalizeRoles = (rawRoles: any): string[] => {
            if (!rawRoles) return [];
            if (Array.isArray(rawRoles)) {
              return rawRoles.map((r: any) => {
                if (!r) return '';
                if (typeof r === 'string') return r;
                if (typeof r === 'object') return (r.name || r.role || r.type || '').toString();
                return r.toString();
              }).filter(Boolean);
            }
            if (typeof rawRoles === 'string') {
              return rawRoles.split(',').map(s => s.trim()).filter(Boolean);
            }
            return [];
          };

          const user = {
            ...fetched,
            // Only consider 'seller' role active if user's KYC status is approved/verified.
            // This prevents the frontend from granting seller UI/privileges before admin approval.
            roles: (() => {
              const raw = normalizeRoles((fetched as any).roles);
              const kyc = ((fetched as any).kycStatus || '').toString().toLowerCase();
              const kycApproved = kyc === 'verified' || kyc === 'approved';
              return raw.filter(r => {
                if (!r) return false;
                if (r.toLowerCase() === 'seller') return kycApproved;
                return true;
              });
            })(),
          } as any;

          console.log('AuthContext - User loaded:', user);
          console.log('AuthContext - User roles:', user.roles);
          dispatch({ type: 'LOGIN_SUCCESS', payload: user });
        } catch (error) {
          console.error('Failed to fetch user:', error);
          // If fetching user fails, log out
          authService.logout();
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        dispatch({ type: 'LOGOUT' });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Login function
  const login = async (email: string, password: string) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const user = await authService.login({ email, password });
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  // Register function
  const register = async (formData: any) => {
    try {
      await authService.register(formData);
      // Note: Usually registration requires verification before login
    } catch (error) {
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    console.log('AuthContext: Logging out user without API call');
    authService.logout();
    dispatch({ type: 'LOGOUT' });
  };

  // Update user function
  const updateUser = (user: User) => {
    // Ensure roles are normalized when updating
    const normalizeRoles = (rawRoles: any): string[] => {
      if (!rawRoles) return [];
      if (Array.isArray(rawRoles)) {
        return rawRoles.map((r: any) => {
          if (!r) return '';
          if (typeof r === 'string') return r;
          if (typeof r === 'object') return (r.name || r.role || r.type || '').toString();
          return r.toString();
        }).filter(Boolean);
      }
      if (typeof rawRoles === 'string') {
        return rawRoles.split(',').map(s => s.trim()).filter(Boolean);
      }
      return [];
    };

    const normalizedUser = {
      ...user,
      roles: normalizeRoles((user as any).roles),
    } as any;

    dispatch({ type: 'UPDATE_USER', payload: normalizedUser });
  };

  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

// Custom hook for using auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};