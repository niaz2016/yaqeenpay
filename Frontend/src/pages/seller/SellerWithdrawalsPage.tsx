// src/pages/seller/SellerWithdrawalsPage.tsx
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
  DialogActions
} from '@mui/material';
import {
  Add,
  AccountBalance,
  Cancel,
  Refresh,
  Download,
  Info
} from '@mui/icons-material';
import WithdrawalRequestForm from '../../components/seller/WithdrawalRequestForm';
import { selectedSellerService } from '../../services/sellerServiceSelector';
import walletService from '../../services/walletService';
import type { Withdrawal, SellerAnalytics } from '../../types/seller';
import type { WalletSummary, WalletTransaction, WalletStatus } from '../../types/wallet';

const SellerWithdrawalsPage: React.FC = () => {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [analytics, setAnalytics] = useState<SellerAnalytics | null>(null);
  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null);
  // Add wallet transactions state
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  // Add tab state for switching between withdrawals and transactions
  const [activeTab, setActiveTab] = useState<'withdrawals' | 'transactions'>('withdrawals');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading withdrawal data from database...');
      
      // Load data with individual error handling to prevent total failure
      let withdrawalsData: Withdrawal[] = [];
      let analyticsData: SellerAnalytics | null = null;
      let walletData: WalletSummary | null = null;
      let transactionsResult: { items: WalletTransaction[] } = { items: [] };

      // Try to load withdrawals
      try {
        console.log('Fetching withdrawals...');
        withdrawalsData = await selectedSellerService.getWithdrawals();
        console.log('Withdrawals loaded:', withdrawalsData);
      } catch (err) {
        console.error('Failed to load withdrawals:', err);
        withdrawalsData = [];
      }

      // Try to load analytics
      try {
        console.log('Fetching seller analytics...');
        analyticsData = await selectedSellerService.getSellerAnalytics();
        console.log('Analytics loaded:', analyticsData);
      } catch (err) {
        console.error('Failed to load analytics:', err);
        analyticsData = null;
      }

      // Try to load wallet data with fallback
      try {
        console.log('Fetching wallet summary...');
        walletData = await walletService.getSummary();
        console.log('Wallet data received:', walletData);
      } catch (err) {
        console.error('Failed to load wallet summary:', err);
        walletData = {
          balance: 0,
          currency: 'USD',
          status: 'Active' as WalletStatus,
          updatedAt: new Date().toISOString()
        };
      }

      // Try to load transactions
      try {
        console.log('Fetching transactions...');
        const transactionResponse = await walletService.getTransactions();
        transactionsResult = { items: transactionResponse.items || [] };
        console.log('Transactions loaded:', transactionsResult);
      } catch (err) {
        console.error('Failed to load transactions:', err);
        transactionsResult = { items: [] };
      }

      setWithdrawals(withdrawalsData);
      setAnalytics(analyticsData);
      setWalletSummary(walletData);
      setWalletTransactions(transactionsResult.items);
      console.log('Successfully loaded data from database');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data from database';
      setError(errorMessage);
      console.error('Database connection error:', err);
      
      // Show user-friendly error message
      if (errorMessage.includes('Backend server')) {
        setError('Unable to connect to the server. Please check your internet connection and try again.');
      } else if (errorMessage.includes('not yet implemented')) {
        setError('This feature is currently under development. Please contact support for assistance.');
      } else {
        setError(`Error loading data: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRequestSuccess = () => {
    loadData();
    setShowRequestForm(false);
  };

  const handleCancelWithdrawal = async (withdrawalId: string) => {
    try {
      console.log(`Cancelling withdrawal ${withdrawalId} in database...`);
      await selectedSellerService.cancelWithdrawal(withdrawalId);
      console.log(`Successfully cancelled withdrawal ${withdrawalId}`);
      loadData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel withdrawal';
      console.error('Failed to cancel withdrawal:', err);
      
      // Show user-friendly error message
      if (errorMessage.includes('Backend server')) {
        setError('Unable to connect to the server. Please check your internet connection and try again.');
      } else if (errorMessage.includes('not yet implemented')) {
        setError('Withdrawal cancellation is currently under development. Please contact support for assistance.');
      } else {
        setError('Failed to cancel withdrawal. Please try again or contact support.');
      }
    }
  };

  const getStatusColor = (status: string | undefined | null) => {
    if (!status || typeof status !== 'string') {
      return 'default';
    }
    switch (status.toLowerCase()) {
      case 'settled':
      case 'completed':
        return 'success';
      case 'pendingprovider':
      case 'processing':
        return 'warning';
      case 'initiated':
      case 'pending':
        return 'info';
      case 'failed':
      case 'reversed':
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string | undefined | null) => {
    if (!status || typeof status !== 'string') {
      return '•';
    }
    switch (status.toLowerCase()) {
      case 'settled':
      case 'completed':
        return '✓';
      case 'pendingprovider':
      case 'processing':
        return '⏳';
      case 'initiated':
      case 'pending':
        return '⏰';
      case 'failed':
      case 'reversed':
      case 'rejected':
        return '✗';
      default:
        return '•';
    }
  };

  const canCancel = (withdrawal: Withdrawal) => {
    return withdrawal.status === 'Initiated';
  };

  // Use actual wallet balance instead of calculated value from analytics
  const availableBalance = walletSummary?.balance || 0;
  const totalWithdrawn = withdrawals
    .filter(w => w.status === 'Settled')
    .reduce((sum, w) => sum + w.amount, 0);
  const pendingWithdrawals = withdrawals
    .filter(w => w.status === 'Initiated' || w.status === 'PendingProvider')
    .reduce((sum, w) => sum + w.amount, 0);

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Loading withdrawals...</Typography>
        </Box>
      </Container>
    );
  }

  // Fallback rendering if critical data is missing
  if (!walletSummary && !error) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <Typography variant="h4" component="h1" sx={{ mb: 4 }}>
            Withdrawals
          </Typography>
          <Alert severity="warning" sx={{ mb: 3 }}>
            Unable to load wallet information. Please refresh the page or contact support.
          </Alert>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadData}
          >
            Retry Loading
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            Withdrawals
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={loadData}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setShowRequestForm(true)}
              disabled={availableBalance <= 0}
            >
              Request Withdrawal
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Add debug info in development */}
        {import.meta.env.DEV && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Debug: Using seller wallet summary endpoint. Wallet Balance: ${walletSummary?.balance || 0}, Analytics Revenue: ${analytics?.revenue || 0}
          </Alert>
        )}

        {/* Balance Summary */}
        <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
          <Card sx={{ flex: 1, minWidth: 250 }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Available Balance
              </Typography>
              <Typography variant="h4" color="success.main">
                ${availableBalance.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ready for withdrawal
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1, minWidth: 250 }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Total Withdrawn
              </Typography>
              <Typography variant="h4">
                ${totalWithdrawn.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All time withdrawals
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1, minWidth: 250 }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Pending Withdrawals
              </Typography>
              <Typography variant="h4" color="warning.main">
                ${pendingWithdrawals.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Being processed
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Add tabs for switching between withdrawals and wallet transactions */}
        <Box sx={{ mb: 3 }}>
          <Button
            variant={activeTab === 'withdrawals' ? 'contained' : 'outlined'}
            onClick={() => setActiveTab('withdrawals')}
            sx={{ mr: 2 }}
          >
            Withdrawals
          </Button>
          <Button
            variant={activeTab === 'transactions' ? 'contained' : 'outlined'}
            onClick={() => setActiveTab('transactions')}
          >
            Wallet Transactions
          </Button>
        </Box>

        {/* Withdrawals Table - existing code */}
        {activeTab === 'withdrawals' && (
          <Paper>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6">
                Withdrawal History
              </Typography>
            </Box>

            {withdrawals.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <AccountBalance sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No withdrawals yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Request your first withdrawal to get started
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setShowRequestForm(true)}
                  disabled={availableBalance <= 0}
                >
                  Request Withdrawal
                </Button>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date Requested</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Processed Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {withdrawals.map((withdrawal) => (
                      <TableRow key={withdrawal.id}>
                        <TableCell>
                          {new Date(withdrawal.requestedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            ${withdrawal.amount.toLocaleString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {withdrawal.currency}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <AccountBalance fontSize="small" />
                            <Typography variant="body2">
                              {withdrawal.paymentMethod}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={withdrawal.status}
                            color={getStatusColor(withdrawal.status) as any}
                            size="small"
                            icon={<span>{getStatusIcon(withdrawal.status)}</span>}
                          />
                        </TableCell>
                        <TableCell>
                          {withdrawal.processedAt 
                            ? new Date(withdrawal.processedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedWithdrawal(withdrawal);
                                  setShowDetails(true);
                                }}
                              >
                                <Info />
                              </IconButton>
                            </Tooltip>
                            
                            {canCancel(withdrawal) && (
                              <Tooltip title="Cancel Withdrawal">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleCancelWithdrawal(withdrawal.id)}
                                >
                                  <Cancel />
                                </IconButton>
                              </Tooltip>
                            )}
                            
                            {withdrawal.transactionId && (
                              <Tooltip title="Download Receipt">
                                <IconButton size="small">
                                  <Download />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        )}

        {/* Add Wallet Transactions Table */}
        {activeTab === 'transactions' && (
          <Paper>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6">
                Wallet Transaction History
              </Typography>
            </Box>

            {walletTransactions.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <AccountBalance sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No transactions yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Wallet transactions will appear here
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Description</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {walletTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {new Date(transaction.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={transaction.type}
                            color={transaction.type === 'Credit' ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            fontWeight="medium"
                            color={transaction.type === 'Credit' ? 'success.main' : 'error.main'}
                          >
                            {transaction.type === 'Credit' ? '+' : '-'}${transaction.amount.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={transaction.status}
                            color={getStatusColor(transaction.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {transaction.description || '-'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        )}

        {/* Request Withdrawal Form */}
        <WithdrawalRequestForm
          open={showRequestForm}
          onClose={() => setShowRequestForm(false)}
          onSuccess={handleRequestSuccess}
          availableBalance={availableBalance}
        />

        {/* Withdrawal Details Dialog */}
        <Dialog
          open={showDetails}
          onClose={() => setShowDetails(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Withdrawal Details</DialogTitle>
          <DialogContent>
            {selectedWithdrawal && (
              <Stack spacing={2} sx={{ mt: 1 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Withdrawal ID
                  </Typography>
                  <Typography variant="body1">
                    {selectedWithdrawal.id}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Amount
                  </Typography>
                  <Typography variant="h6">
                    ${selectedWithdrawal.amount.toLocaleString()} {selectedWithdrawal.currency}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Payment Method
                  </Typography>
                  <Typography variant="body1">
                    {selectedWithdrawal.paymentMethod}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={selectedWithdrawal.status}
                    color={getStatusColor(selectedWithdrawal.status) as any}
                    size="small"
                  />
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Requested Date
                  </Typography>
                  <Typography variant="body1">
                    {new Date(selectedWithdrawal.requestedAt).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Typography>
                </Box>

                {selectedWithdrawal.processedAt && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Processed Date
                    </Typography>
                    <Typography variant="body1">
                      {new Date(selectedWithdrawal.processedAt).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Typography>
                  </Box>
                )}

                {selectedWithdrawal.rejectionReason && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Rejection Reason
                    </Typography>
                    <Alert severity="error" sx={{ mt: 1 }}>
                      {selectedWithdrawal.rejectionReason}
                    </Alert>
                  </Box>
                )}

                {selectedWithdrawal.transactionId && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Transaction ID
                    </Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                      {selectedWithdrawal.transactionId}
                    </Typography>
                  </Box>
                )}
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowDetails(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default SellerWithdrawalsPage;