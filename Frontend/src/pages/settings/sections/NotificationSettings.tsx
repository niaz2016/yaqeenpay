import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  TextField,
} from '@mui/material';
import {
  Save as SaveIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Notifications as PushIcon,
  NotificationsOff as QuietIcon,
} from '@mui/icons-material';
import { useSettings } from '../../../context/SettingsContext';
import { SettingsCategory } from '../../../services/settingsService';
import type { NotificationSettings as NotificationSettingsType } from '../../../services/settingsService';
import TopRightToast from '../../../components/TopRightToast';

const emailFrequencyOptions = [
  { value: 'immediate', label: 'Immediately' },
  { value: 'hourly', label: 'Hourly Digest' },
  { value: 'daily', label: 'Daily Digest' },
  { value: 'weekly', label: 'Weekly Digest' },
  { value: 'disabled', label: 'Disabled' },
];

const daysOfWeek = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

const NotificationSettings: React.FC = () => {
  const { settings, updateSetting, loading: contextLoading } = useSettings();
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettingsType>({
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: true,
    emailFrequency: 'immediate',
    orderNotifications: true,
    paymentNotifications: true,
    securityNotifications: true,
    marketingNotifications: false,
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00',
      days: [],
    },
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (settings?.notifications) {
      setNotificationSettings(settings.notifications);
    }
  }, [settings]);

  const handleInputChange = (field: keyof NotificationSettingsType, value: any) => {
    setNotificationSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleQuietHoursChange = (field: keyof NotificationSettingsType['quietHours'], value: any) => {
    setNotificationSettings(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        [field]: value,
      },
    }));
  };

  const handleQuietHoursDayToggle = (day: string) => {
    const currentDays = notificationSettings.quietHours.days;
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    
    handleQuietHoursChange('days', newDays);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess(false);

      const success = await updateSetting(SettingsCategory.Notifications, notificationSettings);
      
      if (success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError('Failed to update notification settings');
      }
    } catch (err) {
      setError('An error occurred while saving settings');
    } finally {
      setLoading(false);
    }
  };

  const getNotificationStatusColor = () => {
    const enabledCount = [
      notificationSettings.emailEnabled,
      notificationSettings.smsEnabled,
      notificationSettings.pushEnabled
    ].filter(Boolean).length;

    if (enabledCount === 3) return 'success';
    if (enabledCount === 2) return 'warning';
    if (enabledCount === 1) return 'info';
    return 'error';
  };

  if (contextLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <TopRightToast open={success} message={'Notification settings updated successfully!'} severity="success" onClose={() => setSuccess(false)} />
      <TopRightToast open={Boolean(error)} message={error || ''} severity="error" onClose={() => setError('')} />

      {/* Notification Status Overview */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <PushIcon color="primary" />
          <Typography variant="h6">
            Notification Status
          </Typography>
          <Chip 
            label={`${[notificationSettings.emailEnabled, notificationSettings.smsEnabled, notificationSettings.pushEnabled].filter(Boolean).length}/3 Active`}
            color={getNotificationStatusColor() as any}
            variant="filled"
          />
        </Box>
        <Typography variant="body2" color="text.secondary">
          Configure how you want to receive notifications from TechTorio.
        </Typography>
      </Paper>

      {/* Notification Channels */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Notification Channels
        </Typography>
        
        <List>
          <ListItem>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon color={notificationSettings.emailEnabled ? 'primary' : 'disabled'} />
                  <Typography>Email Notifications</Typography>
                </Box>
              }
              secondary="Receive notifications via email"
            />
            <ListItemSecondaryAction>
              <Switch
                checked={notificationSettings.emailEnabled}
                onChange={(e) => handleInputChange('emailEnabled', e.target.checked)}
              />
            </ListItemSecondaryAction>
          </ListItem>

          <ListItem>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SmsIcon color={notificationSettings.smsEnabled ? 'primary' : 'disabled'} />
                  <Typography>SMS Notifications</Typography>
                </Box>
              }
              secondary="Receive notifications via SMS (charges may apply)"
            />
            <ListItemSecondaryAction>
              <Switch
                checked={notificationSettings.smsEnabled}
                onChange={(e) => handleInputChange('smsEnabled', e.target.checked)}
              />
            </ListItemSecondaryAction>
          </ListItem>

          <ListItem>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PushIcon color={notificationSettings.pushEnabled ? 'primary' : 'disabled'} />
                  <Typography>Push Notifications</Typography>
                </Box>
              }
              secondary="Receive push notifications in your browser"
            />
            <ListItemSecondaryAction>
              <Switch
                checked={notificationSettings.pushEnabled}
                onChange={(e) => handleInputChange('pushEnabled', e.target.checked)}
              />
            </ListItemSecondaryAction>
          </ListItem>
        </List>
      </Paper>

      {/* Email Settings */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Email Preferences
        </Typography>
        
        <Box sx={{ maxWidth: { md: '50%' }, mb: 3 }}>
          <FormControl fullWidth disabled={!notificationSettings.emailEnabled}>
            <InputLabel>Email Frequency</InputLabel>
            <Select
              value={notificationSettings.emailFrequency}
              label="Email Frequency"
              onChange={(e) => handleInputChange('emailFrequency', e.target.value)}
            >
              {emailFrequencyOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Notification Categories */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Notification Categories
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Choose which types of notifications you want to receive.
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={notificationSettings.orderNotifications}
                onChange={(e) => handleInputChange('orderNotifications', e.target.checked)}
              />
            }
            label="Order Updates (created, paid, shipped, delivered)"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={notificationSettings.paymentNotifications}
                onChange={(e) => handleInputChange('paymentNotifications', e.target.checked)}
              />
            }
            label="Payment Notifications (received, failed, refunds)"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={notificationSettings.securityNotifications}
                onChange={(e) => handleInputChange('securityNotifications', e.target.checked)}
              />
            }
            label="Security Alerts (login attempts, password changes)"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={notificationSettings.marketingNotifications}
                onChange={(e) => handleInputChange('marketingNotifications', e.target.checked)}
              />
            }
            label="Marketing Communications (promotions, newsletters)"
          />
        </Box>
      </Paper>

      {/* Quiet Hours */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <QuietIcon />
          <Typography variant="h6">
            Quiet Hours
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Set specific hours when you don't want to receive notifications.
        </Typography>
        
        <FormControlLabel
          control={
            <Switch
              checked={notificationSettings.quietHours.enabled}
              onChange={(e) => handleQuietHoursChange('enabled', e.target.checked)}
            />
          }
          label="Enable Quiet Hours"
          sx={{ mb: 3 }}
        />

        {notificationSettings.quietHours.enabled && (
          <Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
              <TextField
                label="Start Time"
                type="time"
                value={notificationSettings.quietHours.startTime}
                onChange={(e) => handleQuietHoursChange('startTime', e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              
              <TextField
                label="End Time"
                type="time"
                value={notificationSettings.quietHours.endTime}
                onChange={(e) => handleQuietHoursChange('endTime', e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Box>
            
            <Typography variant="subtitle2" gutterBottom>
              Days of Week
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {daysOfWeek.map((day) => (
                <Chip
                  key={day.value}
                  label={day.label}
                  onClick={() => handleQuietHoursDayToggle(day.value)}
                  color={notificationSettings.quietHours.days.includes(day.value) ? 'primary' : 'default'}
                  variant={notificationSettings.quietHours.days.includes(day.value) ? 'filled' : 'outlined'}
                  clickable
                />
              ))}
            </Box>
          </Box>
        )}
      </Paper>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? <CircularProgress size={20} /> : 'Save Changes'}
        </Button>
      </Box>
    </Box>
  );
};

export default NotificationSettings;