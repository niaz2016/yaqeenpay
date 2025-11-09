// src/components/auth/RegisterForm.tsx
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
  InputAdornment,
  IconButton,
  Alert,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { registerSchema } from '../../utils/validationSchemas';
import { useAuth } from '../../context/AuthContext';
import type { z } from 'zod';

type RegisterFormData = z.infer<typeof registerSchema>;

const RegisterForm: React.FC = () => {
  const { register, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Redirect authenticated users away from register page
  useEffect(() => {
    if (isAuthenticated && user) {
      const userRoles = user.roles || [];
      const isBuyer = !userRoles.some((role: string) => 
        role.toLowerCase() === 'seller' || role.toLowerCase() === 'admin'
      );
      
      if (isBuyer) {
        navigate('/marketplace', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
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

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      await register({
        email: data.email,
        userName: data.userName || data.email,
        phoneNumber: data.phoneNumber,
        password: data.password,
        confirmPassword: data.confirmPassword,
        firstName: data.firstName,
        lastName: data.lastName,
      });

      setSuccess('Registration successful! Please check your email for a verification link to activate your account.');
      
      // Redirect to login page after showing success message
      setTimeout(() => {
        navigate('/auth/login', { 
          state: { 
            message: 'Registration successful! Please check your email and click the verification link to activate your account.',
          } 
        });
      }, 3000);
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

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 600, width: '100%', mx: 'auto' }}>
      <Typography variant="h5" component="h1" gutterBottom align="center">
        Create Your TechTorio Account
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
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 2,
        }}>
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
                  autoComplete="given-name"
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
                  margin="normal"
                  required
                  fullWidth
                  id="lastName"
                  label="Last Name"
                  autoComplete="family-name"
                  error={!!errors.lastName}
                  helperText={errors.lastName?.message}
                />
              )}
            />
        </Box>

        <Controller
          name="userName"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              margin="normal"
              fullWidth
              id="userName"
              label="Username (optional)"
              autoComplete="username"
              helperText={errors.userName?.message || 'If left empty, your email will be used as username'}
            />
          )}
        />

        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              autoComplete="email"
              error={!!errors.email}
              helperText={errors.email?.message}
            />
          )}
        />

        <Controller
          name="phoneNumber"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              margin="normal"
              fullWidth
              id="phoneNumber"
              label="Mobile Number"
              autoComplete="tel"
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
              margin="normal"
              required
              fullWidth
              id="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              error={!!errors.password}
              helperText={errors.password?.message}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={togglePasswordVisibility}
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
              margin="normal"
              required
              fullWidth
              id="confirmPassword"
              label="Confirm Password"
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
                  required
                />
              }
              label={
                <Typography variant="body2">
                  I agree to the{' '}
                  <Link component={RouterLink} to="/terms">
                    Terms and Conditions
                  </Link>{' '}
                  and{' '}
                  <Link component={RouterLink} to="/privacy">
                    Privacy Policy
                  </Link>
                </Typography>
              }
            />
          )}
        />
        {errors.termsAccepted && (
          <Typography color="error" variant="caption">
            {errors.termsAccepted.message}
          </Typography>
        )}

        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Registering...' : 'Register'}
        </Button>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2">
            Already have an account?{' '}
            <Link component={RouterLink} to="/auth/login">
              Login
            </Link>
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default RegisterForm;