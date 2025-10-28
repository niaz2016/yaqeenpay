import { Capacitor } from '@capacitor/core';
import { registerPlugin } from '@capacitor/core';

export interface PermissionStatus {
  granted: boolean;
  denied: boolean;
  asked: boolean;
}

export interface AllPermissionsStatus {
  location: PermissionStatus;
  storage: PermissionStatus;
  camera: PermissionStatus;
  notifications: PermissionStatus;
  sms: PermissionStatus;
  contacts: PermissionStatus;
  phone: PermissionStatus;
  microphone: PermissionStatus;
}

export interface PermissionManagerPlugin {
  checkAllPermissions(): Promise<{ permissions: AllPermissionsStatus }>;
  requestAllPermissions(): Promise<{ permissions: AllPermissionsStatus }>;
  requestPermission(options: { permission: string }): Promise<{ granted: boolean }>;
  openAppSettings(): Promise<void>;
}

const PermissionManager = registerPlugin<PermissionManagerPlugin>('PermissionManager');

export class PermissionService {
  private static instance: PermissionService;
  private isNative: boolean;

  private constructor() {
    this.isNative = Capacitor.isNativePlatform();
  }

  public static getInstance(): PermissionService {
    if (!PermissionService.instance) {
      PermissionService.instance = new PermissionService();
    }
    return PermissionService.instance;
  }

  /**
   * Check all permissions status
   */
  async checkAllPermissions(): Promise<AllPermissionsStatus> {
    if (!this.isNative) {
      // Return all granted for web
      return this.getDefaultPermissions(true);
    }

    try {
      const result = await PermissionManager.checkAllPermissions();
      console.log('Permission check result:', result);
      return result.permissions;
    } catch (error) {
      console.error('Error checking permissions:', error);
      return this.getDefaultPermissions(false);
    }
  }

  /**
   * Force refresh permission status (useful after granting permissions)
   */
  async refreshPermissions(): Promise<AllPermissionsStatus> {
    console.log('Refreshing permission status...');
    // Add a small delay to ensure Android has updated permission state
    await new Promise(resolve => setTimeout(resolve, 500));
    return await this.checkAllPermissions();
  }

  /**
   * Request all permissions at once (show system permission dialogs)
   */
  async requestAllPermissions(): Promise<AllPermissionsStatus> {
    if (!this.isNative) {
      return this.getDefaultPermissions(true);
    }

    try {
      const result = await PermissionManager.requestAllPermissions();
      return result.permissions;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return this.getDefaultPermissions(false);
    }
  }

  /**
   * Request specific permission
   */
  async requestPermission(permission: string): Promise<boolean> {
    if (!this.isNative) {
      return true;
    }

    try {
      const result = await PermissionManager.requestPermission({ permission });
      return result.granted;
    } catch (error) {
      console.error(`Error requesting ${permission} permission:`, error);
      return false;
    }
  }

  /**
   * Open app settings for manual permission management
   */
  async openAppSettings(): Promise<void> {
    if (!this.isNative) {
      console.warn('App settings only available on native platforms');
      return;
    }

    try {
      await PermissionManager.openAppSettings();
    } catch (error) {
      console.error('Error opening app settings:', error);
    }
  }

  /**
   * Get critical permissions that must be granted for app to function
   */
  getCriticalPermissions(): string[] {
    return [
      'android.permission.INTERNET',
      'android.permission.ACCESS_NETWORK_STATE',
      'android.permission.READ_SMS',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.CAMERA',
      'android.permission.POST_NOTIFICATIONS'
    ];
  }

  /**
   * Get optional permissions that enhance app experience
   */
  getOptionalPermissions(): string[] {
    return [
      'android.permission.SEND_SMS',
      'android.permission.READ_CONTACTS',
      'android.permission.CAMERA',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.CALL_PHONE',
      'android.permission.RECORD_AUDIO',
      'android.permission.USE_BIOMETRIC'
    ];
  }

  /**
   * Check if all critical permissions are granted
   */
  async hasCriticalPermissions(): Promise<boolean> {
    const permissions = await this.checkAllPermissions();
    return permissions.sms.granted && 
           permissions.location.granted && 
           permissions.camera.granted &&
           permissions.notifications.granted;
  }

  /**
   * Get user-friendly permission descriptions
   */
  getPermissionDescriptions(): Record<string, { title: string; description: string; importance: 'critical' | 'recommended' | 'optional' }> {
    return {
      sms: {
        title: 'SMS Access',
        description: 'Read SMS messages for automatic OTP detection and bank payment notifications',
        importance: 'critical'
      },
      location: {
        title: 'Location Access',
        description: 'Detect device location for security notifications and fraud prevention',
        importance: 'critical'
      },
      notifications: {
        title: 'Notifications',
        description: 'Receive important alerts about payments, transactions, and security',
        importance: 'critical'
      },
      contacts: {
        title: 'Contacts Access',
        description: 'Easily send money to contacts and verify payment recipients',
        importance: 'recommended'
      },
      camera: {
        title: 'Camera Access',
        description: 'Scan QR codes for payments and capture KYC documents',
        importance: 'recommended'
      },
      storage: {
        title: 'Storage Access',
        description: 'Save payment receipts and transaction history',
        importance: 'recommended'
      },
      phone: {
        title: 'Phone Access',
        description: 'Quick contact with customer support and emergency calls',
        importance: 'optional'
      },
      microphone: {
        title: 'Microphone Access',
        description: 'Voice notes for customer support and voice commands',
        importance: 'optional'
      }
    };
  }

  private getDefaultPermissions(granted: boolean): AllPermissionsStatus {
    return {
      sms: { granted, denied: !granted, asked: true },
      location: { granted, denied: !granted, asked: true },
      contacts: { granted, denied: !granted, asked: true },
      phone: { granted, denied: !granted, asked: true },
      storage: { granted, denied: !granted, asked: true },
      camera: { granted, denied: !granted, asked: true },
      notifications: { granted, denied: !granted, asked: true },
      microphone: { granted, denied: !granted, asked: true }
    };
  }
}

export const permissionService = PermissionService.getInstance();