// src/pages/auth/VerifyOtpPage.tsx
import React from 'react';
import { Container, Box } from '@mui/material';
import OtpVerificationForm from '../../components/auth/OtpVerificationForm';

const VerifyOtpPage: React.FC = () => {
  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <OtpVerificationForm />
      </Box>
    </Container>
  );
};

export default VerifyOtpPage;