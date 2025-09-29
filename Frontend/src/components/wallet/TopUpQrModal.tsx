import React, { useState } from 'react';
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

  // Fetch current balance when modal opens
  React.useEffect(() => {
    if (open) {
      fetchBalance();
    }
  }, [open]);

  // Auto-close QR dialog when expired with countdown
  React.useEffect(() => {
    if (!qrResponse?.expiresAt || !showQrStep) {
      setTimeRemaining('');
      return;
    }

    const interval = setInterval(() => {
      const expiryTime = new Date(qrResponse.expiresAt!).getTime();
      const currentTime = Date.now();
      const remainingMs = expiryTime - currentTime;
      
      if (remainingMs <= 0) {
        setTimeRemaining('Expired');
        setError('QR code has expired. Please generate a new one.');
        setTimeout(() => {
          handleCloseModal();
        }, 2000); // Close after showing error for 2 seconds
        clearInterval(interval);
        return;
      }
      
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      const minutes = Math.floor(remainingSeconds / 60);
      const seconds = remainingSeconds % 60;
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [qrResponse?.expiresAt, showQrStep]);

  const fetchBalance = async () => {
    try {
      // Use shared API client so Authorization and baseURL are correct (https://localhost:7137/api)
      const data = await api.get<WalletBalance>('/wallets/qr-balance');
      setCurrentBalance(data.balance);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const handleSubmit = async () => {
    // Always use QR flow for all payment methods
    await handleQrTopup();
  };

  const handleQrTopup = async () => {
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
    }
  };

  const handleCloseModal = () => {
    setShowQrStep(true);
    setQrResponse(null);
    setError('');
    setAmount(100);
    setChannel('BankTransfer');
    onClose();
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
            <Stack spacing={3} alignItems="center">
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
                {timeRemaining && (
                  <Typography 
                    variant="body2" 
                    color={timeRemaining === 'Expired' ? 'error' : 'warning.main'}
                    sx={{ fontWeight: 'bold', mt: 1 }}
                  >
                    {timeRemaining === 'Expired' ? 'QR Code Expired' : `Expires in: ${timeRemaining}`}
                  </Typography>
                )}
              </Box>

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
              variant="outlined" 
              onClick={handleCloseModal}
            >
              Close
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default TopUpQrModal;