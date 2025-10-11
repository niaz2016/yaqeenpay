import React, { useState, useCallback, useRef } from 'react';
import api from '../../services/api';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Stack, 
  Button, 
  Typography,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
// @ts-ignore
import QRCode from 'qrcode';

interface QrTopupResponse {
  success: boolean;
  message: string;
  suggestedAmount: number;
  effectiveAmount?: number;
  qrImageUrl?: string;
  qrPayload?: string;
  transactionReference?: string;
  currentBalance: number;
  expiresAt?: string;
}

interface WalletBalance {
  balance: number;
  currency: string;
}

type Props = {
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: { amount: number; transactionId: string }) => Promise<void> | void;
};

const TopUpQrModal: React.FC<Props> = ({ open, submitting, onClose }) => {
  const [amount, setAmount] = useState<number>(100);
  const [channel, setChannel] = useState<string>('BankTransfer');
  const [showQrStep, setShowQrStep] = useState(false);
  const [qrResponse, setQrResponse] = useState<QrTopupResponse | null>(null);
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [paymentClaimed, setPaymentClaimed] = useState(false);
  const [polling, setPolling] = useState(false);
  const POLL_INTERVAL_MS = 4000; // 4s
  const POLL_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes lock extension window
  
  const currentBalanceRef = useRef(currentBalance);
  currentBalanceRef.current = currentBalance;

  // Fetch current balance when modal opens
  React.useEffect(() => {
    if (open) {
      fetchBalance();
    }
  }, [open]);

  // Auto-refresh QR code when expired (don't close dialog)
  React.useEffect(() => {
    if (!qrResponse?.expiresAt || !showQrStep) {
      setTimeRemaining('');
      return;
    }

    const updateCountdown = () => {
      if (!qrResponse?.expiresAt) return;
      const expiryTime = new Date(qrResponse.expiresAt).getTime();
      const now = Date.now();
      const timeDiff = expiryTime - now;
      if (timeDiff <= 0) {
        // expired: immediately request new QR with same amount
        setRefreshing(prev => {
          if (!prev) {
            // Only trigger refresh if not already refreshing
            setTimeout(() => handleQrTopup(), 100); // Async to avoid state update during render
            return true;
          }
          return prev;
        });
        return;
      }
      const minutes = Math.floor(timeDiff / 60000);
      const seconds = Math.floor((timeDiff % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [qrResponse?.expiresAt, showQrStep]); // Removed refreshing dependency

  const fetchBalance = useCallback(async () => {
    try {
      // Use shared API client so Authorization and baseURL are correct (https://localhost:7137/api)
      const data = await api.get<WalletBalance>('/wallets/qr-balance');
      setCurrentBalance(data.balance);
      return data.balance;
    } catch (error) {
      console.error('Error fetching balance:', error);
      return currentBalanceRef.current; // Return current value on error
    }
  }, []);

  const handleSubmit = async () => {
    // Always use QR flow for all payment methods
    await handleQrTopup();
  };

  const handleQrTopup = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await api.post<QrTopupResponse>('/wallets/create-qr-topup', {
        amount: amount,
        currency: 'PKR',
        paymentMethod: channel
      });
      
      if (result.success) {
        setQrResponse(result);
        setShowQrStep(true);
        await fetchBalance();
      } else {
        setError(result.message);
        if (result.suggestedAmount && result.suggestedAmount !== amount) {
          setAmount(result.suggestedAmount);
        }
      }
    } catch (error) {
      setError('An error occurred while processing your request. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [amount, channel]);

  const handleCloseModal = useCallback(() => {
    setShowQrStep(false);
    setQrResponse(null);
    setError('');
    setAmount(100);
    setChannel('BankTransfer');
    setPaymentClaimed(false);
    setPolling(false);
    setRefreshing(false);
    onClose();
  }, [onClose]);

  const handleCancel = () => {
    setPaymentClaimed(false);
    setPolling(false);
    handleCloseModal();
  };

  const handleIHavePaid = async () => {
    if (!qrResponse?.transactionReference) return;
    setPaymentClaimed(true);
    setPolling(true);
    
    const startingBalance = currentBalanceRef.current;
    
    try {
      // Call backend to mark payment initiated (extend lock)
      try {
        const mark = await api.post<any>(`/wallets/mark-payment-initiated/${qrResponse.transactionReference}`, {});
        if (mark?.expiresAt) {
          // update expiry in state
          setQrResponse(r => r ? { ...r, expiresAt: mark.expiresAt } : r);
        }
      } catch (e) {
        console.error('Failed to mark payment initiated:', e);
        // Continue with polling anyway
      }
      
      // Also try to verify payment immediately in case it's already processed
      try {
        const verifyResult = await api.post<any>('/wallets/verify-qr-payment', {
          transactionReference: qrResponse.transactionReference,
          amount: qrResponse.suggestedAmount
        });
        if (verifyResult?.message?.includes('success')) {
          console.log('Payment already verified!');
          const newBalance = await fetchBalance();
          if (newBalance > startingBalance) {
            setPolling(false);
            setPaymentClaimed(false);
            handleCloseModal();
            return;
          }
        }
      } catch (e) {
        // Verification failed, continue with polling
        console.log('Immediate verification failed, will poll for changes');
      }
      const start = Date.now();
      let pollActive = true;

      const poll = async () => {
        if (!pollActive) return;
        
        try {
          const latestBalance = await fetchBalance();
          console.log(`Polling: starting=${startingBalance}, current=${latestBalance}`);
          
          if (latestBalance > startingBalance) {
            console.log('Payment confirmed! Balance increased.');
            pollActive = false;
            setPolling(false);
            setPaymentClaimed(false);
            handleCloseModal();
            return;
          }
          
          // Continue polling if within timeout
          if (Date.now() - start < POLL_TIMEOUT_MS) {
            setTimeout(poll, POLL_INTERVAL_MS);
          } else {
            console.log('Polling timeout reached');
            pollActive = false;
            setPolling(false);
            setPaymentClaimed(false);
          }
        } catch (e) {
          console.error('Error during polling:', e);
          // Continue polling on error if within timeout
          if (Date.now() - start < POLL_TIMEOUT_MS) {
            setTimeout(poll, POLL_INTERVAL_MS);
          } else {
            pollActive = false;
            setPolling(false);
            setPaymentClaimed(false);
          }
        }
      };
      
      // Start polling immediately
      setTimeout(poll, 1000); // Start after 1 second to allow payment processing
    } catch (e) {
      console.error('Error in handleIHavePaid:', e);
      setPolling(false);
      setPaymentClaimed(false);
    }
  };

  // QR Code component
  const QRCodeComponent: React.FC<{ data: string }> = React.memo(({ data }) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    
    React.useEffect(() => {
      if (canvasRef.current && data) {
        QRCode.toCanvas(canvasRef.current, data, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff'
          }
        }, (error: any) => {
          if (error) {
            console.error('Error generating QR code:', error);
          }
        });
      }
    }, [data]);

    return (
      <canvas
        ref={canvasRef}
        style={{
          border: '2px solid #e0e0e0',
          borderRadius: '8px',
          display: 'block',
          margin: '0 auto'
        }}
      />
    );
  });

  // Simple return for now to test compilation
  return (
    <Dialog open={open} onClose={handleCloseModal} fullWidth maxWidth="sm">
      <DialogTitle>
        {showQrStep ? 'Complete Payment via QR Code' : 'Top Up Wallet'}
      </DialogTitle>
      <DialogContent>
        {!showQrStep ? (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #e0e0e0' }}>
              <Typography variant="body2" color="textSecondary">
                Current Wallet Balance: <strong>PKR {currentBalance.toFixed(2)}</strong>
              </Typography>
            </Box>

            <TextField
              label="Amount (PKR)"
              type="number"
              value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
              fullWidth
            />
            
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        ) : (
          qrResponse && (
            <Stack spacing={3} alignItems="center" sx={{ position: 'relative' }}>
              {refreshing && (
                <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(255,255,255,0.6)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Stack spacing={1} alignItems="center">
                    <CircularProgress size={40} />
                    <Typography variant="caption" color="textSecondary">Refreshing QR...</Typography>
                  </Stack>
                </Box>
              )}
              <Box textAlign="center">
                <Typography variant="h4" color="primary" gutterBottom>
                  PKR {qrResponse.suggestedAmount.toFixed(2)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Current Balance: PKR {qrResponse.currentBalance.toFixed(2)}
                </Typography>
              </Box>

              {qrResponse.qrPayload ? (
                <Box>
                  <QRCodeComponent data={qrResponse.qrPayload} />
                </Box>
              ) : null}

              <Box textAlign="center">
                <Typography variant="body1" gutterBottom>
                  Scan this QR code with any payment app to complete the payment
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Transaction Reference: {qrResponse.transactionReference}
                </Typography>
                {timeRemaining && !refreshing && (
                  <Typography 
                    variant="body2" 
                    color={timeRemaining === 'Expired' ? 'error' : 'warning.main'}
                    sx={{ fontWeight: 'bold', mt: 1 }}
                  >
                    {timeRemaining === 'Expired' ? 'QR Code Expired' : `Expires in: ${timeRemaining}`}
                  </Typography>
                )}
              </Box>

              {paymentClaimed && (
                <Alert severity="info" sx={{ width: '100%' }}>
                  Waiting for confirmation... You can leave this dialog open or press Cancel to dismiss.
                </Alert>
              )}

              <Alert severity="info" sx={{ width: '100%' }}>
                <Typography variant="body2">
                  <strong>Amount: PKR {qrResponse.suggestedAmount.toFixed(2)}</strong> (embedded in QR code)<br/>
                  Simply scan this QR code with your banking app to complete payment.<br/>
                  Once payment is completed, your wallet will be automatically updated.
                </Typography>
              </Alert>

              {/* Debug: Show raw QR payload */}
              {qrResponse.qrPayload && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1, width: '100%' }}>
                  <Typography variant="caption" color="textSecondary" gutterBottom>
                    Debug - QR Code String:
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontFamily: 'monospace', 
                      wordBreak: 'break-all',
                      fontSize: '0.75rem',
                      color: 'text.secondary'
                    }}
                  >
                    {qrResponse.qrPayload}
                  </Typography>
                  <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                    Length: {qrResponse.qrPayload.length} characters
                  </Typography>
                </Box>
              )}
            </Stack>
          )
        )}
      </DialogContent>
      <DialogActions>
        {!showQrStep ? (
          <>
            <Button onClick={handleCloseModal} disabled={submitting || loading}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              variant="contained" 
              disabled={
                submitting || 
                loading || 
                amount <= 0
              }
              startIcon={loading ? <CircularProgress size={16} /> : null}
            >
              Generate QR Code
            </Button>
          </>
        ) : (
          <>
            <Button 
              variant="contained" 
              color="success" 
              onClick={handleIHavePaid} 
              disabled={refreshing || polling || paymentClaimed}
              startIcon={(polling || paymentClaimed) ? <CircularProgress size={16} /> : null}
            >
              {paymentClaimed ? (polling ? 'Verifying...' : 'Payment Claimed') : "I've Paid"}
            </Button>
            <Button 
              variant="outlined" 
              color="inherit"
              onClick={handleCancel}
              disabled={refreshing}
            >
              Cancel
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default TopUpQrModal;