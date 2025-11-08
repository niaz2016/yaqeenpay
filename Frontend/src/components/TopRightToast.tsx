import React from 'react';
import { Snackbar, Paper, Typography } from '@mui/material';

interface Props {
  open: boolean;
  message: string;
  severity?: 'error' | 'success' | 'info' | 'warning';
  autoHideDuration?: number | null;
  onClose: () => void;
}

const colorForSeverity = (severity: string | undefined) => {
  switch (severity) {
    case 'success':
      return 'success.main';
    case 'error':
      return 'error.main';
    case 'warning':
      return 'warning.main';
    default:
      return 'text.primary';
  }
};

const TopRightToast: React.FC<Props> = ({ open, message, severity = 'info', autoHideDuration = 4000, onClose }) => {
  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      onClose={onClose}
      autoHideDuration={autoHideDuration}
      slotProps={{ clickAwayListener: { mouseEvent: false } }}
    >
      <Paper sx={{ p: 2, minWidth: 300, display: 'flex', gap: 1, alignItems: 'center' }} elevation={6}>
        <Typography variant="body2" color={colorForSeverity(severity)}>
          {message}
        </Typography>
      </Paper>
    </Snackbar>
  );
};

export default TopRightToast;
