// src/pages/profile/ProfilePage.tsx
import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import ChangePassword from '../../components/profile/ChangePassword';

const ProfilePage: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Account
        </Typography>
      </Box>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="body1" color="text.secondary" paragraph>
          Manage your personal information and account security.
        </Typography>
      </Box>
      
      {/* TODO: Add ProfileDetails component once Grid issues are fixed */}
      
      <ChangePassword />
    </Container>
  );
};

export default ProfilePage;