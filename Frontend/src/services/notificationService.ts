// src/services/notificationService.ts
import apiService from './api';
import type { 
  NotificationListResponse, 
  NotificationType, 
  NotificationPreferences,
  MarkAsReadRequest
} from '../types/notification';

// Legacy interface for backward compatibility
export interface NotificationPayload {
  recipientId: string;
  type: 'order_created' | 'order_approved' | 'order_rejected' | 'payment_released' | 'escrow_funded' | 'payment_confirmed' | 'order_shipped';
  title: string;
  message: string;
  data?: Record<string, any>;
}

// Legacy interface for backward compatibility
export interface NotificationHistory {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, any>;
}

class NotificationService {
  async sendNotification(notification: NotificationPayload): Promise<void> {
    try {
      await apiService.post('/notifications/send', notification);
      
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/icon.png'
        });
      }

      // Dispatch a global custom event so UI layers can show a toast
      try {
        window.dispatchEvent(new CustomEvent('app:notification-sent', { detail: notification }));
      } catch (evtErr) {
        // non-fatal
        console.debug('Notification event dispatch failed (harmless):', evtErr);
      }
    } catch (error) {
      console.error('Failed to send notification via API:', error);
      throw error;
    }
  }

  // Legacy method for backward compatibility
  async getNotificationsLegacy(): Promise<NotificationHistory[]> {
    try {
      const response = await apiService.get<NotificationHistory[]>('/notifications');
      return response;
    } catch (error) {
      console.error('Failed to fetch notifications via API:', error);
      throw error;
    }
  }

  // Legacy method for backward compatibility
  async markAsReadLegacy(notificationId: string): Promise<void> {
    try {
      await apiService.put(`/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Failed to mark notification as read via API:', error);
      throw error;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  // Helper methods for specific notification types
  async notifyOrderCreated(sellerId: string, orderAmount: number, currency: string, orderId: string): Promise<void> {
    await this.sendNotification({
      recipientId: sellerId,
      type: 'order_created',
      title: 'New Order Received! 🎉',
      message: `You have a new order worth ${orderAmount ? orderAmount.toLocaleString() : '0'} Wallet Credits. Credits are now held in escrow and will be released when the buyer confirms receipt.`,
      data: { orderId, amount: orderAmount, currency }
    });
  }

  async notifyEscrowFunded(sellerId: string, orderAmount: number, currency: string, orderId: string): Promise<void> {
    await this.sendNotification({
      recipientId: sellerId,
      type: 'escrow_funded',
      title: 'Escrow Funded ✅',
      message: `${orderAmount ? orderAmount.toLocaleString() : '0'} Wallet Credits have been held in escrow for this order. You can now ship the items safely knowing payment is reserved.`,
      data: { orderId, amount: orderAmount, currency }
    });
  }

  async notifyPaymentReleased(sellerId: string, orderAmount: number, currency: string, orderId: string): Promise<void> {
    await this.sendNotification({
      recipientId: sellerId,
      type: 'payment_released',
      title: 'Payment Released! 💰',
      message: `${orderAmount ? orderAmount.toLocaleString() : '0'} Wallet Credits have been released to your wallet. The buyer has confirmed receipt of the items.`,
      data: { orderId, amount: orderAmount, currency }
    });
  }

  async notifyPaymentConfirmed(sellerId: string, orderAmount: number, currency: string, orderId: string): Promise<void> {
    await this.sendNotification({
      recipientId: sellerId,
      type: 'payment_confirmed',
      title: 'Payment Confirmed! 💳',
      message: `Buyer has paid ${orderAmount ? orderAmount.toLocaleString() : '0'} Wallet Credits for the order. The amount is now held in escrow. Please prepare and book the parcel for delivery.`,
      data: { orderId, amount: orderAmount, currency }
    });
  }

  async notifyOrderShipped(buyerId: string, orderId: string): Promise<void> {
    await this.sendNotification({
      recipientId: buyerId,
      type: 'order_shipped',
      title: 'Order Shipped! 📦',
      message: `Your order has been shipped by the seller. You can track its progress and confirm delivery once received.`,
      data: { orderId }
    });
  }

  // Withdrawal notification methods - Updated to use proper backend API
  async notifyWithdrawalInitiated(userId: string, amount: number, currency: string, method: string): Promise<void> {
    try {
      await apiService.post('/notifications/send', {
        recipientId: userId,
        type: 'wallet',
        title: 'Withdrawal Request Submitted',
        message: `Your withdrawal request of ${amount ? amount.toLocaleString() : '0'} Wallet Credits via ${method} has been submitted and is being processed.`,
        priority: 'medium',
        data: { 
          amount, 
          currency, 
          method, 
          type: 'withdrawal_initiated',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to send withdrawal initiated notification:', error);
      throw error;
    }
  }

  async notifyWithdrawalApproved(userId: string, amount: number, currency: string, method: string): Promise<void> {
    try {
      await apiService.post('/notifications/send', {
        recipientId: userId,
        type: 'wallet',
        title: 'Withdrawal Approved ✅',
        message: `Your withdrawal of ${amount ? amount.toLocaleString() : '0'} Wallet Credits via ${method} has been approved and processed.`,
        priority: 'high',
        data: { 
          amount, 
          currency, 
          method, 
          type: 'withdrawal_approved',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to send withdrawal approved notification:', error);
      throw error;
    }
  }

  async notifyWithdrawalRejected(userId: string, amount: number, currency: string, method: string, reason?: string): Promise<void> {
    try {
      await apiService.post('/notifications/send', {
        recipientId: userId,
        type: 'wallet',
        title: 'Withdrawal Request Rejected ❌',
        message: `Your withdrawal request of ${amount ? amount.toLocaleString() : '0'} Wallet Credits via ${method} was rejected.${reason ? ` Reason: ${reason}` : ''}`,
        priority: 'high',
        data: { 
          amount, 
          currency, 
          method, 
          reason, 
          type: 'withdrawal_rejected',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to send withdrawal rejected notification:', error);
      throw error;
    }
  }

  // Comprehensive notification methods
  async getNotifications(params?: { page?: number; limit?: number; type?: NotificationType }): Promise<NotificationListResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.type) queryParams.append('type', params.type);

      const response = await apiService.get<NotificationListResponse>(`/notifications?${queryParams}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch notifications via API:', error);
      throw error;
    }
  }

  async markAsRead(notificationIds: string[]): Promise<void> {
    try {
      await apiService.put('/notifications/mark-read', { notificationIds } as MarkAsReadRequest);
    } catch (error) {
      console.error('Failed to mark notifications as read via API:', error);
      throw error;
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      await apiService.put('/notifications/mark-all-read');
    } catch (error) {
      console.error('Failed to mark all notifications as read via API:', error);
      throw error;
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await apiService.delete(`/notifications/${notificationId}`);
    } catch (error) {
      console.error('Failed to delete notification via API:', error);
      throw error;
    }
  }

  async deleteMultiple(notificationIds: string[]): Promise<void> {
    try {
      await apiService.delete('/notifications/bulk', { data: { notificationIds } });
    } catch (error) {
      console.error('Failed to delete multiple notifications via API:', error);
      throw error;
    }
  }

  async getPreferences(): Promise<NotificationPreferences> {
    try {
      const response = await apiService.get<NotificationPreferences>('/notifications/preferences');
      return response;
    } catch (error) {
      console.error('Failed to get preferences via API:', error);
      throw error;
    }
  }

  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    try {
      const response = await apiService.put<NotificationPreferences>('/notifications/preferences', preferences);
      return response;
    } catch (error) {
      console.error('Failed to update preferences via API:', error);
      throw error;
    }
  }
}

const notificationService = new NotificationService();
export default notificationService;