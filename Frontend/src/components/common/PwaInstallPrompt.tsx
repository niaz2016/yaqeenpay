// src/components/common/PwaInstallPrompt.tsx
import React, { useEffect, useState } from 'react';
import { Button, Snackbar, Alert, Slide, Box } from '@mui/material';

// Extended window typing for beforeinstallprompt event
declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
  interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  }
}

function isMobileUA() {
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
  return /android|iphone|ipad|ipod|iemobile|wpdesktop|windows phone/i.test(ua);
}

function isStandalone() {
  // Detect if already installed PWA
  return (
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    (navigator as any).standalone === true
  );
}

function startOfTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
}

interface Props {
  position?: 'bottom' | 'top';
}

const PwaInstallPrompt: React.FC<Props> = ({ position = 'bottom' }) => {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (e: BeforeInstallPromptEvent) => {
      // Prevent the mini-infobar on mobile
      e.preventDefault();
      setDeferred(e);

      // Decide whether to show prompt based on our rules
      const today = startOfTodayKey();
      const lastShown = localStorage.getItem('pwa_prompt_last_shown');
      const isFirstToday = lastShown !== today;

      const onPhone = isMobileUA();
      const notInstalled = !isStandalone();

      if (onPhone && notInstalled && isFirstToday) {
        setOpen(true);
      }
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  // Also allow showing once per day on first app load if conditions are met, even if event didn't fire yet
  useEffect(() => {
    // Only relevant on mobile in browser and not yet installed
    if (!isMobileUA() || isStandalone()) return;

    const today = startOfTodayKey();
    const lastShown = localStorage.getItem('pwa_prompt_last_shown');
    const isFirstToday = lastShown !== today;

    if (isFirstToday) {
      // We'll open the snackbar when the event arrives; if not, user can still navigate until it does
      // Some browsers (iOS Safari) don't support beforeinstallprompt; we can show a generic A2HS hint
      if (!(window as any).BeforeInstallPromptEvent) {
        // For iOS: show hint using open state without deferred
        setOpen(true);
      }
    }
  }, []);

  const handleInstallClick = async () => {
    const today = startOfTodayKey();
    localStorage.setItem('pwa_prompt_last_shown', today);

    if (deferred) {
      await deferred.prompt();
      try {
        const choice = await deferred.userChoice;
        if (choice.outcome === 'accepted') {
          setOpen(false);
        } else {
          // user dismissed; keep quiet until next day
          setOpen(false);
        }
      } finally {
        setDeferred(null);
      }
    } else {
      // iOS or unsupported: show instructions (open a small tip)
      alert('To install this app: open the browser menu and choose "Add to Home Screen".');
      setOpen(false);
    }
  };

  const handleClose = () => {
    const today = startOfTodayKey();
    localStorage.setItem('pwa_prompt_last_shown', today);
    setOpen(false);
  };

  return (
    <Snackbar
      open={open}
      onClose={handleClose}
      TransitionComponent={(props) => <Slide {...props} direction={position === 'bottom' ? 'up' : 'down'} />}
      anchorOrigin={{ vertical: position === 'bottom' ? 'bottom' : 'top', horizontal: 'center' }}
      sx={{ zIndex: 1400 }}
    >
      <Alert
        icon={false}
        severity="info"
        action={
          <Button color="inherit" size="small" onClick={handleInstallClick}>
            Install
          </Button>
        }
        onClose={handleClose}
        sx={{ width: '100%' }}
      >
        <Box>
          Install YaqeenPay on your phone for a faster, app-like experience.
        </Box>
      </Alert>
    </Snackbar>
  );
};

export default PwaInstallPrompt;
