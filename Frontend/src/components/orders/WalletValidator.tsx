// src/components/orders/WalletValidator.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Stack,
  Chip,
  Divider
} from '@mui/material';
import { AccountBalanceWallet, Warning, CheckCircle, Add } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import walletService from '../../services/walletService';
import type { WalletSummary } from '../../types/wallet';``

interface Props {
  orderAmount: number;
  currency: string;
  onValidationComplete: (isValid: boolean, walletBalance: number) => void;
  disabled?: boolean;
}

const WalletValidator: React.FC<Props> = ({ 
  orderAmount, 
  currency, 
  onValidationComplete, 
  disabled = false 
}) => {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWalletInfo();
  }, []);

  useEffect(() => {
    if (wallet && orderAmount > 0) {
      const isValid = wallet.balance >= orderAmount;
      onValidationComplete(isValid, wallet.balance);
    }
  }, [wallet, orderAmount, onValidationComplete]);

  const loadWalletInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      const walletData = await walletService.getSummary();
      setWallet(walletData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wallet information');
      setWallet(null);
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = () => {
    navigate('/wallet?action=topup');
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2}>
            <CircularProgress size={24} />
            <Typography>Checking wallet balance...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error" action={
            <Button color="inherit" size="small" onClick={loadWalletInfo}>
              Retry
            </Button>
          }>
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!wallet) {
    return (
      <Card>
        <CardContent>
          <Alert severity="warning">
            Unable to load wallet information. Please try again.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const isBalanceSufficient = wallet.balance >= orderAmount;
  const shortfall = orderAmount - wallet.balance;

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountBalanceWallet />
            Wallet Balance Check
          </Typography>

          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Current Balance
            </Typography>
            <Typography variant="h5" color="primary">
              {currency} {wallet.balance.toLocaleString()}
            </Typography>
          </Box>

          <Divider />

          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Order Amount
            </Typography>
            <Typography variant="h6">
              {currency} {orderAmount.toLocaleString()}
            </Typography>
          </Box>

          {orderAmount > 0 && (
            <>
              <Divider />
              
              {isBalanceSufficient ? (
                <Alert 
                  severity="success" 
                  icon={<CheckCircle />}
                  sx={{ alignItems: 'center' }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      Sufficient Balance ✓
                    </Typography>
                    <Typography variant="caption" display="block">
                      Your order will be funded from escrow. 
                      Remaining balance after order: {currency} {(wallet.balance - orderAmount).toLocaleString()}
                    </Typography>
                  </Box>
                </Alert>
              ) : (
                <Alert 
                  severity="warning" 
                  icon={<Warning />}
                  action={
                    <Button 
                      color="inherit" 
                      size="small" 
                      startIcon={<Add />}
                      onClick={handleTopUp}
                      disabled={disabled}
                    >
                      Top Up
                    </Button>
                  }
                >
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      Insufficient Balance
                    </Typography>
                    <Typography variant="caption" display="block">
                      You need {currency} {shortfall.toLocaleString()} more to place this order.
                      Please top up your wallet to continue.
                    </Typography>
                  </Box>
                </Alert>
              )}

              <Box display="flex" gap={1} flexWrap="wrap">
                <Chip 
                  label={`Balance: ${currency} ${wallet.balance.toLocaleString()}`}
                  size="small"
                  variant="outlined"
                  color={isBalanceSufficient ? "success" : "error"}
                />
                <Chip 
                  label={`Status: ${wallet.status}`}
                  size="small"
                  variant="outlined"
                  color={wallet.status === 'Active' ? "success" : "warning"}
                />
              </Box>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default WalletValidator;