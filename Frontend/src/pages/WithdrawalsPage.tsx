// Keep the single canonical WithdrawalsPage component above; duplicate content removed.
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
  MenuItem,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add,
  Refresh,
  Info,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import walletService from '../services/walletService';
import { selectedSellerService } from '../services/sellerServiceSelector';
import notificationService from '../services/notificationService';
import type { WalletSummary, WalletTransaction } from '../types/wallet';
import type { Withdrawal } from '../types/seller';

const WithdrawalsPage: React.FC = () => {
  const { user } = useAuth();
  const { fetchNewNotifications } = useNotifications();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [showWithdrawalDialog, setShowWithdrawalDialog] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<WalletTransaction | null>(null);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBalance, setShowBalance] = useState(false); // Hidden by default
  const [showRequestForm, setShowRequestForm] = useState(false);

  
  // Withdrawal form state
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  // default to first bank option
  const [withdrawalMethod, setWithdrawalMethod] = useState('ABL');
  const [bankAccount, setBankAccount] = useState('');
  const [accountTitle, setAccountTitle] = useState('');
  const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0 = Details, 1 = Transactions

  const isSeller = user?.roles?.includes('Seller') || user?.roles?.includes('seller');

  // Tab panel component
  interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
  }

  function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`withdrawals-tabpanel-${index}`}
        aria-labelledby={`withdrawals-tab-${index}`}
        {...other}
      >
        {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
      </div>
    );
  }

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

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

      // Fetch withdrawal data for the current user (works for buyers and sellers)
      try {
        const withdrawalData = await selectedSellerService.getWithdrawals();
        // Patch: extract items from paginated response if present
        let items: Withdrawal[] = [];
        if (Array.isArray(withdrawalData)) {
          items = withdrawalData as Withdrawal[];
        } else if (withdrawalData && typeof withdrawalData === 'object') {
          if (Array.isArray((withdrawalData as any).items)) items = (withdrawalData as any).items;
          else if (Array.isArray((withdrawalData as any).transactions)) items = (withdrawalData as any).transactions;
          else if (Array.isArray((withdrawalData as any).data)) items = (withdrawalData as any).data;
          else items = [];
        }
        setWithdrawals(items);
      } catch (err) {
        console.warn('Could not fetch withdrawal data for current user:', err);
        // Non-fatal: may be empty or require elevated permissions
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
        // determine whether the selected method is a bank that requires an account title
        const bankMethodsRequiringTitle = ['ABL', 'BAF', 'FBL', 'HMPBL', 'HBL'];
        if (bankMethodsRequiringTitle.includes(withdrawalMethod) && !accountTitle) {
          setError('Please provide the account title for the selected bank');
          setSubmittingWithdrawal(false);
          return;
        }

        await selectedSellerService.requestWithdrawal({
          amount,
          paymentMethod: withdrawalMethod,
          bankDetails: {
            accountNumber: bankAccount,
            accountHolderName: accountTitle || undefined,
            bankName: withdrawalMethod
          }
        });
      } else {
        // Buyers can now request withdrawals using the same service
        await selectedSellerService.requestWithdrawal({
          amount,
          paymentMethod: withdrawalMethod,
          bankDetails: {
            accountNumber: bankAccount,
            accountHolderName: accountTitle || undefined,
            bankName: withdrawalMethod
          }
        });
      }

      // Call the notification service to send notifications to backend
      try {
        await notificationService.notifyWithdrawalInitiated(
          user?.id || '',
          amount,
          'PKR',
          withdrawalMethod
        );
      } catch (notifError) {
        console.warn('Failed to send withdrawal notification:', notifError);
        // Don't fail the withdrawal if notification fails
      }
      
      // Trigger notification refresh to show the new notification
      setTimeout(() => {
        fetchNewNotifications({ limit: 15 });
      }, 500);
      // Refresh again after a delay to ensure backend processing is complete
      setTimeout(() => {
        fetchNewNotifications({ limit: 15 });
      }, 2000);

      setShowRequestForm(false);
      setWithdrawalAmount('');
      setBankAccount('');
      setAccountTitle('');
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
      case 'settled':
        return 'success';
      case 'completed':
        return 'success';
      case 'initiated':
        return 'info'; // Blue for just initiated, awaiting admin approval
      case 'pending':
        return 'warning';
      case 'pendingprovider':
        return 'warning';
      case 'failed':
        return 'error';
      case 'reversed':
        return 'error';
      case 'rejected':
        return 'error';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'initiated':
        return 'Awaiting Admin Approval';
      case 'pending':
        return 'Pending';
      case 'pendingprovider':
        return 'Processing';
      case 'settled':
        return 'Completed';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'reversed':
        return 'Reversed';
      case 'rejected':
        return 'Rejected';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const formatCurrency = (amount: number) => {
    // Display as Wallet Credits without implying fiat custody
    return `${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} Wallet Credits`;
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
                  Denomination Reference
                </Typography>
                <Typography variant="h6">
                  Wallet Credits (1 Credit = PKR 1 reference)
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

      {/* Tabbed Interface for Details and Transactions */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="withdrawals tabs">
          <Tab label="Details" id="withdrawals-tab-0" aria-controls="withdrawals-tabpanel-0" />
          <Tab label="Transactions" id="withdrawals-tab-1" aria-controls="withdrawals-tabpanel-1" />
        </Tabs>

        {/* Details Tab - Withdrawal History */}
        <TabPanel value={activeTab} index={0}>
          {isSeller && withdrawals.length > 0 ? (
            <>
              <Box sx={{ p: 2, pb: 0 }}>
                <Typography variant="h6" gutterBottom>
                  Withdrawal History
                </Typography>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Reference</TableCell>
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
                        <TableCell>{withdrawal.reference || withdrawal.id}</TableCell>
                        <TableCell>
                          {new Date(withdrawal.requestedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{formatCurrency(withdrawal.amount)}</TableCell>
                        <TableCell>{withdrawal.channel || withdrawal.paymentMethod || 'Bank Transfer'}</TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusLabel(withdrawal.status)}
                            color={getStatusColor(withdrawal.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => { setSelectedWithdrawal(withdrawal); setShowWithdrawalDialog(true); }}>
                              <Info />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {isSeller ? 'No withdrawal requests yet.' : 'Withdrawal history will appear here once you create withdrawal requests.'}
              </Typography>
            </Box>
          )}
        </TabPanel>

        {/* Transactions Tab - Recent Wallet Transactions */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ p: 2, pb: 0 }}>
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
                  <TableCell>Ref</TableCell>
                  <TableCell>Proof</TableCell>
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
                    <TableCell>{transaction.transactionReference || ''}</TableCell>
                    <TableCell>
                      {transaction.proofUrl ? (
                        <img
                          src={transaction.proofUrl}
                          alt="proof"
                          style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }}
                          onClick={() => window.open(transaction.proofUrl, '_blank')}
                        />
                      ) : (transaction.attachments && transaction.attachments.length && transaction.attachments[0].url ? (
                        <img
                          src={transaction.attachments[0].url}
                          alt={transaction.attachments[0].name || 'proof'}
                          style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }}
                          onClick={() => {
                            const url = transaction.attachments && transaction.attachments.length ? transaction.attachments[0].url : undefined;
                            if (url) window.open(url, '_blank');
                          }}
                        />
                      ) : '-' )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={transaction.status}
                        color={getStatusColor(transaction.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button variant="outlined" size="small" onClick={() => { setSelectedTransaction(transaction); setShowTransactionDialog(true); }}>View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>

      {/* Withdrawal Details Dialog */}
      <Dialog open={showWithdrawalDialog} onClose={() => { setShowWithdrawalDialog(false); setSelectedWithdrawal(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>Withdrawal Details</DialogTitle>
        <DialogContent>
          {selectedWithdrawal ? (
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">Reference</Typography>
              <Typography>{selectedWithdrawal.reference || selectedWithdrawal.id}</Typography>

              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>Requested</Typography>
              <Typography>{selectedWithdrawal.requestedAt ? new Date(selectedWithdrawal.requestedAt).toLocaleString() : 'N/A'}</Typography>

              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>Amount</Typography>
              <Typography>{formatCurrency(selectedWithdrawal.amount)}</Typography>

              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>Status</Typography>
              <Chip label={getStatusLabel(selectedWithdrawal.status)} color={getStatusColor(selectedWithdrawal.status)} size="small" />

              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>Method / Channel</Typography>
              <Typography>{selectedWithdrawal.channel || selectedWithdrawal.paymentMethod || '-'}</Typography>

              {selectedWithdrawal.channelReference && (
                <>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>Channel Reference</Typography>
                  <Typography>{selectedWithdrawal.channelReference}</Typography>
                </>
              )}

              {selectedWithdrawal.failureReason && (
                <>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>Failure Reason</Typography>
                  <Typography color="error">{selectedWithdrawal.failureReason}</Typography>
                </>
              )}
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setShowWithdrawalDialog(false); setSelectedWithdrawal(null); }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Transaction Details Dialog */}
      <Dialog open={showTransactionDialog} onClose={() => { setShowTransactionDialog(false); setSelectedTransaction(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>Transaction Details</DialogTitle>
        <DialogContent>
          {selectedTransaction ? (
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">Date</Typography>
              <Typography>{selectedTransaction.createdAt ? new Date(selectedTransaction.createdAt).toLocaleString() : 'N/A'}</Typography>

              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>Amount</Typography>
              <Typography>{formatCurrency(selectedTransaction.amount)}</Typography>

              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>Status</Typography>
              <Chip label={selectedTransaction.status} color={getStatusColor(selectedTransaction.status)} size="small" />

              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>Description</Typography>
              <Typography>{selectedTransaction.description || '-'}</Typography>

              {selectedTransaction.proofUrl ? (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Proof</Typography>
                  <img src={selectedTransaction.proofUrl} alt="proof" style={{ width: '100%', maxHeight: 400, objectFit: 'contain', cursor: 'pointer' }} onClick={() => window.open(selectedTransaction.proofUrl, '_blank')} />
                </Box>
              ) : (selectedTransaction.attachments && selectedTransaction.attachments.length && selectedTransaction.attachments[0].url ? (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Proof</Typography>
                  <img src={selectedTransaction.attachments[0].url} alt={selectedTransaction.attachments[0].name || 'proof'} style={{ width: '100%', maxHeight: 400, objectFit: 'contain', cursor: 'pointer' }} onClick={() => { const url = selectedTransaction.attachments && selectedTransaction.attachments.length ? selectedTransaction.attachments[0].url : undefined; if (url) window.open(url, '_blank'); }} />
                </Box>
              ) : null)}
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setShowTransactionDialog(false); setSelectedTransaction(null); }}>Close</Button>
        </DialogActions>
      </Dialog>

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
              label="Withdrawal Amount (Wallet Credits)"
              type="number"
              value={withdrawalAmount}
              onChange={(e) => setWithdrawalAmount(e.target.value)}
              sx={{ mb: 2 }}
              helperText={`Available: ${walletSummary ? formatCurrency(walletSummary.balance) : '0'}`}
            />
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Withdrawal Method</InputLabel>
              <Select
                value={withdrawalMethod}
                onChange={(e) => setWithdrawalMethod(e.target.value)}
              >
                <MenuItem value="ABL">ABL</MenuItem>
                <MenuItem value="BAF">BAF</MenuItem>
                <MenuItem value="FBL">FBL</MenuItem>
                <MenuItem value="HMPBL">HMPBL</MenuItem>
                <MenuItem value="HBL">HBL</MenuItem>
                <MenuItem value="Easypaisa">Easypaisa</MenuItem>
                <MenuItem value="Jazzcash">Jazzcash</MenuItem>
                <MenuItem value="UPaisa">UPaisa</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Bank Account / Mobile Number"
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
            />

            <TextField
              fullWidth
              label="Account Title"
              value={accountTitle}
              onChange={(e) => setAccountTitle(e.target.value)}
              helperText="Enter the account holder/title for the selected bank account"
              sx={{ mt: 2 }}
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
            disabled={submittingWithdrawal}
          >
            {submittingWithdrawal ? <CircularProgress size={20} /> : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default WithdrawalsPage;