import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const SimpleAdminDashboard: React.FC = () => {  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard - Test Version
      </Typography>
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="body1">
          This is a simplified admin dashboard for testing.
          If you can see this, the routing and access control are working.
        </Typography>
      </Paper>
      <Paper sx={{ p: 3, mt: 2, bgcolor: 'success.light' }}>
        <Typography variant="h6" gutterBottom>
          Success! Admin routes are working.
        </Typography>
        <Typography variant="body2">
          The admin layout and routing are configured correctly.
        </Typography>
      </Paper>
    </Box>
  );
};

export default SimpleAdminDashboard;