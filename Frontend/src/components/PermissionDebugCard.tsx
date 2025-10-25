import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
  Alert,
  Box
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Help as HelpIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { permissionService } from '../services/permissionService';
import type { AllPermissionsStatus } from '../services/permissionService';

export const PermissionDebugCard: React.FC = () => {
  const [permissions, setPermissions] = useState<AllPermissionsStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkPermissions = async () => {
    setLoading(true);
    try {
      const result = await permissionService.checkAllPermissions();
      setPermissions(result);
      setLastChecked(new Date());
      console.log('Debug permission check:', result);
    } catch (error) {
      console.error('Error checking permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshPermissions = async () => {
    setLoading(true);
    try {
      const result = await permissionService.refreshPermissions();
      setPermissions(result);
      setLastChecked(new Date());
      console.log('Debug permission refresh:', result);
    } catch (error) {
      console.error('Error refreshing permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkPermissions();
  }, []);

  const getPermissionIcon = (granted: boolean, denied: boolean) => {
    if (granted) return <CheckIcon color="success" />;
    if (denied) return <CancelIcon color="error" />;
    return <HelpIcon color="warning" />;
  };

  const getPermissionColor = (granted: boolean, denied: boolean): 'success' | 'error' | 'warning' => {
    if (granted) return 'success';
    if (denied) return 'error';
    return 'warning';
  };

  const getPermissionLabel = (granted: boolean, denied: boolean) => {
    if (granted) return 'Granted';
    if (denied) return 'Denied';
    return 'Not Asked';
  };

  if (!permissions) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6">Permission Status</Typography>
          <Typography>Loading...</Typography>
        </CardContent>
      </Card>
    );
  }

  const criticalPermissions = ['sms', 'location', 'camera', 'notifications'];
  const allCriticalGranted = criticalPermissions.every(
    perm => permissions[perm as keyof AllPermissionsStatus]?.granted
  );

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Permission Status</Typography>
          <Button
            startIcon={<RefreshIcon />}
            onClick={refreshPermissions}
            disabled={loading}
            size="small"
          >
            Refresh
          </Button>
        </Stack>

        {!allCriticalGranted && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Some critical permissions are missing. App functionality may be limited.
          </Alert>
        )}

        <Stack spacing={1}>
          {Object.entries(permissions).map(([key, status]) => (
            <Box key={key} display="flex" alignItems="center" gap={1}>
              {getPermissionIcon(status.granted, status.denied)}
              <Typography variant="body2" sx={{ minWidth: 100, textTransform: 'capitalize' }}>
                {key}:
              </Typography>
              <Chip
                label={getPermissionLabel(status.granted, status.denied)}
                color={getPermissionColor(status.granted, status.denied)}
                size="small"
              />
              {criticalPermissions.includes(key) && (
                <Chip label="Critical" color="info" size="small" variant="outlined" />
              )}
            </Box>
          ))}
        </Stack>

        {lastChecked && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            Last checked: {lastChecked.toLocaleTimeString()}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default PermissionDebugCard;