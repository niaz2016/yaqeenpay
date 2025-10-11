// src/components/notifications/NotificationSettings.tsx
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
  FormGroup,
  Stack,
  Button,
  Alert,
  TextField,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  PhoneAndroid as PhoneIcon,
  Schedule as ScheduleIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useNotifications } from '../../context/NotificationContext';
import type { NotificationPreferences, NotificationType } from '../../types/notification';

const NotificationSettings: React.FC = () => {
  const { preferences, updatePreferences } = useNotifications();
  const [localPreferences, setLocalPreferences] = useState<NotificationPreferences>(preferences);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMainToggle = (key: keyof Pick<NotificationPreferences, 'emailNotifications' | 'pushNotifications' | 'smsNotifications'>) => {
    setLocalPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleTypeToggle = (type: NotificationType) => {
    setLocalPreferences(prev => ({
      ...prev,
      types: {
        ...prev.types,
        [type]: !prev.types[type]
      }
    }));
  };

  const handleQuietHoursToggle = () => {
    setLocalPreferences(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        enabled: !prev.quietHours.enabled
      }
    }));
  };

  const handleQuietHoursChange = (field: 'startTime' | 'endTime', value: string) => {
    setLocalPreferences(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await updatePreferences(localPreferences);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const typeLabels: Record<NotificationType, string> = {
    order: 'Order Updates',
    payment: 'Payment Notifications',
    kyc: 'KYC & Verification',
    security: 'Security Alerts',
    wallet: 'Wallet Activity',
    seller: 'Seller Updates',
    system: 'System Messages',
    promotion: 'Promotions & Offers',
  };

  const typeDescriptions: Record<NotificationType, string> = {
    order: 'New orders, status changes, and delivery updates',
    payment: 'Payment confirmations, releases, and failures',
    kyc: 'Document verification and approval status',
    security: 'Login alerts and account security',
    wallet: 'Balance changes, top-ups, and withdrawals',
    seller: 'Seller registration and approval updates',
    system: 'Maintenance, updates, and announcements',
    promotion: 'Special offers, discounts, and marketing',
  };

  return (
    <Stack spacing={3}>
      {success && (
        <Alert severity="success">
          Notification preferences saved successfully!
        </Alert>
      )}
      
      {error && (
        <Alert severity="error">
          {error}
        </Alert>
      )}

      {/* Main Notification Channels */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <NotificationsIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">
            Notification Channels
          </Typography>
        </Box>

        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={localPreferences.pushNotifications}
                onChange={() => handleMainToggle('pushNotifications')}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PhoneIcon sx={{ mr: 1, fontSize: 'small' }} />
                <Box>
                  <Typography variant="body1">Push Notifications</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Real-time notifications in your browser
                  </Typography>
                </Box>
              </Box>
            }
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={localPreferences.emailNotifications}
                onChange={() => handleMainToggle('emailNotifications')}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <EmailIcon sx={{ mr: 1, fontSize: 'small' }} />
                <Box>
                  <Typography variant="body1">Email Notifications</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Receive notifications via email
                  </Typography>
                </Box>
              </Box>
            }
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={localPreferences.smsNotifications}
                onChange={() => handleMainToggle('smsNotifications')}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <SmsIcon sx={{ mr: 1, fontSize: 'small' }} />
                <Box>
                  <Typography variant="body1">SMS Notifications</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Text message alerts for critical updates
                  </Typography>
                </Box>
              </Box>
            }
          />
        </FormGroup>
      </Paper>

      {/* Notification Types */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          Notification Types
        </Typography>

        <Stack spacing={2}>
          {Object.entries(typeLabels).map(([type, label]) => (
            <Box
              key={type}
              sx={{
                p: 2,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2">
                  {label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {typeDescriptions[type as NotificationType]}
                </Typography>
              </Box>
              <Switch
                checked={localPreferences.types[type as NotificationType]}
                onChange={() => handleTypeToggle(type as NotificationType)}
              />
            </Box>
          ))}
        </Stack>
      </Paper>

      {/* Quiet Hours */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <ScheduleIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">
            Quiet Hours
          </Typography>
        </Box>

        <FormControlLabel
          control={
            <Switch
              checked={localPreferences.quietHours.enabled}
              onChange={handleQuietHoursToggle}
            />
          }
          label="Enable quiet hours"
          sx={{ mb: 2 }}
        />

        {localPreferences.quietHours.enabled && (
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              label="Start Time"
              type="time"
              value={localPreferences.quietHours.startTime}
              onChange={(e) => handleQuietHoursChange('startTime', e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 300 }}
              size="small"
            />
            <Typography variant="body2" color="text.secondary">
              to
            </Typography>
            <TextField
              label="End Time"
              type="time"
              value={localPreferences.quietHours.endTime}
              onChange={(e) => handleQuietHoursChange('endTime', e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 300 }}
              size="small"
            />
          </Stack>
        )}

        {localPreferences.quietHours.enabled && (
          <Alert severity="info" sx={{ mt: 2 }}>
            During quiet hours ({localPreferences.quietHours.startTime} - {localPreferences.quietHours.endTime}), 
            you'll only receive critical notifications.
          </Alert>
        )}
      </Paper>

      {/* Save Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving}
          size="large"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </Box>
    </Stack>
  );
};

export default NotificationSettings;