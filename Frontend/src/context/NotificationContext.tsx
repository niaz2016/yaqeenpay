// src/context/NotificationContext.tsx
import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { 
  Notification, 
  NotificationStats, 
  NotificationPreferences, 
  NotificationContextValue,
  NotificationType,
  NotificationListResponse 
} from '../types/notification';
import notificationService from '../services/notificationService';

// Initial state
const initialNotifications: Notification[] = [];
const initialStats: NotificationStats = {
  total: 0,
  unread: 0,
  byType: {
    order: 0,
    payment: 0,
    kyc: 0,
    system: 0,
    security: 0,
    promotion: 0,
    wallet: 0,
    seller: 0,
  },
  byPriority: {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  }
};

const initialPreferences: NotificationPreferences = {
  emailNotifications: true,
  pushNotifications: true,
  smsNotifications: false,
  types: {
    order: true,
    payment: true,
    kyc: true,
    system: true,
    security: true,
    promotion: true,
    wallet: true,
    seller: true,
  },
  quietHours: {
    enabled: false,
    startTime: '22:00',
    endTime: '08:00',
  }
};

// Reducer types
type NotificationState = {
  notifications: Notification[];
  stats: NotificationStats;
  preferences: NotificationPreferences;
  loading: boolean;
  error: string | null;
};

type NotificationAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_NOTIFICATIONS'; payload: NotificationListResponse }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'UPDATE_NOTIFICATION'; payload: { id: string; updates: Partial<Notification> } }
  | { type: 'DELETE_NOTIFICATION'; payload: string }
  | { type: 'DELETE_MULTIPLE'; payload: string[] }
  | { type: 'MARK_AS_READ'; payload: string[] }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'SET_PREFERENCES'; payload: NotificationPreferences }
  | { type: 'RESET' };

const initialState: NotificationState = {
  notifications: initialNotifications,
  stats: initialStats,
  preferences: initialPreferences,
  loading: false,
  error: null,
};

// Reducer
function notificationReducer(state: NotificationState, action: NotificationAction): NotificationState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_NOTIFICATIONS':
      // Sort notifications by creation date (newest first)
      const sortedNotifications = [...action.payload.notifications].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      return {
        ...state,
        notifications: sortedNotifications,
        stats: action.payload.stats,
        loading: false,
        error: null,
      };
    
    case 'ADD_NOTIFICATION':
      const newNotifications = [action.payload, ...state.notifications];
      // Sort notifications by creation date (newest first)
      const sortedNewNotifications = newNotifications.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      return {
        ...state,
        notifications: sortedNewNotifications,
        stats: {
          ...state.stats,
          total: state.stats.total + 1,
          unread: action.payload.status === 'unread' ? state.stats.unread + 1 : state.stats.unread,
          byType: {
            ...state.stats.byType,
            [action.payload.type]: state.stats.byType[action.payload.type] + 1,
          },
          byPriority: {
            ...state.stats.byPriority,
            [action.payload.priority]: state.stats.byPriority[action.payload.priority] + 1,
          }
        }
      };
    
    case 'UPDATE_NOTIFICATION':
      const updatedNotifications = state.notifications.map(notification =>
        notification.id === action.payload.id
          ? { ...notification, ...action.payload.updates }
          : notification
      );
      return { ...state, notifications: updatedNotifications };
    
    case 'DELETE_NOTIFICATION':
      const filteredNotifications = state.notifications.filter(n => n.id !== action.payload);
      const deletedNotification = state.notifications.find(n => n.id === action.payload);
      return {
        ...state,
        notifications: filteredNotifications,
        stats: deletedNotification ? {
          ...state.stats,
          total: state.stats.total - 1,
          unread: deletedNotification.status === 'unread' ? state.stats.unread - 1 : state.stats.unread,
          byType: {
            ...state.stats.byType,
            [deletedNotification.type]: Math.max(0, state.stats.byType[deletedNotification.type] - 1),
          },
          byPriority: {
            ...state.stats.byPriority,
            [deletedNotification.priority]: Math.max(0, state.stats.byPriority[deletedNotification.priority] - 1),
          }
        } : state.stats
      };
    
    case 'DELETE_MULTIPLE':
      const remainingNotifications = state.notifications.filter(n => !action.payload.includes(n.id));
      const deletedItems = state.notifications.filter(n => action.payload.includes(n.id));
      const unreadDeleted = deletedItems.filter(n => n.status === 'unread').length;
      
      return {
        ...state,
        notifications: remainingNotifications,
        stats: {
          ...state.stats,
          total: state.stats.total - deletedItems.length,
          unread: state.stats.unread - unreadDeleted,
        }
      };
    
    case 'MARK_AS_READ':
      const markedNotifications = state.notifications.map(notification =>
        action.payload.includes(notification.id)
          ? { ...notification, status: 'read' as const, readAt: new Date().toISOString() }
          : notification
      );
      const unreadCount = action.payload.filter(id => 
        state.notifications.find(n => n.id === id)?.status === 'unread'
      ).length;
      
      return {
        ...state,
        notifications: markedNotifications,
        stats: {
          ...state.stats,
          unread: Math.max(0, state.stats.unread - unreadCount),
        }
      };
    
    case 'MARK_ALL_AS_READ':
      const allReadNotifications = state.notifications.map(notification => ({
        ...notification,
        status: 'read' as const,
        readAt: notification.status === 'unread' ? new Date().toISOString() : notification.readAt,
      }));
      
      return {
        ...state,
        notifications: allReadNotifications,
        stats: {
          ...state.stats,
          unread: 0,
        }
      };
    
    case 'SET_PREFERENCES':
      return { ...state, preferences: action.payload };
    
    case 'RESET':
      return initialState;
    
    default:
      return state;
  }
}

