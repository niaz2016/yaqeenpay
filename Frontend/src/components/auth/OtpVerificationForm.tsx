// src/components/auth/OtpVerificationForm.tsx
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  TextField,
  Button,
  Box,
  Typography,
  Paper,
  Link,
  Alert,
} from '@mui/material';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { otpVerificationSchema } from '../../utils/validationSchemas';
import profileService from '../../services/profileService';
import { useAuth } from '../../context/AuthContext';
import type { z } from 'zod';

type OtpVerificationFormData = z.infer<typeof otpVerificationSchema>;

const OtpVerificationForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(() => {
    // If previous request was rate-limited, start with 300s (5 min) cooldown
    return sessionStorage.getItem('otp_rate_limited') ? 300 : 30;
  });
  const [canResend, setCanResend] = useState(false);
  const [info, setInfo] = useState<string | null>(
    sessionStorage.getItem('otp_rate_limited')
      ? 'Too many attempts detected. Please wait a few minutes before requesting a new code.'
      : null
  );

  // Get verification details from location state
  const email = location.state?.email || '';
  const statePhoneNumber = location.state?.phoneNumber || '';
  // Fallback to session storage (post-registration) if user refreshed and lost state
  const sessionTarget = sessionStorage.getItem('pending_login_target') || '';
  const fallbackPhone = /^\+?\d{5,}$/.test(sessionTarget) ? sessionTarget : '';
  const resolvedPhoneNumber = statePhoneNumber || fallbackPhone;
  const channel: 'email' | 'phone' = location.state?.channel || (resolvedPhoneNumber ? 'phone' : 'email');
  const target = channel === 'phone' ? resolvedPhoneNumber : email;
  const { updateUser, user } = useAuth() as any;
  
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<OtpVerificationFormData>({
    resolver: zodResolver(otpVerificationSchema),
    defaultValues: {
      code: '',
    },
  });

  // Start countdown for resend button
  useEffect(() => {
    let timer: number;
    
    if (countdown > 0 && !canResend) {
      timer = window.setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setCanResend(true);
    }
    
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [countdown, canResend]);

  // Clear the one-time rate-limit flag so it doesn't persist across sessions
  useEffect(() => {
    if (sessionStorage.getItem('otp_rate_limited')) {
      sessionStorage.removeItem('otp_rate_limited');
    }
  }, []);

  const onSubmit = async (data: OtpVerificationFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Use profile service phone verification when channel is phone
      if (channel === 'phone') {
        const result = await profileService.confirmPhoneVerification(data.code, resolvedPhoneNumber || undefined);
        if (!result || result.success === false) {
          setError('Invalid verification code. Please try again.');
          return;
        }
      } else {
        // Email fallback (if present) can be added here; for now we only handle phone channel
      }

      setSuccess('Verification successful!');
      // Optimistically set phone verified in auth state; backend will persist it
      if (user) {
        try { updateUser({ ...user, isPhoneVerified: true }); } catch {}
      }
      // Kick off a background profile refresh so badges reflect the new state
      try { await profileService.getProfile(); } catch {}
      
      // Check if this was post-registration verification
      const pendingEmail = sessionStorage.getItem('pending_login_email');
      if (pendingEmail) {
        // Clear session storage
        sessionStorage.removeItem('pending_login_email');
        sessionStorage.removeItem('pending_login_channel');
        sessionStorage.removeItem('pending_login_target');
        
        // Redirect to login with success message (password not auto-filled for security)
        setTimeout(() => {
          navigate('/auth/login', { 
            state: { 
              message: 'Phone verified successfully! Please login to continue.',
              email: pendingEmail 
            }
          });
        }, 1000);
        return;
      }

      // Fallback: redirect based on context
      setTimeout(() => {
        if (location.state?.fromPasswordReset) {
          navigate('/auth/reset-password', { state: { email: target } });
        } else {
          navigate('/auth/login');
        }
      }, 1000);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Verification failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setError(null);
      
      // Call resend OTP endpoint
      setCanResend(false);
      setCountdown(30);
      // Request a new OTP via profile endpoint when verifying phone
      if (channel === 'phone') {
        try {
          await profileService.requestPhoneVerification(resolvedPhoneNumber || undefined);
          setSuccess('A new verification code has been sent.');
          setInfo(null);
        } catch (e) {
          const msg = e instanceof Error ? e.message : '';
          if (/too many attempts/i.test(msg)) {
            setError(null);
            setInfo('You’ve hit the limit. Please wait a few minutes before trying again.');
            setCountdown(300);
            setCanResend(false);
            return;
          }
          throw e;
        }
      } else {
        setSuccess(null);
        setError('Could not resend code. Please try again in a moment.');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to resend code. Please try again.');
      }
    }
  };

  // Mask phone/email a bit for privacy in UI
  const displayTarget = channel === 'phone'
    ? (resolvedPhoneNumber ? resolvedPhoneNumber.replace(/(\d{3})\d+(\d{2})$/, '$1******$2') : 'your phone')
    : (email || 'your email');

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 400, width: '100%', mx: 'auto' }}>
      <Typography variant="h5" component="h1" gutterBottom align="center">
        Verify Your {channel === 'email' ? 'Email' : 'Phone'}
      </Typography>

      <Typography variant="body2" sx={{ mb: 3, textAlign: 'center' }}>
        We've sent a verification code to <strong>{displayTarget}</strong>. Please enter it below.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {info && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {info}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Controller
          name="code"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              margin="normal"
              required
              fullWidth
              id="code"
              label="Verification Code"
              autoFocus
              error={!!errors.code}
              helperText={errors.code?.message}
              inputProps={{
                maxLength: 6,
              }}
            />
          )}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Verifying...' : 'Verify'}
        </Button>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2">
            Didn't receive a code?{' '}
            {canResend ? (
              <Link component="button" variant="body2" onClick={handleResendCode}>
                Resend Code
              </Link>
            ) : (
              <Typography component="span" variant="body2" color="text.secondary">
                Resend in {countdown}s
              </Typography>
            )}
          </Typography>
        </Box>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2">
            <Link component={RouterLink} to="/auth/login">
              Back to Login
            </Link>
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default OtpVerificationForm;