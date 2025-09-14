// src/pages/auth/ResetPasswordPage.tsx
import React from 'react';
import { Container, Box } from '@mui/material';
import ResetPasswordForm from '../../components/auth/ResetPasswordForm';

const ResetPasswordPage: React.FC = () => {
  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <ResetPasswordForm />
      </Box>
    </Container>
  );
};

export default ResetPasswordPage;