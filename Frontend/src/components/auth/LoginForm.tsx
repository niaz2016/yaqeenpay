// src/components/auth/LoginForm.tsx
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
  Alert
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { loginSchema } from '../../utils/validationSchemas';
import { useAuth } from '../../context/AuthContext';
import type { z } from 'zod';

type LoginFormData = z.infer<typeof loginSchema>;

const LoginForm: React.FC = () => {
  const { login, error } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const { 
    control, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsSubmitting(true);
      await login(data.email, data.password);
      
      // Always redirect to dashboard after login
      navigate('/dashboard', { replace: true });
      
    } catch (err) {
      // Error handling is managed by the auth context
      console.error('Login failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 400, width: '100%', mx: 'auto' }}>
      <Typography variant="h5" component="h1" gutterBottom align="center">
        Login to YaqeenPay
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
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
              autoFocus
              error={!!errors.email}
              helperText={errors.email?.message}
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
              autoComplete="current-password"
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
        
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Logging in...' : 'Login'}
        </Button>
        
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Link component={RouterLink} to="/auth/forgot-password" variant="body2">
            Forgot password?
          </Link>
        </Box>
        
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2">
            Don't have an account?{' '}
            <Link component={RouterLink} to="/auth/register">
              Register
            </Link>
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default LoginForm;