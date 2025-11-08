import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Button,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useSettings } from '../../../context/SettingsContext';
import { useAuth } from '../../../context/AuthContext';
import { SettingsCategory } from '../../../services/settingsService';
import type { AccountSettings as AccountSettingsType } from '../../../services/settingsService';
import TopRightToast from '../../../components/TopRightToast';

const languages = [
  { value: 'en', label: 'English' },
  { value: 'ur', label: 'Urdu' },
  { value: 'ar', label: 'Arabic' },
];

const currencies = [
  { value: 'PKR', label: 'Pakistani Rupee (PKR)' },
  { value: 'USD', label: 'US Dollar (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
];

const timeZones = [
  { value: 'Asia/Karachi', label: 'Pakistan Standard Time' },
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time' },
  { value: 'Europe/London', label: 'Greenwich Mean Time' },
];

const contactMethods = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'phone', label: 'Phone Call' },
];

const AccountSettings: React.FC = () => {
  const { user } = useAuth();
  const { settings, updateSetting, loading: contextLoading } = useSettings();
  const [accountSettings, setAccountSettings] = useState<AccountSettingsType>({
    defaultLanguage: 'en',
    defaultCurrency: 'PKR',
    timeZone: 'Asia/Karachi',
    marketingEmails: true,
    dataExportEnabled: true,
    preferredContactMethod: 'email',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (settings?.account) {
      setAccountSettings(settings.account);
    }
  }, [settings]);

  const handleInputChange = (field: keyof AccountSettingsType, value: any) => {
    setAccountSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess(false);

      const success = await updateSetting(SettingsCategory.Account, accountSettings);
      
      if (success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError('Failed to update account settings');
      }
    } catch (err) {
      setError('An error occurred while saving settings');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (settings?.account) {
      setAccountSettings(settings.account);
    }
  };

  const handleDataExport = async () => {
    // This would be implemented with actual data export functionality
    alert('Data export feature will be implemented in a future update');
  };

  const handleAccountDeletion = () => {
    // This would open a confirmation dialog
    alert('Account deletion feature will be implemented with proper safeguards');
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
      <TopRightToast open={success} message={'Account settings updated successfully!'} severity="success" onClose={() => setSuccess(false)} />
      <TopRightToast open={Boolean(error)} message={error || ''} severity="error" onClose={() => setError('')} />

      {/* Basic Profile Information */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Profile Information
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Basic profile information is managed in your profile page.
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body1">
            <strong>Name:</strong> {user?.firstName} {user?.lastName}
          </Typography>
          <Typography variant="body1">
            <strong>Email:</strong> {user?.email}
          </Typography>
          <Button variant="outlined" size="small" onClick={() => window.location.href = '/profile'}>
            Edit Profile
          </Button>
        </Box>
      </Paper>

      {/* Account Preferences */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Account Preferences
        </Typography>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Default Language</InputLabel>
            <Select
              value={accountSettings.defaultLanguage}
              label="Default Language"
              onChange={(e) => handleInputChange('defaultLanguage', e.target.value)}
            >
              {languages.map((lang) => (
                <MenuItem key={lang.value} value={lang.value}>
                  {lang.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth>
            <InputLabel>Default Currency</InputLabel>
            <Select
              value={accountSettings.defaultCurrency}
              label="Default Currency"
              onChange={(e) => handleInputChange('defaultCurrency', e.target.value)}
            >
              {currencies.map((currency) => (
                <MenuItem key={currency.value} value={currency.value}>
                  {currency.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth>
            <InputLabel>Time Zone</InputLabel>
            <Select
              value={accountSettings.timeZone}
              label="Time Zone"
              onChange={(e) => handleInputChange('timeZone', e.target.value)}
            >
              {timeZones.map((tz) => (
                <MenuItem key={tz.value} value={tz.value}>
                  {tz.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth>
            <InputLabel>Preferred Contact Method</InputLabel>
            <Select
              value={accountSettings.preferredContactMethod}
              label="Preferred Contact Method"
              onChange={(e) => handleInputChange('preferredContactMethod', e.target.value)}
            >
              {contactMethods.map((method) => (
                <MenuItem key={method.value} value={method.value}>
                  {method.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Communication Preferences */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Communication Preferences
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={accountSettings.marketingEmails}
                onChange={(e) => handleInputChange('marketingEmails', e.target.checked)}
              />
            }
            label="Receive marketing emails and promotional content"
          />
        </Box>
      </Paper>

      {/* Privacy & Data */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Privacy & Data Management
        </Typography>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Data Export
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Download a copy of your account data for backup or transfer purposes.
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                startIcon={<DownloadIcon />}
                variant="outlined"
                onClick={handleDataExport}
              >
                Export Data
              </Button>
            </CardActions>
          </Card>
          
          <Card variant="outlined" sx={{ border: '1px solid', borderColor: 'error.main' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="error">
                Account Deletion
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Permanently delete your account and all associated data. This action cannot be undone.
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                startIcon={<DeleteIcon />}
                variant="outlined"
                color="error"
                onClick={handleAccountDeletion}
              >
                Delete Account
              </Button>
            </CardActions>
          </Card>
        </Box>
      </Paper>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleReset}
          disabled={loading}
        >
          Reset Changes
        </Button>
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

export default AccountSettings;