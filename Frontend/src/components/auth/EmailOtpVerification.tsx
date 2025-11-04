// src/components/auth/EmailOtpVerification.tsx
import React, { useState } from 'react';
import { Box, Typography, Button, Alert, Paper } from '@mui/material';
import { Email } from '@mui/icons-material';
import apiService from '../../services/api';

interface EmailOtpVerificationProps {
  userId: string;
  email: string;
  onVerificationSuccess: () => void; // kept for compatibility; not used in link flow
}

const EmailOtpVerification: React.FC<EmailOtpVerificationProps> = ({
  userId,
  email,
}) => {
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

  const handleResendLink = async () => {
    setIsResending(true);
    setError(null);
    setResendSuccess(null);

    try {
      await apiService.post<{ success: boolean; message: string }>('/auth/resend-verification-email', {
        userId,
      });

      setResendSuccess('Verification email has been resent. Please check your inbox.');
      setTimeout(() => setResendSuccess(null), 5000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to resend verification email.';
      setError(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: { xs: 3, sm: 4 }, maxWidth: 500, mx: 'auto', width: '100%' }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Email sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
        <Typography variant="h5" component="h2" gutterBottom fontWeight={600}>
          Verify Your Email
        </Typography>
      </Box>

      {/* Success message about registration */}
      <Alert severity="success" sx={{ mb: 3 }}>
        <strong>Registration successful!</strong> We've sent a verification link to <strong>{email}</strong>.
      </Alert>

      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Please check your inbox and click the link to verify your email. If you don't see it, check your spam folder.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {resendSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {resendSuccess}
        </Alert>
      )}

      {/* No OTP input needed in link-based flow */}

      <Box sx={{ textAlign: 'center', mt: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Didn't receive the email?
        </Typography>
        <Button
          variant="text"
          onClick={handleResendLink}
          disabled={isResending}
          sx={{ mt: 1 }}
        >
          {isResending ? 'Sending...' : 'Resend verification email'}
        </Button>
      </Box>

      <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary" display="block">
          💡 <strong>Note:</strong> The verification link expires in 24 hours.
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
          🔒 If you don't receive the email, please check your spam folder.
        </Typography>
      </Box>
    </Paper>
  );
};

export default EmailOtpVerification;
