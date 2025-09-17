// src/services/notificationService.ts
import apiService from './api';

export interface NotificationPayload {
  recipientId: string;
  type: 'order_created' | 'order_approved' | 'order_rejected' | 'payment_released' | 'escrow_funded';
  title: string;
  message: string;
  data?: Record<string, any>;
}

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
  private mockNotifications: NotificationHistory[] = [
    {
      id: '1',
      type: 'order_created',
      title: 'New Order Received',
      message: 'You have received a new order worth PKR 5,000',
      read: false,
      createdAt: new Date().toISOString(),
      data: { orderId: 'order-123', amount: 5000 }
    }
  ];

  async sendNotification(notification: NotificationPayload): Promise<void> {
    try {
      // Try to send via API first
      await apiService.post('/notifications/send', notification);
    } catch (error) {
      console.warn('Failed to send notification via API, using mock:', error);
      
      // Mock implementation for development
      const mockNotification: NotificationHistory = {
        id: Date.now().toString(),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        read: false,
        createdAt: new Date().toISOString(),
        data: notification.data
      };
      
      this.mockNotifications.unshift(mockNotification);
      
      // Store in localStorage for persistence
      localStorage.setItem('mock_notifications', JSON.stringify(this.mockNotifications));
      
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/icon.png'
        });
      }
    }
  }

  async getNotifications(): Promise<NotificationHistory[]> {
    try {
      const response = await apiService.get<NotificationHistory[]>('/notifications');
      return response;
    } catch (error) {
      console.warn('Failed to fetch notifications via API, using mock:', error);
      
      // Load from localStorage
      const stored = localStorage.getItem('mock_notifications');
      if (stored) {
        this.mockNotifications = JSON.parse(stored);
      }
      
      return this.mockNotifications;
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      await apiService.put(`/notifications/${notificationId}/read`);
    } catch (error) {
      console.warn('Failed to mark notification as read via API, using mock:', error);
      
      // Update mock notification
      const notification = this.mockNotifications.find(n => n.id === notificationId);
      if (notification) {
        notification.read = true;
        localStorage.setItem('mock_notifications', JSON.stringify(this.mockNotifications));
      }
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
      message: `You have a new order worth ${currency} ${orderAmount.toLocaleString()}. Funds are now in escrow and will be released when the buyer confirms receipt.`,
      data: { orderId, amount: orderAmount, currency }
    });
  }

  async notifyEscrowFunded(sellerId: string, orderAmount: number, currency: string, orderId: string): Promise<void> {
    await this.sendNotification({
      recipientId: sellerId,
      type: 'escrow_funded',
      title: 'Escrow Funded ✅',
      message: `${currency} ${orderAmount.toLocaleString()} has been frozen in escrow for order. You can now ship the items safely knowing payment is guaranteed.`,
      data: { orderId, amount: orderAmount, currency }
    });
  }

  async notifyPaymentReleased(sellerId: string, orderAmount: number, currency: string, orderId: string): Promise<void> {
    await this.sendNotification({
      recipientId: sellerId,
      type: 'payment_released',
      title: 'Payment Released! 💰',
      message: `${currency} ${orderAmount.toLocaleString()} has been released to your wallet. The buyer has confirmed receipt of the items.`,
      data: { orderId, amount: orderAmount, currency }
    });
  }
}

const notificationService = new NotificationService();
export default notificationService;