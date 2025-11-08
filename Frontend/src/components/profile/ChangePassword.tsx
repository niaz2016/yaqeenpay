// src/components/profile/ChangePassword.tsx
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  TextField,
  Button,
  Box,
  Typography,
  Paper,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import TopRightToast from '../TopRightToast';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { changePasswordSchema, setPasswordSchema } from '../../utils/validationSchemas';
import profileService from '../../services/profileService';
import type { z } from 'zod';

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
type SetPasswordFormData = z.infer<typeof setPasswordSchema>;

const ChangePassword: React.FC = () => {
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch profile to check if user has password
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await profileService.getProfile();
        setHasPassword(profile.hasPassword);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setHasPassword(true); // Default to true if fetch fails
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormData | SetPasswordFormData>({
    resolver: zodResolver(hasPassword ? changePasswordSchema : setPasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ChangePasswordFormData | SetPasswordFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      const result = await profileService.changePassword({
        currentPassword: hasPassword ? (data as ChangePasswordFormData).currentPassword : undefined,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });
      
      if (result.success) {
        setSuccess(result.message || (hasPassword ? 'Password changed successfully!' : 'Password set successfully!'));
        reset(); // Reset form
        setHasPassword(true); // User now has a password
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
      setIsSubmitting(false);
    }
  };

  const toggleCurrentPasswordVisibility = () => {
    setShowCurrentPassword((prev) => !prev);
  };

  const toggleNewPasswordVisibility = () => {
    setShowNewPassword((prev) => !prev);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  if (loading) {
    return (
      <Paper elevation={3} sx={{ p: 3, mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress />
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        {hasPassword ? 'Change Password' : 'Set Password'}
      </Typography>
      
      {!hasPassword && (
        <Alert severity="info" sx={{ mb: 2 }}>
          You registered using Google OAuth and don't have a password yet. Set a password to enable traditional login.
        </Alert>
      )}
      
      <TopRightToast open={Boolean(error)} message={error || ''} severity="error" onClose={() => setError(null)} />
      <TopRightToast open={Boolean(success)} message={success || ''} severity="success" onClose={() => setSuccess(null)} />
      
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ mt: 2 }}>
        {hasPassword && (
          <Controller
            name="currentPassword"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                margin="normal"
                required
                fullWidth
                id="currentPassword"
                label="Current Password"
                type={showCurrentPassword ? 'text' : 'password'}
                error={!!(errors as any).currentPassword}
                helperText={(errors as any).currentPassword?.message}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle current password visibility"
                        onClick={toggleCurrentPasswordVisibility}
                        edge="end"
                      >
                        {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />
        )}
        
        <Controller
          name="newPassword"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              margin="normal"
              required
              fullWidth
              id="newPassword"
              label={hasPassword ? "New Password" : "Password"}
              type={showNewPassword ? 'text' : 'password'}
              error={!!errors.newPassword}
              helperText={errors.newPassword?.message}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle new password visibility"
                      onClick={toggleNewPasswordVisibility}
                      edge="end"
                    >
                      {showNewPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          )}
        />
        
        <Controller
          name="confirmPassword"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              margin="normal"
              required
              fullWidth
              id="confirmPassword"
              label={hasPassword ? "Confirm New Password" : "Confirm Password"}
              type={showConfirmPassword ? 'text' : 'password'}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={toggleConfirmPasswordVisibility}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          )}
        />
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? `${hasPassword ? 'Changing' : 'Setting'} Password...` : `${hasPassword ? 'Change' : 'Set'} Password`}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default ChangePassword;