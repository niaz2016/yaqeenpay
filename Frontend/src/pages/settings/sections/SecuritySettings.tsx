import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Save as SaveIcon,
  Shield as ShieldIcon,
  Smartphone as PhoneIcon,
  Delete as DeleteIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useSettings } from '../../../context/SettingsContext';
import { SettingsCategory } from '../../../services/settingsService';
import type { SecuritySettings as SecuritySettingsType } from '../../../services/settingsService';
import profileService from '../../../services/profileService';
import { LoginPreferencesCard } from '../../../components/auth/LoginPreferencesCard';

const SessionTimeouts = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
  { value: 240, label: '4 hours' },
  { value: 480, label: '8 hours' },
];

const SecuritySettings: React.FC = () => {
  const { settings, updateSetting, loading: contextLoading } = useSettings();
  const [securitySettings, setSecuritySettings] = useState<SecuritySettingsType>({
    twoFactorEnabled: false,
    loginAlertsEnabled: true,
    sessionTimeoutMinutes: 30,
    requirePasswordForSensitiveActions: true,
    enableSecurityNotifications: true,
    trustedDevices: [],
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [hasPassword, setHasPassword] = useState<boolean>(true); // Track if user has password
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (settings?.security) {
      setSecuritySettings(settings.security);
    }
  }, [settings]);

  // Fetch profile to check if user has password
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await profileService.getProfile();
        setHasPassword(profile.hasPassword);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      }
    };
    fetchProfile();
  }, []);

  const handleInputChange = (field: keyof SecuritySettingsType, value: any) => {
    setSecuritySettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess(false);

      const success = await updateSetting(SettingsCategory.Security, securitySettings);
      
      if (success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError('Failed to update security settings');
      }
    } catch (err) {
      setError('An error occurred while saving settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    // For users with existing password, current password is required
    if (hasPassword && !passwordForm.currentPassword) {
      setError('Current password is required');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    if (passwordForm.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      setChangingPassword(true);
      setError('');

      const result = await profileService.changePassword({
        currentPassword: hasPassword ? passwordForm.currentPassword : undefined,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });

      if (result.success) {
        setSuccess(true);
        setSuccessMessage(hasPassword ? 'Password changed successfully!' : 'Password set successfully!');
        setShowChangePassword(false);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
        setHasPassword(true); // User now has a password
        
        // Update last password change timestamp in security settings
        const updatedSettings = {
          ...securitySettings,
          lastPasswordChange: new Date().toISOString(),
        };
        setSecuritySettings(updatedSettings);
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setSuccess(false);
          setSuccessMessage('');
        }, 5000);
      } else {
        setError(result.message || `Failed to ${hasPassword ? 'change' : 'set'} password. Please try again.`);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(`Failed to ${hasPassword ? 'change' : 'set'} password. Please try again.`);
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const handleClosePasswordDialog = () => {
    if (!changingPassword) {
      setShowChangePassword(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setError('');
    }
  };

  const handleToggle2FA = async () => {
    if (!securitySettings.twoFactorEnabled) {
      // Enable 2FA - this would open a setup flow
      alert('2FA setup flow will be implemented with QR code generation');
    } else {
      // Disable 2FA - this would require confirmation
      alert('2FA disable confirmation will be implemented');
    }
  };

  const handleRemoveTrustedDevice = (deviceId: string) => {
    const updatedDevices = securitySettings.trustedDevices.filter(id => id !== deviceId);
    handleInputChange('trustedDevices', updatedDevices);
  };

  const getSecurityScore = () => {
    let score = 0;
    if (securitySettings.twoFactorEnabled) score += 30;
    if (securitySettings.loginAlertsEnabled) score += 15;
    if (securitySettings.requirePasswordForSensitiveActions) score += 20;
    if (securitySettings.sessionTimeoutMinutes <= 60) score += 15;
    if (securitySettings.enableSecurityNotifications) score += 10;
    if (securitySettings.trustedDevices.length <= 3) score += 10;
    
    return Math.min(score, 100);
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const securityScore = getSecurityScore();

  if (contextLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage || 'Security settings updated successfully!'}
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Security Score */}
      <Paper elevation={1} sx={{ py: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <ShieldIcon color="primary" />
          <Typography variant="h6">
            Security Score
          </Typography>
          <Chip 
            label={`${securityScore}/100`} 
            color={getSecurityScoreColor(securityScore) as any}
            variant="filled"
          />
        </Box>
        <Typography variant="body2" color="text.secondary">
          Your account security score is based on the security features you have enabled.
          A higher score means better protection for your account.
        </Typography>
      </Paper>

      {/* Login Preferences */}
      <Box sx={{ mb: 3 }}>
        <LoginPreferencesCard />
      </Box>
      {/* Two-Factor Authentication */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Two-Factor Authentication (2FA)
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <PhoneIcon />
            <Box>
              <Typography variant="body1">
                Authenticator App
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Use an authenticator app to generate secure codes
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip 
              label={securitySettings.twoFactorEnabled ? 'Enabled' : 'Disabled'}
              color={securitySettings.twoFactorEnabled ? 'success' : 'default'}
              size="small"
            />
            <Button
              variant={securitySettings.twoFactorEnabled ? 'outlined' : 'contained'}
              color={securitySettings.twoFactorEnabled ? 'error' : 'primary'}
              onClick={handleToggle2FA}
            >
              {securitySettings.twoFactorEnabled ? 'Disable' : 'Enable'}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Session & Login Settings */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Session & Login Settings
        </Typography>
        
        <Box sx={{ maxWidth: { md: '50%' } }}>
          <FormControl fullWidth>
            <InputLabel>Session Timeout</InputLabel>
            <Select
              value={securitySettings.sessionTimeoutMinutes}
              label="Session Timeout"
              onChange={(e) => handleInputChange('sessionTimeoutMinutes', e.target.value)}
            >
              {SessionTimeouts.map((timeout) => (
                <MenuItem key={timeout.value} value={timeout.value}>
                  {timeout.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={securitySettings.loginAlertsEnabled}
                onChange={(e) => handleInputChange('loginAlertsEnabled', e.target.checked)}
              />
            }
            label="Send alerts for new login attempts"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={securitySettings.requirePasswordForSensitiveActions}
                onChange={(e) => handleInputChange('requirePasswordForSensitiveActions', e.target.checked)}
              />
            }
            label="Require password confirmation for sensitive actions"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={securitySettings.enableSecurityNotifications}
                onChange={(e) => handleInputChange('enableSecurityNotifications', e.target.checked)}
              />
            }
            label="Enable security notifications"
          />
        </Box>
      </Paper>

      {/* Trusted Devices */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Trusted Devices
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          These devices can access your account without additional verification.
        </Typography>
        
        {securitySettings.trustedDevices.length === 0 ? (
          <Alert severity="info">
            No trusted devices configured. You can add devices after logging in from them.
          </Alert>
        ) : (
          <List>
            {securitySettings.trustedDevices.map((deviceId, index) => (
              <ListItem key={deviceId} divider>
                <ListItemText
                  primary={`Device ${index + 1}`}
                  secondary={`ID: ${deviceId.substring(0, 8)}...`}
                />
                <ListItemSecondaryAction>
                  <IconButton 
                    edge="end" 
                    onClick={() => handleRemoveTrustedDevice(deviceId)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
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

      {/* Change Password Dialog */}
      <Dialog 
        open={showChangePassword} 
        onClose={handleClosePasswordDialog} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>{hasPassword ? 'Change Password' : 'Set Password'}</DialogTitle>
        <DialogContent>
          {!hasPassword && (
            <Alert severity="info" sx={{ mb: 2 }}>
              You registered using Google OAuth and don't have a password yet. Set a password to enable traditional login.
            </Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            {hasPassword && (
              <TextField
                fullWidth
                type={showCurrentPassword ? 'text' : 'password'}
                label="Current Password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                disabled={changingPassword}
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      edge="end"
                      disabled={changingPassword}
                    >
                      {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  ),
                }}
              />
            )}
            <TextField
              fullWidth
              type={showNewPassword ? 'text' : 'password'}
              label={hasPassword ? "New Password" : "Password"}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
              disabled={changingPassword}
              helperText="Minimum 8 characters with letters, numbers, and special characters"
              error={passwordForm.newPassword.length > 0 && passwordForm.newPassword.length < 8}
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    edge="end"
                    disabled={changingPassword}
                  >
                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                ),
              }}
            />
            <TextField
              fullWidth
              type={showConfirmPassword ? 'text' : 'password'}
              label={hasPassword ? "Confirm New Password" : "Confirm Password"}
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
              disabled={changingPassword}
              error={
                passwordForm.confirmPassword.length > 0 && 
                passwordForm.newPassword !== passwordForm.confirmPassword
              }
              helperText={
                passwordForm.confirmPassword.length > 0 && 
                passwordForm.newPassword !== passwordForm.confirmPassword 
                  ? "Passwords do not match" 
                  : ""
              }
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                    disabled={changingPassword}
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                ),
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleClosePasswordDialog} 
            disabled={changingPassword}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleChangePassword} 
            variant="contained"
            disabled={
              changingPassword ||
              (hasPassword && !passwordForm.currentPassword) ||
              !passwordForm.newPassword ||
              !passwordForm.confirmPassword ||
              passwordForm.newPassword.length < 8 ||
              passwordForm.newPassword !== passwordForm.confirmPassword
            }
            startIcon={changingPassword ? <CircularProgress size={20} /> : null}
          >
            {changingPassword ? `${hasPassword ? 'Changing' : 'Setting'}...` : `${hasPassword ? 'Change' : 'Set'} Password`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SecuritySettings;