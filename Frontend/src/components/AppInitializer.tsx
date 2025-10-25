import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { Capacitor } from '@capacitor/core';
import { PermissionRequestDialog } from './PermissionRequestDialog';
import { permissionService } from '../services/permissionService';
import { locationService } from '../services/locationService';

interface AppInitializerProps {
  children: React.ReactNode;
}

export const AppInitializer: React.FC<AppInitializerProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setIsLoading(true);

      // Only handle permissions on native platforms
      if (Capacitor.isNativePlatform()) {
        await handleNativeAppInitialization();
      } else {
        // For web, just initialize directly
        setIsInitialized(true);
      }
    } catch (error) {
      console.error('App initialization error:', error);
      // Continue anyway for better user experience
      setIsInitialized(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNativeAppInitialization = async () => {
    try {
      // Check current permission status
      const currentPermissions = await permissionService.checkAllPermissions();
      console.log('Current permissions:', currentPermissions);

      // Always check if critical permissions are missing
      const hasCriticalPermissions = await permissionService.hasCriticalPermissions();

      // Always show permission dialog if critical permissions are missing
      // This ensures camera and location are requested on app startup
      if (!hasCriticalPermissions) {
        console.log('Missing critical permissions, showing permission dialog');
        setShowPermissionDialog(true);
      } else {
        console.log('All critical permissions granted, proceeding with app initialization');
        await finalizeInitialization();
      }
    } catch (error) {
      console.error('Native app initialization error:', error);
      // Show permission dialog as fallback to ensure permissions are requested
      setShowPermissionDialog(true);
    }
  };

  const markAppAsInitialized = async () => {
    try {
      const { Preferences } = await import('@capacitor/preferences');
      await Preferences.set({ key: 'app_initialized', value: 'true' });
    } catch (error) {
      console.error('Error marking app as initialized:', error);
    }
  };

  const finalizeInitialization = async () => {
    try {
      // Initialize location service in background (don't wait)
      if (await locationService.isLocationAvailable()) {
        locationService.getCurrentLocation().catch(err => {
          console.warn('Failed to get initial location:', err);
        });
      }

      // Mark app as initialized
      await markAppAsInitialized();

      // App is ready
      setIsInitialized(true);
    } catch (error) {
      console.error('Finalization error:', error);
      setIsInitialized(true); // Continue anyway
    }
  };

  const handlePermissionsGranted = async () => {
    setShowPermissionDialog(false);
    
    // Double-check permissions after dialog closes
    console.log('Permission dialog closed, refreshing permissions...');
    const refreshedPermissions = await permissionService.refreshPermissions();
    console.log('Final permission status:', refreshedPermissions);
    
    await finalizeInitialization();
  };

  const handlePermissionsSkipped = async () => {
    setShowPermissionDialog(false);
    // Still initialize, but some features may not work
    console.log('Permissions skipped, continuing with app initialization');
    await finalizeInitialization();
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: 'primary.main',
          color: 'white'
        }}
      >
        <CircularProgress color="inherit" size={60} sx={{ mb: 2 }} />
        <Typography variant="h6" sx={{ mb: 1 }}>
          YaqeenPay
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          Initializing secure payment platform...
        </Typography>
      </Box>
    );
  }

  if (!isInitialized) {
    return (
      <>
        {/* Show app logo/splash while permissions are being handled */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            backgroundColor: 'primary.main',
            color: 'white'
          }}
        >
          <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold' }}>
            YaqeenPay
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.8 }}>
            Secure • Fast • Reliable
          </Typography>
        </Box>

        {/* Permission Request Dialog */}
        <PermissionRequestDialog
          open={showPermissionDialog}
          onClose={handlePermissionsSkipped}
          onPermissionsGranted={handlePermissionsGranted}
          showOnlyRequired={false}
        />
      </>
    );
  }

  // App is initialized, render the main app
  return <>{children}</>;
};