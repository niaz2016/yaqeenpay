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
  CircularProgress
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

  const handleFormSubmit = async (data: FormData) => {
    // Always use QR flow for HBL account topup
    await handleQrTopup(data);
  };

  const handleQrTopup = async (data: FormData) => {
    setLoading(true);
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
        await fetchBalance(); // Update balance
      } else {
        setError(result.message);
        // If suggested amount provided, update form
        if (result.suggestedAmount && result.suggestedAmount !== data.amount) {
          setValue('amount', result.suggestedAmount);
        }
      }
    } catch (error) {
      setError('An error occurred while processing your request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseQrDialog = () => {
    setShowQrDialog(false);
    setQrResponse(null);
    fetchBalance(); // Refresh balance when dialog closes
  };

  // Auto-close QR dialog when it expires and show countdown
  React.useEffect(() => {
    if (showQrDialog && qrResponse?.expiresAt) {
      const updateCountdown = () => {
        const now = new Date();
        const expiryTime = new Date(qrResponse.expiresAt!);
        const timeDiff = expiryTime.getTime() - now.getTime();
        
        if (timeDiff <= 0) {
          // QR has expired, close the dialog
          handleCloseQrDialog();
          setError('QR code has expired. Please generate a new one.');
          setTimeRemaining('');
        } else {
          // Calculate remaining time
          const minutes = Math.floor(timeDiff / (1000 * 60));
          const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
          setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
      };

      // Update immediately
      updateCountdown();

      // Set up interval to update every second
      const interval = setInterval(updateCountdown, 1000);

      // Cleanup interval when dialog closes or component unmounts
      return () => clearInterval(interval);
    } else {
      setTimeRemaining('');
    }
  }, [showQrDialog, qrResponse?.expiresAt]);

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
            <Stack spacing={3} alignItems="center">
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
                    {timeRemaining && (
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

              {/* Action Buttons */}
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button 
                  variant="outlined" 
                  onClick={handleCloseQrDialog}
                >
                  Close
                </Button>
              </Stack>

              {/* Success Message */}
              <Alert severity="info" sx={{ width: '100%' }}>
                Scan this QR code with any payment app to complete payment. 
                The amount is automatically included in the QR code.
                Your wallet will be automatically updated once payment is confirmed.
              </Alert>
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TopUpForm;
