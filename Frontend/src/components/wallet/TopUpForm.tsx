import React, { useState } from 'react';
import api from '../../services/api';
import { 
  Stack, 
  TextField, 
  Button, 
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Box,
  Alert,
  CircularProgress,
  DialogActions
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
// @ts-ignore
import QRCode from 'qrcode';

const schema = z.object({
  amount: z
    .number()
    .refine((v) => Number.isFinite(v), { message: 'Amount is required' })
    .refine((v) => v > 0, { message: 'Amount must be greater than 0' })
    .refine((v) => v <= 100000, { message: 'Amount too large' }),
});

type FormData = z.infer<typeof schema>;

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
  submitting?: boolean;
};

const TopUpForm: React.FC<Props> = ({ submitting }) => {
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { amount: 100 },
  });

  const [showQrDialog, setShowQrDialog] = useState(false);
  const [qrResponse, setQrResponse] = useState<QrTopupResponse | null>(null);
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false); // new: indicates auto-refresh in progress
  const [paymentClaimed, setPaymentClaimed] = useState(false);
  const [polling, setPolling] = useState(false);
  const POLL_INTERVAL_MS = 4000; // 4s
  const POLL_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes lock extension window

  // Fetch current balance on component mount
  React.useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      const data = await api.get<WalletBalance>('/wallets/qr-balance');
      setCurrentBalance(data.balance);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  // helper to know if current qr is expired
  const isQrExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt).getTime() <= Date.now();
  };

  const handleFormSubmit = async (data: FormData) => {
    // Reuse existing QR if same amount and not expired
    if (qrResponse && !isQrExpired(qrResponse.expiresAt) && qrResponse.suggestedAmount === data.amount) {
      // just re-show dialog (if user closed it) without requesting backend
      setShowQrDialog(true);
      return;
    }
    await handleQrTopup(data);
  };

  const handleQrTopup = async (data: FormData) => {
    setLoading(true);
    // don't clear previously shown QR unless we are actually changing amount
    if (!qrResponse || qrResponse.suggestedAmount !== data.amount) {
      setQrResponse(null);
    }
    setError('');
    try {
      const result = await api.post<QrTopupResponse>('/wallets/create-qr-topup', {
        amount: data.amount,
        currency: 'PKR',
        paymentMethod: 'QR'
      });
      if (result.success) {
        setQrResponse(result);
        setShowQrDialog(true);
        await fetchBalance();
      } else {
        setError(result.message);
        if (result.suggestedAmount && result.suggestedAmount !== data.amount) {
          setValue('amount', result.suggestedAmount);
        }
      }
    } catch (error) {
      setError('An error occurred while processing your request. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCloseQrDialog = () => {
    setShowQrDialog(false);
    // DO NOT clear qrResponse so user can reopen while still valid
    fetchBalance();
  };

  // Modified countdown effect: auto-refresh instead of closing dialog
  React.useEffect(() => {
    if (!showQrDialog || !qrResponse?.expiresAt) {
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
        if (!refreshing) {
          setRefreshing(true);
          handleQrTopup({ amount: qrResponse.suggestedAmount });
        }
        return;
      }
      const minutes = Math.floor(timeDiff / 60000);
      const seconds = Math.floor((timeDiff % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [showQrDialog, qrResponse?.expiresAt, qrResponse?.suggestedAmount, refreshing]);

  const formatExpiryTime = (expiresAt?: string) => {
    if (!expiresAt) return '';
    const expiry = new Date(expiresAt);
    return expiry.toLocaleTimeString();
  };

  // QR Code component
  const QRCodeComponent: React.FC<{ data: string }> = ({ data }) => {
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
  };

  const handleCancel = () => {
    setPaymentClaimed(false);
    setPolling(false);
    handleCloseQrDialog();
  };

  const handleIHavePaid = async () => {
    if (!qrResponse?.transactionReference) return; // ensure reference exists
    setPaymentClaimed(true);
    setPolling(true);
    try {
      // Call backend to mark payment initiated (extend lock)
      try {
        const mark = await api.post<any>(`/wallets/mark-payment-initiated/${qrResponse.transactionReference}`, {});
        if (mark?.expiresAt) {
          // update expiry in state
          setQrResponse(r => r ? { ...r, expiresAt: mark.expiresAt } : r);
        }
      } catch (e) {
        // ignore; proceed with polling anyway
      }
      const startingBalance = currentBalance;
      const start = Date.now();

      const poll = async () => {
        try {
          await fetchBalance();
          // compare after fetch (state update asynchronous) using latest value via functional set if needed
          // We'll re-check after small delay to allow state update
          const latestBalance = currentBalance; // stale risk but acceptable minimal approach; could refactor with ref
          const increased = latestBalance > startingBalance;
          if (increased) {
            setPolling(false);
            setPaymentClaimed(false);
            setShowQrDialog(false);
            return;
          }
          if (Date.now() - start < POLL_TIMEOUT_MS && paymentClaimed) {
            setTimeout(poll, POLL_INTERVAL_MS);
          } else {
            setPolling(false);
            setPaymentClaimed(false);
          }
        } catch (e) {
          if (Date.now() - start < POLL_TIMEOUT_MS && paymentClaimed) {
            setTimeout(poll, POLL_INTERVAL_MS);
          } else {
            setPolling(false);
            setPaymentClaimed(false);
          }
        }
      };
      setTimeout(poll, POLL_INTERVAL_MS);
    } catch (e) {
      setPolling(false);
      setPaymentClaimed(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            label="Amount (PKR)"
            type="number"
            inputProps={{ step: '0.01', min: '0.01' }}
            error={!!errors.amount}
            helperText={errors.amount?.message}
            {...register('amount', { valueAsNumber: true })}
            sx={{ width: 180 }}
          />
          <Button 
            type="submit" 
            variant="contained" 
            disabled={!!submitting || loading}
            startIcon={loading ? <CircularProgress size={16} /> : null}
          >
            Generate QR Code
          </Button>
        </Stack>
      </form>

      {/* Current Balance Display */}
      <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #e0e0e0' }}>
        <Typography variant="body2" color="textSecondary">
          Current Wallet Balance: <strong>PKR {currentBalance.toFixed(2)}</strong>
        </Typography>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* QR Code Dialog */}
      <Dialog 
        open={showQrDialog} 
        onClose={handleCloseQrDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Complete Payment via QR Code
        </DialogTitle>
        <DialogContent>
          {qrResponse && (
            <Stack spacing={3} alignItems="center" sx={{ position: 'relative' }}>
              {refreshing && (
                <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(255,255,255,0.6)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Stack spacing={1} alignItems="center">
                    <CircularProgress size={40} />
                    <Typography variant="caption" color="textSecondary">Refreshing QR...</Typography>
                  </Stack>
                </Box>
              )}
              {/* Amount and Balance Info */}
              <Box textAlign="center">
                <Typography variant="h4" color="primary" gutterBottom>
                  PKR {qrResponse.suggestedAmount.toFixed(2)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Current Balance: PKR {qrResponse.currentBalance.toFixed(2)}
                </Typography>
                {qrResponse.expiresAt && (
                  <Box>
                    <Typography variant="body2" color="warning.main">
                      Expires at: {formatExpiryTime(qrResponse.expiresAt)}
                    </Typography>
                    {timeRemaining && !refreshing && (
                      <Typography variant="body2" color="error" sx={{ fontWeight: 'bold' }}>
                        Time remaining: {timeRemaining}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>

              {/* Render live QR from payload if provided */}
              {qrResponse.qrPayload ? (
                <Box>
                  <QRCodeComponent data={qrResponse.qrPayload} />
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Scan with any payment app to complete payment
                  </Typography>
                </Box>
              ) : null}

              {/* Instructions */}
              <Box textAlign="center">
                <Typography variant="body1" gutterBottom>
                  Scan this QR code with any payment app to complete the payment
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  <strong>Amount: PKR {qrResponse.suggestedAmount.toFixed(2)}</strong> (embedded in QR code)
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Transaction Reference: {qrResponse.transactionReference}
                </Typography>
                {typeof qrResponse.effectiveAmount === 'number' && (
                  <Typography variant="body2" color="textSecondary">
                    Amount: PKR {(qrResponse.effectiveAmount ?? qrResponse.suggestedAmount).toFixed(2)}
                  </Typography>
                )}

                {/* Debug: Show raw QR payload */}
                {qrResponse.qrPayload && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
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
              </Box>
              {qrResponse && (
          <DialogActions sx={{ px: 3, pb: 2 }}>
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
          </DialogActions>
        )}
            </Stack>
          )}
        </DialogContent>
        
      </Dialog>
    </>
  );
};

export default TopUpForm;
