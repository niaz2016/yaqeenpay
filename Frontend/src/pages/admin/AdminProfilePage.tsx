import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import ChangePassword from '../../components/profile/ChangePassword';

const AdminProfilePage: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Account
        </Typography>
      </Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="body1" color="text.secondary" paragraph>
          Update your password and manage your admin account security.
        </Typography>
      </Box>
      <ChangePassword />
    </Container>
  );
};

export default AdminProfilePage;
