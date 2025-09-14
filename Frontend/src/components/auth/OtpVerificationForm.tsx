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
import authService from '../../services/authService';
import type { z } from 'zod';

type OtpVerificationFormData = z.infer<typeof otpVerificationSchema>;

const OtpVerificationForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // Get verification details from location state
  const email = location.state?.email || '';
  const channel = location.state?.channel || 'email';
  
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

  const onSubmit = async (data: OtpVerificationFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      const result = await authService.verifyOtp({
        channel,
        target: email,
        code: data.code,
      });
      
      if (result.success) {
        setSuccess('Verification successful!');
        
        // Redirect based on verification context
        setTimeout(() => {
          if (location.state?.fromPasswordReset) {
            navigate('/auth/reset-password', { 
              state: { email } 
            });
          } else {
            navigate('/auth/login');
          }
        }, 1500);
      } else {
        setError('Invalid verification code. Please try again.');
      }
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
      
      // Here you would call a resend OTP endpoint
      // For now, we'll just simulate it with a timeout
      setCanResend(false);
      setCountdown(30);
      
      // Simulate API call to resend OTP
      setTimeout(() => {
        setSuccess('Verification code resent successfully!');
      }, 1000);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to resend code. Please try again.');
      }
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 400, width: '100%', mx: 'auto' }}>
      <Typography variant="h5" component="h1" gutterBottom align="center">
        Verify Your {channel === 'email' ? 'Email' : 'Phone'}
      </Typography>

      <Typography variant="body2" sx={{ mb: 3, textAlign: 'center' }}>
        We've sent a verification code to{' '}
        <strong>{email || 'your ' + channel}</strong>. Please enter it below.
      </Typography>

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