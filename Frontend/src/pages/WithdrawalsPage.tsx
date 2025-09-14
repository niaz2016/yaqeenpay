// src/pages/WithdrawalsPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Stack,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Add,
  Refresh,
  Info,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import walletService from '../services/walletService';
import { selectedSellerService } from '../services/sellerServiceSelector';
import type { WalletSummary, WalletTransaction } from '../types/wallet';
import type { Withdrawal } from '../types/seller';

const WithdrawalsPage: React.FC = () => {
  const { user } = useAuth();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBalance, setShowBalance] = useState(false); // Hidden by default
  const [showRequestForm, setShowRequestForm] = useState(false);
  
  // Withdrawal form state
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalMethod, setWithdrawalMethod] = useState('bank_transfer');
  const [bankAccount, setBankAccount] = useState('');
  const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false);

  const isSeller = user?.roles?.includes('Seller') || user?.roles?.includes('seller');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch wallet data for all users
      const [walletData, transactionData] = await Promise.all([
        walletService.getSummary(),
        walletService.getTransactions()
      ]);

      setWalletSummary(walletData);
      setWalletTransactions(transactionData.items || []);

      // Fetch withdrawal data - currently only available for sellers
      if (isSeller) {
        try {
          const withdrawalData = await selectedSellerService.getWithdrawals();
          setWithdrawals(withdrawalData);
        } catch (err) {
          console.warn('Could not fetch seller withdrawal data:', err);
          // Don't set error for this, as buyers won't have seller withdrawal data
        }
      }
    } catch (err) {
      console.error('Error fetching withdrawal data:', err);
      setError('Failed to load withdrawal information');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawalRequest = async () => {
    if (!withdrawalAmount || !bankAccount) {
      setError('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(withdrawalAmount);
    if (amount <= 0 || amount > (walletSummary?.balance || 0)) {
      setError('Invalid withdrawal amount');
      return;
    }

    try {
      setSubmittingWithdrawal(true);
      setError(null);

      if (isSeller) {
        await selectedSellerService.requestWithdrawal({
          amount,
          PaymentMethod: withdrawalMethod,
          notes: `Account: ${bankAccount}`
        });
      } else {
        // For buyers, we would need to implement a buyer withdrawal service
        // For now, show a message that this feature is coming soon for buyers
        throw new Error('Withdrawal feature for buyers is coming soon');
      }

      setShowRequestForm(false);
      setWithdrawalAmount('');
      setBankAccount('');
      await fetchData();
    } catch (err) {
      console.error('Error submitting withdrawal request:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit withdrawal request');
    } finally {
      setSubmittingWithdrawal(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Withdrawals
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your withdrawal requests and view transaction history
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Wallet Summary */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Wallet Summary
          </Typography>
          <Stack direction="row" spacing={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Available Balance
                </Typography>
                <Typography variant="h5" color="primary">
                  {walletSummary 
                    ? showBalance 
                      ? formatCurrency(walletSummary.balance) 
                      : '••••••'
                    : 'Loading...'
                  }
                </Typography>
              </Box>
              <IconButton 
                onClick={() => setShowBalance(!showBalance)}
                size="small"
                sx={{ mt: 1 }}
              >
                {showBalance ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Currency
              </Typography>
              <Typography variant="h6">
                {walletSummary?.currency || 'PKR'}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Actions */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setShowRequestForm(true)}
          disabled={!walletSummary || walletSummary.balance <= 0}
        >
          Request Withdrawal
        </Button>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchData}
        >
          Refresh
        </Button>
      </Box>

      {/* Withdrawal History - Only show for sellers who have withdrawal data */}
      {isSeller && withdrawals.length > 0 && (
        <Paper sx={{ mb: 3 }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Withdrawal History
            </Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {withdrawals.map((withdrawal) => (
                  <TableRow key={withdrawal.id}>
                    <TableCell>
                      {new Date(withdrawal.requestedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{formatCurrency(withdrawal.amount)}</TableCell>
                    <TableCell>{withdrawal.channel || withdrawal.paymentMethod || 'Bank Transfer'}</TableCell>
                    <TableCell>
                      <Chip
                        label={withdrawal.status}
                        color={getStatusColor(withdrawal.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton size="small">
                          <Info />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Transaction History */}
      <Paper>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Recent Transactions
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {walletTransactions
                .slice(0, 10)
                .map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{transaction.type}</TableCell>
                  <TableCell>
                    <Typography
                      color={transaction.type === 'Debit' ? 'error' : 'inherit'}
                    >
                      {transaction.type === 'Debit' ? '-' : '+'}
                      {formatCurrency(Math.abs(transaction.amount))}
                    </Typography>
                  </TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>
                    <Chip
                      label={transaction.status}
                      color={getStatusColor(transaction.status)}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Withdrawal Request Dialog */}
      <Dialog open={showRequestForm} onClose={() => setShowRequestForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Withdrawal</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {/* {!isSeller && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Withdrawal feature for buyers is coming soon. Currently, only sellers can request withdrawals.
              </Alert>
            )} */}
            
            <TextField
              fullWidth
              label="Withdrawal Amount"
              type="number"
              value={withdrawalAmount}
              onChange={(e) => setWithdrawalAmount(e.target.value)}
              sx={{ mb: 2 }}
              helperText={`Available: ${walletSummary ? formatCurrency(walletSummary.balance) : '0'}`}
              disabled={!isSeller}
            />
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Withdrawal Method</InputLabel>
              <Select
                value={withdrawalMethod}
                onChange={(e) => setWithdrawalMethod(e.target.value)}
                disabled={!isSeller}
              >
                <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                <MenuItem value="mobile_wallet">Mobile Wallet</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Bank Account / Mobile Number"
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
              disabled={!isSeller}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRequestForm(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleWithdrawalRequest}
            variant="contained"
            disabled={submittingWithdrawal || !isSeller}
          >
            {submittingWithdrawal ? <CircularProgress size={20} /> : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default WithdrawalsPage;