// src/types/notification.ts

export type NotificationType = 
  | 'order' 
  | 'payment' 
  | 'kyc' 
  | 'system' 
  | 'security'
  | 'promotion'
  | 'wallet'
  | 'seller';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export type NotificationStatus = 'unread' | 'read' | 'archived';

export interface NotificationAction {
  id: string;
  label: string;
  url?: string;
  action?: () => void;
  variant?: 'text' | 'outlined' | 'contained';
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  createdAt: string;
  readAt?: string;
  expiresAt?: string;
  userId: string;
  metadata?: Record<string, any>;
  actions?: NotificationAction[];
  avatar?: string;
  icon?: string;
  redirectUrl?: string;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  types: {
    [K in NotificationType]: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
  };
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: {
    [K in NotificationType]: number;
  };
  byPriority: {
    [K in NotificationPriority]: number;
  };
}

// API response types
export interface NotificationListResponse {
  notifications: Notification[];
  stats: NotificationStats;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface MarkAsReadRequest {
  notificationIds: string[];
}

export interface NotificationCreateRequest {
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  userId: string;
  metadata?: Record<string, any>;
  actions?: Omit<NotificationAction, 'id'>[];
  expiresAt?: string;
  redirectUrl?: string;
}

// Context types
export interface NotificationContextValue {
  notifications: Notification[];
  stats: NotificationStats;
  preferences: NotificationPreferences;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchNotifications: (params?: { page?: number; limit?: number; type?: NotificationType }) => Promise<void>;
  fetchNewNotifications: (params?: { limit?: number; type?: NotificationType }) => Promise<void>;
  markAsRead: (notificationIds: string[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  deleteMultiple: (notificationIds: string[]) => Promise<void>;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  refreshNotifications: () => Promise<void>;
  
  // Real-time updates
  subscribeToUpdates: () => void;
  unsubscribeFromUpdates: () => void;
}