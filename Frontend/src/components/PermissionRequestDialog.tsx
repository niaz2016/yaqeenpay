import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Chip,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Sms as SmsIcon,
  LocationOn as LocationIcon,
  Contacts as ContactsIcon,
  Phone as PhoneIcon,
  Storage as StorageIcon,
  CameraAlt as CameraIcon,
  Notifications as NotificationsIcon,
  Mic as MicIcon,
  Security as SecurityIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { permissionService } from '../services/permissionService';
import type { AllPermissionsStatus } from '../services/permissionService';
import logger from '../utils/logger';

interface PermissionRequestDialogProps {
  open: boolean;
  onClose: () => void;
  onPermissionsGranted: () => void;
  showOnlyRequired?: boolean;
}

const permissionIcons = {
  sms: SmsIcon,
  location: LocationIcon,
  contacts: ContactsIcon,
  phone: PhoneIcon,
  storage: StorageIcon,
  camera: CameraIcon,
  notifications: NotificationsIcon,
  microphone: MicIcon
};

export const PermissionRequestDialog: React.FC<PermissionRequestDialogProps> = ({
  open,
  onClose,
  onPermissionsGranted,
  showOnlyRequired = false
}) => {
  const [permissions, setPermissions] = useState<AllPermissionsStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string>('');
  const [step, setStep] = useState<'intro' | 'requesting' | 'result'>('intro');

  const permissionDescriptions = permissionService.getPermissionDescriptions();

  useEffect(() => {
    if (open) {
      checkPermissions();
    }
  }, [open]);

  const checkPermissions = async () => {
    setLoading(true);
    try {
      const result = await permissionService.checkAllPermissions();
      setPermissions(result);
    } catch (err) {
      setError('Failed to check permissions');
      logger.error('Permission check error:', err);
    } finally {
      setLoading(false);
    }
  };

  const requestAllPermissions = async () => {
    setRequesting(true);
    setStep('requesting');
    setError('');

    try {
      // Request only critical permissions as per env flags
      await permissionService.requestCriticalPermissions();
      const result = await permissionService.refreshPermissions();
      
      // Add a small delay and refresh permissions to ensure accurate status
  logger.debug('Initial permission result:', result);
  await new Promise(resolve => setTimeout(resolve, 1000));
      
  // Refresh permissions to get accurate status after user interaction
  const refreshedResult = await permissionService.refreshPermissions();
  logger.debug('Refreshed permission result:', refreshedResult);
      
      setPermissions(refreshedResult);
      setStep('result');

      // Check if critical permissions are granted (env-driven; default location only)
      const smsEnabled = (import.meta.env.VITE_ENABLE_SMS_READING as string) === 'true';
      const cameraEnabled = (import.meta.env.VITE_ENABLE_CAMERA as string) === 'true';
      const notificationsEnabled = (import.meta.env.VITE_ENABLE_NOTIFICATIONS as string) === 'true';
      const locationEnabled = (import.meta.env.VITE_ENABLE_LOCATION_TRACKING as string) !== 'false';
      const hasCritical = (
        (!smsEnabled || refreshedResult.sms.granted) &&
        (!cameraEnabled || refreshedResult.camera.granted) &&
        (!notificationsEnabled || refreshedResult.notifications.granted) &&
        (!locationEnabled || refreshedResult.location.granted)
      );

      logger.debug('Critical permissions check:', {
        sms: refreshedResult.sms.granted,
        location: refreshedResult.location.granted,
        camera: refreshedResult.camera.granted,
        notifications: refreshedResult.notifications.granted,
        hasCritical
      });

      if (hasCritical) {
        setTimeout(() => {
          onPermissionsGranted();
        }, 2000);
      }
    } catch (err) {
      setError('Failed to request permissions. Please try again.');
      logger.error('Permission request error:', err);
      setStep('intro');
    } finally {
      setRequesting(false);
    }
  };

  const openAppSettings = async () => {
    try {
      await permissionService.openAppSettings();
    } catch (err) {
      logger.error('Failed to open app settings:', err);
    }
  };

  const renderPermissionList = () => {
    if (!permissions) return null;

    const permissionEntries = Object.entries(permissions);
    const smsEnabled = (import.meta.env.VITE_ENABLE_SMS_READING as string) === 'true';
    const cameraEnabled = (import.meta.env.VITE_ENABLE_CAMERA as string) === 'true';
    const notificationsEnabled = (import.meta.env.VITE_ENABLE_NOTIFICATIONS as string) === 'true';
    const locationEnabled = (import.meta.env.VITE_ENABLE_LOCATION_TRACKING as string) !== 'false';

    const requiredKeys = new Set<string>([
      ...(locationEnabled ? ['location'] : []),
      ...(smsEnabled ? ['sms'] : []),
      ...(cameraEnabled ? ['camera'] : []),
      ...(notificationsEnabled ? ['notifications'] : []),
    ]);

    const filteredPermissions = showOnlyRequired
      ? permissionEntries.filter(([key]) => requiredKeys.has(key))
      : permissionEntries;

    return (
      <List>
        {filteredPermissions.map(([key, status]) => {
          const desc = permissionDescriptions[key];
          if (!desc) return null;

          const IconComponent = permissionIcons[key as keyof typeof permissionIcons];
          const importance = desc.importance;
          
          return (
            <React.Fragment key={key}>
              <ListItem>
                <ListItemIcon>
                  <Box sx={{ position: 'relative' }}>
                    <IconComponent 
                      color={status.granted ? 'success' : 'action'} 
                      sx={{ fontSize: 32 }}
                    />
                    {status.granted && (
                      <CheckIcon 
                        color="success" 
                        sx={{ 
                          position: 'absolute', 
                          bottom: -4, 
                          right: -4, 
                          fontSize: 16,
                          backgroundColor: 'white',
                          borderRadius: '50%'
                        }} 
                      />
                    )}
                    {status.denied && (
                      <CancelIcon 
                        color="error" 
                        sx={{ 
                          position: 'absolute', 
                          bottom: -4, 
                          right: -4, 
                          fontSize: 16,
                          backgroundColor: 'white',
                          borderRadius: '50%'
                        }} 
                      />
                    )}
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1">{desc.title}</Typography>
                      <Chip
                        label={importance}
                        size="small"
                        color={
                          importance === 'critical' ? 'error' : 
                          importance === 'recommended' ? 'warning' : 'default'
                        }
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={desc.description}
                />
              </ListItem>
              <Divider />
            </React.Fragment>
          );
        })}
      </List>
    );
  };

  const renderIntroStep = () => (
    <>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SecurityIcon color="primary" />
        <Typography variant="h6">App Permissions Required</Typography>
      </DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          YaqeenPay needs access to certain device features to provide the best payment experience. 
          Your privacy and security are our top priority.
        </Alert>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          renderPermissionList()
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={requesting}>
          Skip for Now
        </Button>
        <Button 
          onClick={requestAllPermissions} 
          variant="contained" 
          disabled={requesting || loading}
          startIcon={requesting ? <CircularProgress size={20} /> : <SecurityIcon />}
        >
          {requesting ? 'Requesting...' : 'Grant Permissions'}
        </Button>
      </DialogActions>
    </>
  );

  const renderRequestingStep = () => (
    <>
      <DialogTitle>
        <Typography variant="h6" align="center">Requesting Permissions</Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="body1" align="center">
            Please allow permissions in the system dialogs that appear.
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
            This may take a few moments...
          </Typography>
        </Box>
      </DialogContent>
    </>
  );

  const renderResultStep = () => {
    if (!permissions) return null;

    const criticalGranted = permissions.sms.granted && 
                           permissions.location.granted && 
                           permissions.notifications.granted;
    
    const totalPermissions = Object.keys(permissions).length;
    const grantedPermissions = Object.values(permissions).filter(p => p.granted).length;

    return (
      <>
        <DialogTitle>
          <Typography variant="h6" align="center">
            Permission Results
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography variant="h4" color={criticalGranted ? 'success.main' : 'warning.main'}>
              {grantedPermissions}/{totalPermissions}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Permissions Granted
            </Typography>
          </Box>

          {criticalGranted ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              ✅ All critical permissions granted! You can now use all features of YaqeenPay.
            </Alert>
          ) : (
            <Alert severity="warning" sx={{ mb: 2 }}>
              ⚠️ Some critical permissions are missing. Some features may not work properly.
            </Alert>
          )}

          {renderPermissionList()}
        </DialogContent>
        <DialogActions>
          {!criticalGranted && (
            <Button 
              onClick={openAppSettings} 
              startIcon={<SettingsIcon />}
              color="warning"
            >
              Open Settings
            </Button>
          )}
          <Button onClick={onClose} variant="contained">
            Continue
          </Button>
        </DialogActions>
      </>
    );
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={step === 'requesting'}
    >
      {step === 'intro' && renderIntroStep()}
      {step === 'requesting' && renderRequestingStep()}
      {step === 'result' && renderResultStep()}
    </Dialog>
  );
};