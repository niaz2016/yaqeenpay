import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yaqeenpay.app',
  appName: 'YaqeenPay',
  webDir: 'dist',
  server: {
    // For mobile apps, use production configuration
    cleartext: true,
    androidScheme: 'https',
    // Allow navigation to backend and external services
    allowNavigation: [
      'techtorio.online',
      'https://techtorio.online',
      'http://techtorio.online',
      'https://*.google.com',
      'https://*.googleapis.com',
      'https://accounts.google.com'
    ]
  },
  android: {
    // Allow mixed content for HTTP API calls if needed
    allowMixedContent: true,
    // Build configuration
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
      releaseType: 'APK'
    }
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

export default config;