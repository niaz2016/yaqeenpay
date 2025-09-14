// src/pages/auth/LoginPage.tsx
import React from 'react';
import { Container, Box } from '@mui/material';
import LoginForm from '../../components/auth/LoginForm';

const LoginPage: React.FC = () => {
  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <LoginForm />
      </Box>
    </Container>
  );
};

export default LoginPage;