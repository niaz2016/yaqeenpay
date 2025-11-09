import logger from '../utils/logger';

/**
 * Local Storage Service for TechTorio
 * Provides safe and consistent localStorage operations with error handling
 */

export class StorageService {
  private static readonly PREFIX = 'techtorio_';

  /**
   * Get item from localStorage with error handling
   */
  static getItem(key: string): string | null {
    try {
      return localStorage.getItem(this.PREFIX + key);
    } catch (error) {
      logger.warn(`Failed to get item from localStorage: ${key}`, error);
      return null;
    }
  }

  /**
   * Set item in localStorage with error handling
   */
  static setItem(key: string, value: string): boolean {
    try {
      localStorage.setItem(this.PREFIX + key, value);
      return true;
    } catch (error) {
      logger.warn(`Failed to set item in localStorage: ${key}`, error);
      return false;
    }
  }

  /**
   * Remove item from localStorage with error handling
   */
  static removeItem(key: string): boolean {
    try {
      localStorage.removeItem(this.PREFIX + key);
      return true;
    } catch (error) {
      logger.warn(`Failed to remove item from localStorage: ${key}`, error);
      return false;
    }
  }

  /**
   * Clear all TechTorio data from localStorage
   */
  static clearAll(): boolean {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(this.PREFIX));
      keys.forEach(key => localStorage.removeItem(key));
      return true;
    } catch (error) {
      logger.warn('Failed to clear localStorage', error);
      return false;
    }
  }

  /**
   * Check if localStorage is available
   */
  static isAvailable(): boolean {
    try {
      const testKey = '__test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Specific methods for common use cases

  /**
   * Remember user email for login
   */
  static getRememberedEmail(): string {
    return this.getItem('remembered_email') || '';
  }

  /**
   * Save user email for future logins
   */
  static saveRememberedEmail(email: string): boolean {
    return this.setItem('remembered_email', email);
  }

  /**
   * Clear remembered email
   */
  static clearRememberedEmail(): boolean {
    return this.removeItem('remembered_email');
  }

  /**
   * Get user preferences
   */
  static getUserPreferences(): Record<string, any> {
    try {
      const prefs = this.getItem('user_preferences');
      return prefs ? JSON.parse(prefs) : {};
    } catch (error) {
      logger.warn('Failed to parse user preferences', error);
      return {};
    }
  }

  /**
   * Save user preferences
   */
  static saveUserPreferences(preferences: Record<string, any>): boolean {
    try {
      return this.setItem('user_preferences', JSON.stringify(preferences));
    } catch (error) {
      logger.warn('Failed to save user preferences', error);
      return false;
    }
  }

  /**
   * Update specific user preference
   */
  static updateUserPreference(key: string, value: any): boolean {
    const prefs = this.getUserPreferences();
    prefs[key] = value;
    return this.saveUserPreferences(prefs);
  }

  /**
   * Get app settings
   */
  static getAppSettings(): Record<string, any> {
    try {
      const settings = this.getItem('app_settings');
      return settings ? JSON.parse(settings) : {
        rememberEmail: true,
        enableNotifications: true,
        autoBackup: false
      };
    } catch (error) {
      logger.warn('Failed to parse app settings', error);
      return {
        rememberEmail: true,
        enableNotifications: true,
        autoBackup: false
      };
    }
  }

  /**
   * Save app settings
   */
  static saveAppSettings(settings: Record<string, any>): boolean {
    try {
      return this.setItem('app_settings', JSON.stringify(settings));
    } catch (error) {
      logger.warn('Failed to save app settings', error);
      return false;
    }
  }
}

export default StorageService;