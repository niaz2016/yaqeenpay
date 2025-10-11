import React, { useEffect, useState } from 'react';
import { Snackbar, Alert } from '@mui/material';

interface SentNotificationInfo {
  title: string;
  message: string;
  type: string;
  data?: Record<string, any>;
}

const NotificationSentToaster: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState<SentNotificationInfo | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as any;
      if (!detail) return;
      setInfo({
        title: detail.title,
        message: detail.message,
        type: detail.type,
        data: detail.data
      });
      setOpen(true);
    };
    window.addEventListener('app:notification-sent', handler as any);
    return () => window.removeEventListener('app:notification-sent', handler as any);
  }, []);

  return (
    <Snackbar
      open={open}
      autoHideDuration={3500}
      onClose={() => setOpen(false)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        onClose={() => setOpen(false)}
        severity={info?.type?.includes('error') ? 'error' : 'success'}
        variant="filled"
        sx={{ width: '100%' }}
      >
        <strong>{info?.title}</strong>{info?.message ? ` — ${info.message}` : ''}
      </Alert>
    </Snackbar>
  );
};

export default NotificationSentToaster;