import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yaqeenpay.app',
  appName: 'YaqeenPay',
  webDir: 'dist',
  server: {
    // Use HTTP scheme for development (avoids SSL certificate issues)
    androidScheme: 'http',
    // Allow cleartext for development if needed
    cleartext: true,
    // For development: allow network access
    allowNavigation: ['*']
  },
  android: {
    // Allow mixed content if needed
    allowMixedContent: true
  },
  plugins: {
    StatusBar: {
      style: 'dark',
      backgroundColor: '#1976d2',
      overlaysWebView: false
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1976d2',
      showSpinner: false
    }
  }
};