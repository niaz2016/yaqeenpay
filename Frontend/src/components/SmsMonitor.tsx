import React, { useEffect, useState } from 'react';
import { Alert, Snackbar } from '@mui/material';
import { smsService } from '../services/smsService';
import type { SmsMessage } from '../services/smsService';
import authService from '../services/authService';
import logger from '../utils/logger';

interface SmsMonitorProps {
  isOtpPending?: boolean;
  onOtpDetected?: (otp: string) => void;
  enableBankSmsProcessing?: boolean;
}

export const SmsMonitor: React.FC<SmsMonitorProps> = ({
  isOtpPending = false,
  onOtpDetected,
  enableBankSmsProcessing = true
}) => {
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [permissionRequested, setPermissionRequested] = useState<boolean>(false);
  const [lastProcessedSmsId, setLastProcessedSmsId] = useState<string>('');
  const [notification, setNotification] = useState<{
    message: string;
    severity: 'success' | 'error' | 'info';
  } | null>(null);

  useEffect(() => {
    checkAndRequestPermissions();
  }, []);

  useEffect(() => {
    if (hasPermission && (isOtpPending || enableBankSmsProcessing)) {
      startSmsMonitoring();
    }
  }, [hasPermission, isOtpPending, enableBankSmsProcessing]);

  const checkAndRequestPermissions = async () => {
    try {
      const hasPerms = await smsService.hasReadPermission();
      setHasPermission(hasPerms);

      if (!hasPerms && !permissionRequested) {
        setPermissionRequested(true);
        const granted = await smsService.requestReadPermission();
        setHasPermission(granted);
        
        if (!granted) {
          setNotification({
            message: 'SMS permission denied. Auto-OTP detection and bank SMS processing will not work.',
            severity: 'error'
          });
        }
      }
    } catch (error) {
      logger.error('Error with SMS permissions:', error);
      setNotification({
        message: 'Error requesting SMS permissions',
        severity: 'error'
      });
    }
  };

  const startSmsMonitoring = () => {
    const intervalId = setInterval(async () => {
      try {
        const recentMessages = await smsService.getRecentSmsMessages(10);
        
        // Process each new message
        for (const message of recentMessages) {
          if (message.id === lastProcessedSmsId) break;
          
          // Check if message is from the last 2 minutes
          const messageAge = Date.now() - message.date;
          if (messageAge > 120000) continue; // Skip messages older than 2 minutes
          
          await processNewSmsMessage(message);
        }
        
        if (recentMessages.length > 0) {
          setLastProcessedSmsId(recentMessages[0].id);
        }
      } catch (error) {
        logger.error('Error monitoring SMS:', error);
      }
    }, 5000); // Check every 5 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  };

  const processNewSmsMessage = async (message: SmsMessage) => {
    // 1. Check for OTP if we're expecting one
    if (isOtpPending && onOtpDetected) {
      const otpCode = smsService.extractOtpFromMessage(message.body);
      if (otpCode) {
        // Do not log OTPs in console for production. Notify the caller.
        onOtpDetected(otpCode);
        setNotification({
          message: `OTP detected: ${otpCode}`,
          severity: 'success'
        });
        return; // Don't process as bank SMS if it's an OTP
      }
    }

    // 2. Check for bank SMS patterns
    if (enableBankSmsProcessing) {
      const bankPatterns = [
        /received.*PKR.*\d+/gi,
        /credit.*PKR.*\d+/gi,
        /transfer.*PKR.*\d+/gi,
        /payment.*PKR.*\d+/gi,
        /balance.*PKR.*\d+/gi,
        /HBL/gi,
        /UBL/gi,
        /MCB/gi,
        /JazzCash/gi,
        /EasyPaisa/gi
      ];

      const isBankSms = bankPatterns.some(pattern => pattern.test(message.body));
      if (isBankSms) {
        try {
          const currentUser = await authService.getCurrentUser();
          // Do not log full SMS content to console in production
          await smsService.sendSmsToBackend(message.body, currentUser?.id);
          setNotification({
            message: 'Bank SMS processed automatically',
            severity: 'info'
          });
        } catch (error) {
          logger.error('Error sending bank SMS to backend:', error);
        }
      }
    }
  };

  return (
    <>
      {notification && (
        <Snackbar
          open={true}
          autoHideDuration={4000}
          onClose={() => setNotification(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert severity={notification.severity} onClose={() => setNotification(null)}>
            {notification.message}
          </Alert>
        </Snackbar>
      )}
    </>
  );
};