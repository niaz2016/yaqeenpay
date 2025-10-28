// src/pages/auth/ForgotPasswordPage.tsx
import React from 'react';
import { Container, Box, useTheme, useMediaQuery } from '@mui/material';
import ForgotPasswordForm from '../../components/auth/ForgotPasswordForm';

const ForgotPasswordPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Container maxWidth={isMobile ? 'sm' : 'md'} sx={{ px: { xs: 2, sm: 3 } }}>
      <Box sx={{ mt: { xs: 4, sm: 8 }, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <ForgotPasswordForm />
      </Box>
    </Container>
  );
};

export default ForgotPasswordPage;