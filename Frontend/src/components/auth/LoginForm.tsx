import React, { useEffect, useRef, useState } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import { Capacitor } from '@capacitor/core';
import { mobileGoogleSignIn } from '../../services/mobileOAuth';
import { loginSchema } from '../../utils/validationSchemas';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import StorageService from '../../services/storageService';
import TechTorioLogo from '../common/TechTorioLogo';
import type { z } from 'zod';
import logger from '../../utils/logger';

type LoginFormData = z.infer<typeof loginSchema>;

const LoginForm: React.FC = () => {
  const { login, loginWithGoogle, error, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpError, setOtpError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [deviceVerificationData, setDeviceVerificationData] = useState<{
    userId: string;
    deviceId: string;
    message: string;
  } | null>(null);
  const [googleError, setGoogleError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true); // Default to checked
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState('');
  const [showEmailVerificationError, setShowEmailVerificationError] = useState(false);
  const [emailForVerification, setEmailForVerification] = useState('');
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [resendVerificationSuccess, setResendVerificationSuccess] = useState('');
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;
  
  // Removed verbose environment debug logs for production
  
  // Show Google Sign-In if we have a client ID (works in mobile apps and browsers)
  // IMPORTANT: Only treat true native (Capacitor runtime) as native; window.Capacitor can exist on web builds
  const isNative = Capacitor.isNativePlatform();
  const showGoogleSignIn = Boolean(clientId) && !isNative; // Use web button only on web

  // Get pre-filled email and message from navigation state (post-OTP verification)
  const locationState = location.state as { email?: string; message?: string } | undefined;
  const prefilledEmail = locationState?.email || StorageService.getRememberedEmail();
  const successMessage = locationState?.message || '';

  // Redirect authenticated users away from login page
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
    setValue
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: prefilledEmail,
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsSubmitting(true);
      setCaptchaError('');
      
  // Attempting login (sensitive data is not logged in production)
      
      // Validate CAPTCHA token if reCAPTCHA is enabled
      if (recaptchaSiteKey && !captchaToken) {
        setCaptchaError('Please complete the CAPTCHA verification');
        setIsSubmitting(false);
        return;
      }
      
      // Handle remember me functionality
      if (rememberMe) {
        StorageService.saveRememberedEmail(data.email);
      } else {
        StorageService.clearRememberedEmail();
      }
      
      const user = await login(data.email, data.password, captchaToken || undefined);
      
      // Reset CAPTCHA after successful login attempt
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
        setCaptchaToken(null);
      }
      
      // Redirect based on user role
      // Buyers go to marketplace, sellers/admins go to dashboard
      const userRoles = user?.roles || [];
      const isBuyer = !userRoles.some((role: string) => 
        role.toLowerCase() === 'seller' || role.toLowerCase() === 'admin'
      );
      
      if (isBuyer) {
        navigate('/marketplace', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
      
    } catch (err: any) {
      // Reset CAPTCHA on error
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
        setCaptchaToken(null);
      }
      
      // Enhanced error logging
      logger.error('[LoginForm] Login error:', err);
      
      // Check if this is an email verification error
      if (err?.message?.includes('verify your email')) {
        setShowEmailVerificationError(true);
        setEmailForVerification(data.email);
      } else {
        setShowEmailVerificationError(false);
      }
      
      // Check if device verification is required
      if (err?.requiresDeviceVerification) {
        setDeviceVerificationData({
          userId: err.userId,
          deviceId: err.deviceId,
          message: err.message || 'New device detected. Please verify with OTP.'
        });
        setShowOtpDialog(true);
        setCountdown(60); // Start 60 second countdown
        setRemainingAttempts(3); // Reset attempts
        setIsSubmitting(false);
        return;
      }
      
      // Error handling is managed by the auth context
  logger.error('Login failed:', err);
    } finally {
      if (!showOtpDialog) {
        setIsSubmitting(false);
      }
    }
  };

  // Load remembered email on component mount
  useEffect(() => {
    const rememberedEmail = StorageService.getRememberedEmail();
    if (rememberedEmail && !prefilledEmail) {
      setValue('email', rememberedEmail);
    }
  }, [setValue, prefilledEmail]);

  // Countdown timer effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    if (!showGoogleSignIn || !clientId) {
      return;
    }

  const resolvedClientId = clientId;
  let cancelled = false;

    const initializeGoogle = () => {
      if (cancelled) {
        return;
      }

      const googleAccounts = window.google?.accounts?.id;
      if (!googleAccounts) {
    logger.error('Google Identity Services SDK not available on window');
        return;
      }

      googleAccounts.initialize({
        client_id: resolvedClientId,
        callback: async (credentialResponse: GoogleCredentialResponse) => {
          if (!credentialResponse?.credential) {
            setGoogleError('Google sign-in did not return a credential.');
            return;
          }

          try {
            setGoogleError('');
            setGoogleLoading(true);
            const user = await loginWithGoogle(credentialResponse.credential);

            const userRoles = user?.roles || [];
            const isBuyerRole = !userRoles.some((role: string) =>
              role.toLowerCase() === 'seller' || role.toLowerCase() === 'admin'
            );

            if (isBuyerRole) {
              navigate('/marketplace', { replace: true });
            } else {
              navigate('/dashboard', { replace: true });
            }
          } catch (err: any) {
            logger.error('Google sign-in failed:', err);
            setGoogleError(err?.message || 'Google sign-in failed. Please try again.');
          } finally {
            setGoogleLoading(false);
          }
        },
        cancel_on_tap_outside: true
      });

      if (googleButtonRef.current) {
        googleButtonRef.current.innerHTML = '';
        googleAccounts.renderButton(googleButtonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width: 280
        });
      }
    };

    if (window.google && window.google.accounts?.id) {
      initializeGoogle();
      return () => {
        cancelled = true;
      };
    }

    let script = document.getElementById('google-identity-service') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = 'google-identity-service';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    script.addEventListener('load', initializeGoogle);

    return () => {
      cancelled = true;
      script?.removeEventListener('load', initializeGoogle);
    };
  }, [clientId, showGoogleSignIn, loginWithGoogle, navigate]);

  useEffect(() => {
    if (!showGoogleSignIn) {
      setGoogleError('');
      setGoogleLoading(false);
    }
  }, [showGoogleSignIn]);

  const handleGoogleMobile = async () => {
    if (!clientId) {
      setGoogleError('Google client ID missing');
      return;
    }
    try {
      setGoogleError('');
      setGoogleLoading(true);
      const credential = await mobileGoogleSignIn(clientId);
      const user = await loginWithGoogle(credential);
      const userRoles = user?.roles || [];
      const isBuyerRole = !userRoles.some((role: string) =>
        role.toLowerCase() === 'seller' || role.toLowerCase() === 'admin'
      );
      if (isBuyerRole) {
        navigate('/marketplace', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
  logger.error('Google mobile sign-in failed:', err);
      setGoogleError(err?.message || 'Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!deviceVerificationData || countdown > 0) return;
    
    try {
      setOtpError('');
      const result = await authService.resendDeviceOtp(
        deviceVerificationData.userId,
        deviceVerificationData.deviceId
      );
      
      setRemainingAttempts(result.remainingAttempts);
      setCountdown(60); // Reset countdown
      setOtpError(''); // Clear any previous errors
    } catch (err: any) {
      setOtpError(err.message || 'Failed to resend OTP');
    }
  };

  const handleResendVerificationEmail = async () => {
    if (!emailForVerification) return;
    
    try {
      setIsResendingVerification(true);
      setResendVerificationSuccess('');
      
      await authService.resendVerificationEmailByEmail(emailForVerification);
      
      setResendVerificationSuccess('Verification email has been resent. Please check your inbox.');
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setResendVerificationSuccess('');
      }, 5000);
    } catch (err: any) {
  logger.error('Failed to resend verification email:', err);
    } finally {
      setIsResendingVerification(false);
    }
  };

  const handleOtpSubmit = async () => {
    if (!deviceVerificationData) return;
    
    if (otpValue.length !== 6) {
      setOtpError('OTP must be 6 digits');
      return;
    }

    try {
      setIsSubmitting(true);
      setOtpError('');
      
      const user = await authService.verifyDevice(
        deviceVerificationData.userId,
        deviceVerificationData.deviceId,
        otpValue
      );

      setShowOtpDialog(false);
      
      // Redirect based on user role
      const userRoles = user?.roles || [];
      const isBuyer = !userRoles.some((role: string) => 
        role.toLowerCase() === 'seller' || role.toLowerCase() === 'admin'
      );
      
      if (isBuyer) {
        navigate('/marketplace', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
      
    } catch (err: any) {
      setOtpError(err.message || 'Failed to verify OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <>
    <Paper elevation={3} sx={{ p: 4, maxWidth: 400, width: '100%', mx: 'auto' }}>
      {/* TechTorio Logo */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <TechTorioLogo size="large" showText={true} />
      </Box>
      
      <Typography variant="h5" component="h1" gutterBottom align="center">
        Login to TechTorio
      </Typography>
      
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}
      
      {resendVerificationSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {resendVerificationSuccess}
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
          {showEmailVerificationError && (
            <Box sx={{ mt: 1 }}>
              <Button
                size="small"
                variant="text"
                onClick={handleResendVerificationEmail}
                disabled={isResendingVerification}
                sx={{ 
                  color: 'error.dark',
                  textDecoration: 'underline',
                  '&:hover': {
                    textDecoration: 'underline',
                    backgroundColor: 'transparent'
                  }
                }}
              >
                {isResendingVerification ? 'Sending...' : 'Resend verification email'}
              </Button>
            </Box>
          )}
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
        
        <FormControlLabel
          control={
            <Checkbox
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              color="primary"
              size="small"
            />
          }
          label={
            <Typography variant="body2" color="text.secondary">
              Remember my email address
            </Typography>
          }
          sx={{ mt: 1, mb: 1 }}
        />

        {/* CAPTCHA Error Display */}
        {captchaError && (
          <Alert severity="error" onClose={() => setCaptchaError('')} sx={{ mt: 2 }}>
            {captchaError}
          </Alert>
        )}

        {/* Google reCAPTCHA */}
        {recaptchaSiteKey && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={recaptchaSiteKey}
              onChange={(token: string | null) => {
                setCaptchaToken(token);
                setCaptchaError('');
              }}
              onExpired={() => {
                setCaptchaToken(null);
                setCaptchaError('CAPTCHA expired. Please verify again.');
              }}
              onErrored={() => {
                setCaptchaToken(null);
                setCaptchaError('CAPTCHA error. Please try again.');
              }}
            />
          </Box>
        )}
        
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 2, mb: 2 }}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Logging in...' : 'Login'}
        </Button>

        {showGoogleSignIn && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 1 }}>
              Or continue with
            </Typography>
            {googleError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {googleError}
              </Alert>
            )}
            <Box ref={googleButtonRef} sx={{ display: 'flex', justifyContent: 'center' }} />
            {googleLoading && (
              <Typography
                variant="caption"
                color="text.secondary"
                align="center"
                sx={{ mt: 1, display: 'block' }}
              >
                Connecting to Google...
              </Typography>
            )}
          </Box>
        )}
        {!showGoogleSignIn && Boolean(clientId) && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 1 }}>
              Or continue with
            </Typography>
            {googleError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {googleError}
              </Alert>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button variant="outlined" onClick={handleGoogleMobile} disabled={googleLoading}>
                {googleLoading ? 'Connecting to Google...' : 'Continue with Google'}
              </Button>
            </Box>
          </Box>
        )}
        
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

    {/* OTP Verification Dialog */}
    <Dialog open={showOtpDialog} onClose={() => !isSubmitting && setShowOtpDialog(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Verify New Device</DialogTitle>
      <DialogContent>
        {deviceVerificationData && (
          <>
            <Alert severity="info" sx={{ mb: 2 }}>
              {deviceVerificationData.message}
            </Alert>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Please enter the 6-digit verification code sent to your registered phone number.
            </Typography>
            {otpError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {otpError}
              </Alert>
            )}
            <TextField
              label="Enter OTP"
              value={otpValue}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setOtpValue(value);
                setOtpError('');
              }}
              fullWidth
              autoFocus
              inputProps={{ maxLength: 6, inputMode: 'numeric', pattern: '[0-9]*' }}
              helperText="6-digit code"
            />
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Remaining attempts: {remainingAttempts}
              </Typography>
              {countdown > 0 ? (
                <Typography variant="caption" color="text.secondary">
                  Resend OTP in {countdown}s
                </Typography>
              ) : (
                <Button
                  size="small"
                  onClick={handleResendOtp}
                  disabled={isSubmitting || remainingAttempts <= 0}
                >
                  Resend OTP
                </Button>
              )}
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => {
          setShowOtpDialog(false);
          setOtpValue('');
          setOtpError('');
        }} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={handleOtpSubmit} disabled={isSubmitting || otpValue.length !== 6} variant="contained">
          {isSubmitting ? 'Verifying...' : 'Verify'}
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
};

export default LoginForm;