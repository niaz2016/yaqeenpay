// src/components/common/SuspenseLoader.tsx
import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

interface SuspenseLoaderProps {
  message?: string;
}

const SuspenseLoader: React.FC<SuspenseLoaderProps> = ({ message = 'Loading...' }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        gap: 2,
      }}
    >
      <CircularProgress size={50} />
      <Typography variant="body1" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
};

export default SuspenseLoader;