// Create context
const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

// Provider component
interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  // Actions
  const fetchNotifications = useCallback(async (params?: { page?: number; limit?: number; type?: NotificationType }) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await notificationService.getNotifications(params);
      
      // If no notifications from API, add some test data for development
      if (import.meta.env.DEV && response.notifications.length === 0) {
        const testNotifications: Notification[] = [
          {
            id: 'test-1',
            type: 'security',
            title: 'Successful login',
            message: 'You have successfully logged in from IP: 127.0.0.1',
            priority: 'low',
            status: 'unread',
            createdAt: new Date().toISOString(),
            userId: 'test-user',
          },
          {
            id: 'test-2',
            type: 'security',
            title: 'Successful login',
            message: 'You have successfully logged in from IP: 127.0.0.1',
            priority: 'low',
            status: 'read',
            createdAt: new Date(Date.now() - 60000).toISOString(),
            userId: 'test-user',
          },
          {
            id: 'test-3',
            type: 'order',
            title: 'New Order Received',
            message: 'You have received a new order for PKR 15,000. Please review and approve.',
            priority: 'high',
            status: 'unread',
            createdAt: new Date(Date.now() - 120000).toISOString(),
            userId: 'test-user',
          },
        ];
        
        const testResponse = {
          notifications: testNotifications,
          stats: {
            total: 3,
            unread: 2,
            byType: { order: 1, payment: 0, kyc: 0, system: 0, security: 2, promotion: 0, wallet: 0, seller: 0 },
            byPriority: { low: 2, medium: 0, high: 1, critical: 0 }
          },
          pagination: { page: 1, limit: 20, total: 3, hasNext: false, hasPrev: false }
        };
        
        dispatch({ type: 'SET_NOTIFICATIONS', payload: testResponse });
        return;
      }
      
      dispatch({ type: 'SET_NOTIFICATIONS', payload: response });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch notifications' });
      console.error('Error fetching notifications:', error);
    }
  }, []);

  // Fetch only new notifications and merge them into state (no duplicates)
  const fetchNewNotifications = useCallback(async (params?: { limit?: number; type?: NotificationType }) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      // Fetch a limited recent set (default limit 20)
      const response = await notificationService.getNotifications({ page: 1, limit: params?.limit || 20, type: params?.type });
      // Filter out notifications we already have
      const existingIds = new Set(state.notifications.map(n => n.id));
      const newOnes = response.notifications.filter(n => !existingIds.has(n.id));
      if (newOnes.length === 0) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }
      // Merge new notifications with existing ones and let the reducer handle sorting
      const allNotifications = [...newOnes, ...state.notifications];
      dispatch({ type: 'SET_NOTIFICATIONS', payload: {
        notifications: allNotifications,
        stats: response.stats,
        pagination: response.pagination,
      } as unknown as NotificationListResponse });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch new notifications' });
      console.error('Error fetching new notifications:', error);
    }
  }, [state.notifications]);

  const markAsRead = useCallback(async (notificationIds: string[]) => {
    try {
      await notificationService.markAsRead(notificationIds);
      dispatch({ type: 'MARK_AS_READ', payload: notificationIds });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to mark notifications as read' });
      console.error('Error marking notifications as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      dispatch({ type: 'MARK_ALL_AS_READ' });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to mark all notifications as read' });
      console.error('Error marking all notifications as read:', error);
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      dispatch({ type: 'DELETE_NOTIFICATION', payload: notificationId });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete notification' });
      console.error('Error deleting notification:', error);
    }
  }, []);

  const deleteMultiple = useCallback(async (notificationIds: string[]) => {
    try {
      await notificationService.deleteMultiple(notificationIds);
      dispatch({ type: 'DELETE_MULTIPLE', payload: notificationIds });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete notifications' });
      console.error('Error deleting multiple notifications:', error);
    }
  }, []);

  const fetchPreferences = useCallback(async () => {
    try {
      const preferences = await notificationService.getPreferences();
      dispatch({ type: 'SET_PREFERENCES', payload: preferences });
    } catch (error) {
      // If preferences fetch fails, keep default preferences
      console.warn('Failed to fetch notification preferences, using defaults:', error);
    }
  }, []);

  const updatePreferences = useCallback(async (preferences: Partial<NotificationPreferences>) => {
    try {
      const updatedPreferences = await notificationService.updatePreferences(preferences);
      dispatch({ type: 'SET_PREFERENCES', payload: updatedPreferences });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update preferences' });
      console.error('Error updating preferences:', error);
    }
  }, []);

  const subscribeToUpdates = useCallback(() => {
    // Implement WebSocket or Server-Sent Events connection here
    console.log('Subscribing to notification updates');
  }, []);

  const unsubscribeFromUpdates = useCallback(() => {
    // Cleanup WebSocket or SSE connection here
    console.log('Unsubscribing from notification updates');
  }, []);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_NOTIFICATION', payload: newNotification });
  }, []);

  const refreshNotifications = useCallback(async () => {
    // Force a complete refresh of notifications
    await fetchNotifications({ page: 1, limit: 50 });
  }, [fetchNotifications]);

  // Load initial data
  useEffect(() => {
    fetchNotifications();
    fetchPreferences();
  }, [fetchNotifications, fetchPreferences]);

  // Periodic notification refresh - Check once every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNewNotifications({ limit: 15 });
    }, 60000); // Check for new notifications every 60 seconds (1 minute)

    return () => clearInterval(interval);
  }, [fetchNewNotifications]);

  // Auto-refresh on login: listen to a custom event dispatched by authService
  useEffect(() => {
    const onLogin = () => {
      // Import recent notifications after login
      fetchNewNotifications({ limit: 20 });
    };
    window.addEventListener('auth:login', onLogin);
    return () => window.removeEventListener('auth:login', onLogin);
  }, [fetchNewNotifications]);

  // Refresh notifications when page becomes visible (user switches back to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchNewNotifications({ limit: 10 });
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchNewNotifications]);

  // Listen for withdrawal status changes to refresh notifications
  useEffect(() => {
    const handleWithdrawalStatusChange = () => {
      setTimeout(() => {
        fetchNewNotifications({ limit: 10 });
      }, 1000);
    };
    
    window.addEventListener('withdrawal:statusChanged', handleWithdrawalStatusChange);
    return () => window.removeEventListener('withdrawal:statusChanged', handleWithdrawalStatusChange);
  }, [fetchNewNotifications]);

  // Context value
  const value: NotificationContextValue = {
    notifications: state.notifications,
    stats: state.stats,
    preferences: state.preferences,
    loading: state.loading,
    error: state.error,
    fetchNotifications,
    fetchNewNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteMultiple,
    updatePreferences,
    addNotification,
    refreshNotifications,
    subscribeToUpdates,
    unsubscribeFromUpdates,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Hook to use notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;