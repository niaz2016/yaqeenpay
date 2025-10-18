// src/components/profile/ProfileDetails.tsx
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  TextField,
  Button,
  Box,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Chip,
  Stack,
} from '@mui/material';
import profileService from '../../services/profileService';
import { useAuth } from '../../context/AuthContext';
import type { ProfileDetails as ProfileDetailsType } from '../../types/profile';

// Validation schema for profile form
const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phoneNumber: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const ProfileDetails: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileDetailsType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    getValues,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phoneNumber: '',
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    },
  });

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const profileData = await profileService.getProfile();
        setProfile(profileData);
        
        // Reset form with profile data
        reset({
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          phoneNumber: profileData.phoneNumber || '',
          street: profileData.address || '',
          city: profileData.city || '',
          state: profileData.state || '',
          postalCode: profileData.postalCode || '',
          country: profileData.country || '',
        });
      } catch (err) {
        console.error('Failed to load profile:', err);
        setError('Failed to load profile data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [reset]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setSaving(true);
      setError(null);
      
      const updatedProfile = await profileService.updateProfile({
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        address: data.street,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
      });
      
      setProfile(updatedProfile);
      setSuccess('Profile updated successfully!');
      
      // Update user in auth context if needed
      if (user) {
        updateUser({
          ...user,
          firstName: data.firstName,
          lastName: data.lastName,
          phoneNumber: data.phoneNumber,
          address: data.street,
          city: data.city,
          state: data.state,
          country: data.country,
          postalCode: data.postalCode,
        });
      }
      
      // Clear success message after delay
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to update profile. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyEmail = async () => {
    try {
      setError(null);
      const result = await profileService.verifyEmail();
      setSuccess(result.message || 'Email verification completed.');
      setProfile((prev) => prev ? { ...prev, isEmailVerified: true } : prev);
      if (user) {
        updateUser({ ...user, isEmailVerified: true });
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to send verification email. Please try again.');
      }
    }
  };

  const [otpRequested, setOtpRequested] = useState(false);
  const [otpPhoneMasked, setOtpPhoneMasked] = useState<string | undefined>(undefined);
  const [otpCode, setOtpCode] = useState('');

  // Track if the phone input differs from the saved profile phone
  const watchedPhone = watch('phoneNumber');
  const savedPhone = (profile?.phoneNumber || '').trim();
  const phoneEdited = (watchedPhone || '').trim() !== savedPhone;

  const handleRequestPhoneOtp = async () => {
    try {
      setError(null);
      // Ensure we send OTP to the current typed number, saving it first if changed
      const currentPhone = (getValues('phoneNumber') || '').trim();
      const savedPhone = (profile?.phoneNumber || '').trim();

      if (!currentPhone) {
        setError('Please enter a phone number before verifying.');
        return;
      }

      // If user edited phone and hasn't clicked Save, persist it now
      if (currentPhone !== savedPhone) {
        try {
          const formVals = getValues();
          const updated = await profileService.updateProfile({
            firstName: formVals.firstName,
            lastName: formVals.lastName,
            phoneNumber: currentPhone,
            address: formVals.street,
            city: formVals.city,
            state: formVals.state,
            postalCode: formVals.postalCode,
            country: formVals.country,
          });
          setProfile(updated);
          if (user) {
            updateUser({ ...user, phoneNumber: currentPhone });
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Failed to save phone number before verifying.';
          setError(msg);
          return; // don't proceed to OTP if we couldn't save
        }
      }
      const res = await profileService.requestPhoneVerification();
      setOtpRequested(true);
      setOtpPhoneMasked((res as any)?.phone);
      setSuccess(res?.message || 'OTP sent to your phone');
    } catch (err) {
      if (err instanceof Error) setError(err.message); else setError('Failed to request OTP.');
      setOtpRequested(false);
    }
  };

  const handleConfirmPhoneOtp = async () => {
    try {
      setError(null);
      const res = await profileService.confirmPhoneVerification(otpCode);
      if (res && res.success !== false) {
        setSuccess(res.message || 'Phone verified successfully');
        // refresh profile state so chip updates
        const refreshed = await profileService.getProfile();
        setProfile(refreshed);
        if (user) {
          updateUser({ ...user, isPhoneVerified: true });
        }
        setOtpRequested(false);
        setOtpCode('');
      } else {
        setError(res?.message || 'Invalid or expired OTP');
        // Return to the initial state so the Verify button shows again
        setOtpRequested(false);
        setOtpCode('');
      }
    } catch (err) {
      if (err instanceof Error) setError(err.message); else setError('Failed to verify OTP.');
      setOtpRequested(false);
    }
  };

  const handleSavePhoneOnly = async () => {
    // Save the entire form so we don't drop other edits
    if (otpRequested) {
      setOtpRequested(false);
      setOtpCode('');
    }
    await handleSubmit(onSubmit)();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Box sx={{ flex: 1 }}>
            <Controller
              name="firstName"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin="normal"
                  required
                  fullWidth
                  id="firstName"
                  label="First Name"
                  error={!!errors.firstName}
                  helperText={errors.firstName?.message}
                />
              )}
            />
          </Box>
          
          <Box sx={{ flex: 1 }}>
            <Controller
              name="lastName"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin="normal"
                  required
                  fullWidth
                  id="lastName"
                  label="Last Name"
                  error={!!errors.lastName}
                  helperText={errors.lastName?.message}
                />
              )}
            />
          </Box>
        </Stack>
        
        <Box sx={{ mt: 2, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Contact Information
          </Typography>
          
          <Stack spacing={2}>
            <Box>
              <TextField
                fullWidth
                label="Email Address"
                value={profile?.email || ''}
                disabled
                InputProps={{
                  endAdornment: (
                    <Chip 
                      size="small" 
                      color={profile?.isEmailVerified ? "success" : "warning"}
                      label={profile?.isEmailVerified ? "Verified" : "Unverified"}
                      sx={{ ml: 1 }}
                    />
                  ),
                }}
              />
              {!profile?.isEmailVerified && (
                <Button 
                  size="small" 
                  onClick={handleVerifyEmail}
                  sx={{ mt: 1 }}
                >
                  Verify Email
                </Button>
              )}
            </Box>
            
            <Box>
              <Controller
                name="phoneNumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Phone Number"
                    error={!!errors.phoneNumber}
                    helperText={errors.phoneNumber?.message}
                    onChange={(e) => {
                      field.onChange(e);
                      // If user edits phone during an OTP session, reset to show Verify button
                      if (otpRequested) {
                        setOtpRequested(false);
                        setOtpCode('');
                      }
                    }}
                    InputProps={{
                      endAdornment: (
                        <Chip 
                          size="small" 
                          color={profile?.isPhoneVerified ? 'success' : 'warning'}
                          label={profile?.isPhoneVerified ? 'Verified' : 'Unverified'}
                          sx={{ ml: 1 }}
                        />
                      ),
                    }}
                  />
                )}
              />
              {!profile?.isPhoneVerified && (
                <Box sx={{ mt: 1, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                  {phoneEdited ? (
                    <Button size="small" variant="outlined" onClick={handleSavePhoneOnly} disabled={saving}>
                      Save phone
                    </Button>
                  ) : profile?.phoneNumber ? (
                    !otpRequested ? (
                      <Button size="small" variant="outlined" onClick={handleRequestPhoneOtp}>
                        Verify Phone
                      </Button>
                    ) : (
                      <>
                        <Typography variant="body2" color="text.secondary">
                          Code sent to {otpPhoneMasked || 'your phone'}
                        </Typography>
                        <TextField
                          size="small"
                          label="OTP"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          inputProps={{ maxLength: 6 }}
                          sx={{ width: 150 }}
                        />
                        <Button size="small" variant="contained" onClick={handleConfirmPhoneOtp}>
                          Confirm
                        </Button>
                      </>
                    )
                  ) : null}
                </Box>
              )}
            </Box>
          </Stack>
        </Box>
        
        <Box sx={{ mt: 3, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Address Information
          </Typography>
          
          <Stack spacing={2}>
            <Box>
              <Controller
                name="street"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Street Address"
                    error={!!errors.street}
                    helperText={errors.street?.message}
                  />
                )}
              />
            </Box>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <Controller
                  name="city"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="City"
                      error={!!errors.city}
                      helperText={errors.city?.message}
                    />
                  )}
                />
              </Box>
              
              <Box sx={{ flex: 1 }}>
                <Controller
                  name="state"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="State/Province"
                      error={!!errors.state}
                      helperText={errors.state?.message}
                    />
                  )}
                />
              </Box>
            </Stack>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <Controller
                  name="postalCode"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Postal Code"
                      error={!!errors.postalCode}
                      helperText={errors.postalCode?.message}
                    />
                  )}
                />
              </Box>
              
              <Box sx={{ flex: 1 }}>
                <Controller
                  name="country"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Country"
                      error={!!errors.country}
                      helperText={errors.country?.message}
                    />
                  )}
                />
              </Box>
            </Stack>
          </Stack>
        </Box>
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            disabled={saving || !isDirty}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default ProfileDetails;