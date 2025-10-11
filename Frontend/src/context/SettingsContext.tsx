import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import settingsService from '../services/settingsService';
import type { UserSettings, SettingsCategory } from '../services/settingsService';

interface SettingsContextType {
  settings: UserSettings | null;
  loading: boolean;
  error: string | null;
  updateSetting: (category: SettingsCategory, settingsData: any) => Promise<boolean>;
  resetSettings: (category: SettingsCategory) => Promise<boolean>;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const userSettings = await settingsService.getAllSettings();
      setSettings(userSettings);
    } catch (err) {
      console.error('Failed to load settings:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (category: SettingsCategory, settingsData: any): Promise<boolean> => {
    try {
      setError(null);
      const success = await settingsService.updateSettings(category, settingsData);
      
      if (success) {
        // Refresh settings after successful update
        await refreshSettings();
        return true;
      } else {
        setError('Failed to update settings');
        return false;
      }
    } catch (err) {
      console.error('Failed to update settings:', err);
      setError('Failed to update settings');
      return false;
    }
  };

  const resetSettings = async (category: SettingsCategory): Promise<boolean> => {
    try {
      setError(null);
      const success = await settingsService.resetSettings(category);
      
      if (success) {
        // Refresh settings after successful reset
        await refreshSettings();
        return true;
      } else {
        setError('Failed to reset settings');
        return false;
      }
    } catch (err) {
      console.error('Failed to reset settings:', err);
      setError('Failed to reset settings');
      return false;
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  const value: SettingsContextType = {
    settings,
    loading,
    error,
    updateSetting,
    resetSettings,
    refreshSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};