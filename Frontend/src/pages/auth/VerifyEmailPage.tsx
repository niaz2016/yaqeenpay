// src/pages/auth/VerifyEmailPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import { CheckCircle, Error } from '@mui/icons-material';
import apiService from '../../services/api';
import TechTorioLogo from '../../components/common/TechTorioLogo';

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const userId = searchParams.get('userId');
      const token = searchParams.get('token');

      if (!userId || !token) {
        setStatus('error');
        setMessage('Invalid verification link. Please check your email and try again.');
        return;
      }

      try {
        const response = await apiService.post<{ success: boolean; message: string }>(
          '/auth/verify-email-by-token',
          {
            userId,
            token,
          }
        );

        setStatus('success');
        setMessage(response.message || 'Email verified successfully! You can now log in.');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/auth/login', {
            state: {
              message: 'Email verified successfully! You can now log in.',
            },
          });
        }, 3000);
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'Verification failed. Please try again or request a new verification email.');
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Paper elevation={3} sx={{ p: 4, maxWidth: 500, width: '100%', textAlign: 'center' }}>
        <Box sx={{ mb: 3 }}>
          <TechTorioLogo size="large" showText={true} />
        </Box>

        <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3 }}>
          Email Verification
        </Typography>

        {status === 'verifying' && (
          <Box>
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="body1" color="text.secondary">
              Verifying your email address...
            </Typography>
          </Box>
        )}

        {status === 'success' && (
          <Box>
            <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Alert severity="success" sx={{ mb: 2 }}>
              {message}
            </Alert>
            <Typography variant="body2" color="text.secondary">
              Redirecting to login page...
            </Typography>
          </Box>
        )}

        {status === 'error' && (
          <Box>
            <Error sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
            <Alert severity="error" sx={{ mb: 3 }}>
              {message}
            </Alert>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                onClick={() => navigate('/auth/login')}
              >
                Go to Login
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/auth/register')}
              >
                Register Again
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default VerifyEmailPage;
