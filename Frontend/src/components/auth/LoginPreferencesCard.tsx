import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  Security as SecurityIcon,
  Storage as StorageIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import StorageService from '../../services/storageService';

export const LoginPreferencesCard: React.FC = () => {
  const [rememberEmail, setRememberEmail] = useState(true);
  const [rememberedEmail, setRememberedEmail] = useState('');
  const [showClearDialog, setShowClearDialog] = useState(false);

  useEffect(() => {
    // Load current preferences
    const settings = StorageService.getAppSettings();
    setRememberEmail(settings.rememberEmail ?? true);
    setRememberedEmail(StorageService.getRememberedEmail());
  }, []);

  const handleRememberEmailChange = (enabled: boolean) => {
    setRememberEmail(enabled);
    
    // Update app settings
    const settings = StorageService.getAppSettings();
    settings.rememberEmail = enabled;
    StorageService.saveAppSettings(settings);

    // If disabled, clear remembered email immediately
    if (!enabled) {
      StorageService.clearRememberedEmail();
      setRememberedEmail('');
    }
  };

  const handleClearRememberedData = () => {
    StorageService.clearRememberedEmail();
    setRememberedEmail('');
    setShowClearDialog(false);
  };

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <SecurityIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">Login Preferences</Typography>
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={rememberEmail}
                onChange={(e) => handleRememberEmailChange(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body1">Remember Email Address</Typography>
                <Typography variant="body2" color="text.secondary">
                  Save your email for faster login (password is never saved)
                </Typography>
              </Box>
            }
          />

          {rememberedEmail && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <StorageIcon color="action" sx={{ mr: 1, fontSize: 20 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Remembered Email:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {rememberedEmail}
                    </Typography>
                  </Box>
                </Box>
                <Button
                  size="small"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setShowClearDialog(true)}
                >
                  Clear
                </Button>
              </Box>
            </>
          )}

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Security Note:</strong> Only your email address is remembered. 
              Your password is never stored and must be entered each time.
            </Typography>
          </Alert>
        </CardContent>
      </Card>

      {/* Clear Confirmation Dialog */}
      <Dialog open={showClearDialog} onClose={() => setShowClearDialog(false)}>
        <DialogTitle>Clear Remembered Email?</DialogTitle>
        <DialogContent>
          <Typography>
            This will remove "{rememberedEmail}" from being automatically filled in the login form.
            You can always enable "Remember me" again during your next login.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowClearDialog(false)}>Cancel</Button>
          <Button onClick={handleClearRememberedData} color="error" variant="contained">
            Clear Email
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};