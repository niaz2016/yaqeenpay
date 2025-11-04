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
      // Prefer requesting only critical permissions based on env flags
      await this.requestCriticalPermissions();
      return await this.checkAllPermissions();
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return this.getDefaultPermissions(false);
    }
  }

  /**
   * Request only the critical permissions based on env flags.
   * INTERNET/ACCESS_NETWORK_STATE are normal permissions and don't need runtime prompts.
   */
  async requestCriticalPermissions(): Promise<void> {
    if (!this.isNative) return;
    const critical = this.getCriticalPermissions();
    const runtimePerms = critical.filter((p) => [
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.READ_SMS',
      'android.permission.CAMERA',
      'android.permission.POST_NOTIFICATIONS',
    ].includes(p));

    for (const perm of runtimePerms) {
      try {
        await this.requestPermission(perm);
      } catch (e) {
        console.warn('Permission request failed for', perm, e);
      }
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
   * Get critical permissions required, based on env flags.
   * For login-only in APK, we require location only.
   */
  getCriticalPermissions(): string[] {
    const smsEnabled = (import.meta.env.VITE_ENABLE_SMS_READING as string) === 'true';
    const cameraEnabled = (import.meta.env.VITE_ENABLE_CAMERA as string) === 'true';
    const notificationsEnabled = (import.meta.env.VITE_ENABLE_NOTIFICATIONS as string) === 'true';
    const locationEnabled = (import.meta.env.VITE_ENABLE_LOCATION_TRACKING as string) !== 'false';

    const perms: string[] = [
      // Always allow network access but don't prompt (no runtime prompt on Android for these)
      'android.permission.INTERNET',
      'android.permission.ACCESS_NETWORK_STATE'
    ];

    if (locationEnabled) {
      perms.push('android.permission.ACCESS_FINE_LOCATION');
      perms.push('android.permission.ACCESS_COARSE_LOCATION');
    }
    if (smsEnabled) perms.push('android.permission.READ_SMS');
    if (cameraEnabled) perms.push('android.permission.CAMERA');
    if (notificationsEnabled) perms.push('android.permission.POST_NOTIFICATIONS');
    return perms;
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
    const smsEnabled = (import.meta.env.VITE_ENABLE_SMS_READING as string) === 'true';
    const cameraEnabled = (import.meta.env.VITE_ENABLE_CAMERA as string) === 'true';
    const notificationsEnabled = (import.meta.env.VITE_ENABLE_NOTIFICATIONS as string) === 'true';
    const locationEnabled = (import.meta.env.VITE_ENABLE_LOCATION_TRACKING as string) !== 'false';

    // Only require what's enabled; by default, for APK we only require location
    if (locationEnabled && !permissions.location.granted) return false;
    if (smsEnabled && !permissions.sms.granted) return false;
    if (cameraEnabled && !permissions.camera.granted) return false;
    if (notificationsEnabled && !permissions.notifications.granted) return false;
    return true;
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