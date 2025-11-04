// src/components/auth/BuyerRegisterForm.tsx
import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  TextField,
  Button,
  Box,
  Typography,
  Paper,
  Link,
  InputAdornment,
  IconButton,
  Alert,
  Checkbox,
  FormControlLabel,
  Divider,
} from '@mui/material';
import { Visibility, VisibilityOff, ArrowBack, ShoppingCart } from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { registerSchema } from '../../utils/validationSchemas';
import { useAuth } from '../../context/AuthContext';
import type { z } from 'zod';
import EmailOtpVerification from './EmailOtpVerification';

type BuyerRegisterFormData = z.infer<typeof registerSchema>;

interface BuyerRegisterFormProps {
  onBack: () => void;
}

const BuyerRegisterForm: React.FC<BuyerRegisterFormProps> = ({ onBack }) => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Email verification state
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<BuyerRegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      userName: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      termsAccepted: false,
    },
  });

  const onSubmit = async (data: BuyerRegisterFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      const userId = await register({
        ...data,
        role: 'buyer', // Explicitly set role as buyer
        userName: data.userName || data.email,
      });

      // Store userId and email for verification
      if (userId) {
        setUserId(userId);
        setUserEmail(data.email);
        // Don't set success message here - it will be shown in EmailOtpVerification
        setShowEmailVerification(true);
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerificationSuccess = () => {
    // Clear session storage from old phone verification flow
    sessionStorage.removeItem('pending_login_email');
    sessionStorage.removeItem('pending_login_channel');
    sessionStorage.removeItem('pending_login_target');
    sessionStorage.removeItem('otp_rate_limited');
    
    // Navigate to login with success message
    navigate('/auth/login', { 
      state: { 
        message: 'Email verified successfully! You can now log in to your account.' 
      } 
    });
  };

  // If showing email verification, render that instead
  if (showEmailVerification && userId && userEmail) {
    return (
      <EmailOtpVerification
        userId={userId}
        email={userEmail}
        onVerificationSuccess={handleVerificationSuccess}
      />
    );
  }

  return (
    <Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 600, mx: 'auto', width: '100%' }}>
      <Box sx={{ textAlign: 'center', mb: { xs: 2, sm: 4 } }}>
        <ShoppingCart sx={{ fontSize: { xs: 36, sm: 48 }, color: 'primary.main', mb: 2 }} />
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
          Buyer Registration
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
          Join YaqeenPay to start shopping securely
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
            <Controller
              name="firstName"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="First Name"
                  fullWidth
                  error={!!errors.firstName}
                  helperText={errors.firstName?.message}
                />
              )}
            />
            <Controller
              name="lastName"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Last Name"
                  fullWidth
                  error={!!errors.lastName}
                  helperText={errors.lastName?.message}
                />
              )}
            />
          </Box>

          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Email Address"
                type="email"
                fullWidth
                error={!!errors.email}
                helperText={errors.email?.message}
              />
            )}
          />

          <Controller
            name="userName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Username (Optional)"
                fullWidth
                error={!!errors.userName}
                helperText={errors.userName?.message || "Leave blank to use your email"}
              />
            )}
          />

          <Controller
            name="phoneNumber"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Mobile Number"
                fullWidth
                required
                error={!!errors.phoneNumber}
                helperText={errors.phoneNumber?.message}
              />
            )}
          />

          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Password"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                error={!!errors.password}
                helperText={errors.password?.message}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
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
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                fullWidth
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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

          <Controller
            name="termsAccepted"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Checkbox
                    {...field}
                    checked={field.value}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2">
                    I agree to the{' '}
                    <Link component={RouterLink} to="/terms" target="_blank">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link component={RouterLink} to="/privacy" target="_blank">
                      Privacy Policy
                    </Link>
                  </Typography>
                }
              />
            )}
          />
          {errors.termsAccepted && (
            <Typography variant="caption" color="error">
              {errors.termsAccepted.message}
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 0 },
          justifyContent: 'space-between' 
        }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={onBack}
            variant="outlined"
            fullWidth={true}
            sx={{ maxWidth: { xs: '100%', sm: 'auto' } }}
          >
            Back to Role Selection
          </Button>

          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            fullWidth={true}
            sx={{ maxWidth: { xs: '100%', sm: 'auto' } }}
          >
            {isSubmitting ? 'Creating Account...' : 'Create Buyer Account'}
          </Button>
        </Box>
      </form>

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Already have an account?{' '}
          <Link component={RouterLink} to="/auth/login">
            Sign In
          </Link>
        </Typography>
      </Box>
    </Paper>
  );
};

export default BuyerRegisterForm;