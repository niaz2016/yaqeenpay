import api from './api';

export interface UserSettings {
  account: AccountSettings;
  security: SecuritySettings;
  notifications: NotificationSettings;
  payments: PaymentSettings;
  business?: BusinessSettings;
  appearance: AppearanceSettings;
  integrations: IntegrationSettings;
}

export interface AccountSettings {
  defaultLanguage: string;
  defaultCurrency: string;
  timeZone: string;
  marketingEmails: boolean;
  dataExportEnabled: boolean;
  preferredContactMethod: string;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  loginAlertsEnabled: boolean;
  sessionTimeoutMinutes: number;
  requirePasswordForSensitiveActions: boolean;
  enableSecurityNotifications: boolean;
  trustedDevices: string[];
  lastPasswordChange?: string;
}

export interface NotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  emailFrequency: string;
  orderNotifications: boolean;
  paymentNotifications: boolean;
  securityNotifications: boolean;
  marketingNotifications: boolean;
  quietHours: QuietHours;
}

export interface QuietHours {
  enabled: boolean;
  startTime: string;
  endTime: string;
  days: string[];
}

export interface PaymentSettings {
  defaultPaymentMethod?: string;
  autoPaymentEnabled: boolean;
  displayCurrency: string;
  dailyTransactionLimit?: number;
  monthlyTransactionLimit?: number;
  preferredWithdrawalMethod?: string;
  minimumWithdrawalAmount: number;
  enableTransactionNotifications: boolean;
}

export interface BusinessSettings {
  businessName?: string;
  businessDescription?: string;
  operatingHours?: string;
  shippingMethods: string[];
  defaultHandlingTime: number;
  autoAcceptOrders: boolean;
  preferredCategories: string[];
  enableBusinessNotifications: boolean;
}

export interface AppearanceSettings {
  theme: string;
  language: string;
  dateFormat: string;
  timeFormat: string;
  density: string;
  highContrastMode: boolean;
  fontSize: number;
  reducedAnimations: boolean;
}

export interface IntegrationSettings {
  connectedApps: ConnectedApp[];
  apiKeys: ApiKey[];
  webhooks: Webhook[];
  dataExportEnabled: boolean;
  exportFormat: string;
}

export interface ConnectedApp {
  id: string;
  name: string;
  connectedAt: string;
  permissions: string[];
  lastUsed?: string;
}

export interface ApiKey {
  id: string;
  name: string;
  maskedKey: string;
  createdAt: string;
  lastUsed?: string;
  scopes: string[];
}

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  createdAt: string;
}

export const SettingsCategory = {
  Account: 0,
  Security: 1,
  Notifications: 2,
  Payments: 3,
  Business: 4,
  Appearance: 5,
  Integrations: 6
} as const;

export type SettingsCategory = typeof SettingsCategory[keyof typeof SettingsCategory];

class SettingsService {
  async getAllSettings(): Promise<UserSettings> {
    const response = await api.get('/settings') as { data: UserSettings };
    return response.data;
  }

  async getSettingsByCategory(category: SettingsCategory): Promise<any> {
    const response = await api.get(`/settings/${category}`) as { data: any };
    return response.data;
  }

  async updateSettings(category: SettingsCategory, settings: any): Promise<boolean> {
    try {
      const response = await api.put(`/settings/${category}`, settings) as { data: { success: boolean } };
      return response.data.success;
    } catch (error) {
      console.error('Failed to update settings:', error);
      return false;
    }
  }

  async resetSettings(category: SettingsCategory): Promise<boolean> {
    try {
      const response = await api.post(`/settings/${category}/reset`) as { data: { success: boolean } };
      return response.data.success;
    } catch (error) {
      console.error('Failed to reset settings:', error);
      return false;
    }
  }
}

export default new SettingsService();