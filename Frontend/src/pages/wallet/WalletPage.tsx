import React, { useEffect, useState } from 'react';
import { Container, Paper, Typography, Tabs, Tab, Box, Alert, Snackbar, TextField, MenuItem, Stack, Button, Chip, Fade } from '@mui/material';
import walletService from '../../services/walletService';
import type { WalletSummary, WalletTransaction, WalletAnalytics, TopUpDto, TransactionType } from '../../types/wallet';
import BalanceCard from '../../components/wallet/BalanceCard';
import TransactionTable from '../../components/wallet/TransactionTable';
import TopUpQrModal from '../../components/wallet/TopUpQrModal';
import WalletCharts from '../../components/wallet/WalletCharts';

const WalletPage: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [tx, setTx] = useState<WalletTransaction[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<WalletAnalytics | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [txType, setTxType] = useState<TransactionType | 'All'>('All');
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [topUpSubmitting, setTopUpSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [withdrawableBadge, setWithdrawableBadge] = useState<{ amount?: number; currency?: string; orderCode?: string; ts: string } | null>(null);

  const loadSummary = async () => {
    try {
      const data = await walletService.getSummary();
      setSummary(data);
    } catch (e: any) {
      console.error('Wallet summary load failed:', e);
      setError(e?.message || 'Failed to load wallet summary');
    }
  };

  const handleRefreshBalance = async () => {
    setRefreshing(true);
    try {
      await loadSummary();
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to refresh balance');
    } finally {
      setRefreshing(false);
    }
  };

  const loadTx = async () => {
    setLoading(true);
    try {
      const res = await walletService.getTransactions({ page, pageSize, sortBy: 'date', sortDir: 'desc', type: txType });
      setTx(res.items);
      setRowCount(res.total);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const data = await walletService.getAnalytics();
      setAnalytics(data);
    } catch (e: any) {
      console.error('Wallet analytics load failed:', e);
      // Not critical; don't block page
    }
  };

  useEffect(() => {
    loadSummary();
    loadTx();
    loadAnalytics();
    // Listen for notification events carrying withdrawable flag
    const handler = (e: Event) => {
      const detail: any = (e as CustomEvent).detail;
      if (detail?.data?.withdrawable) {
        setWithdrawableBadge({
          amount: detail.data.amount,
          currency: detail.data.currency,
          orderCode: detail.data.orderCode,
          ts: new Date().toISOString()
        });
        // Refresh summary to reflect new balances
        loadSummary();
      }
    };
    window.addEventListener('app:notification-sent', handler as any);
    return () => window.removeEventListener('app:notification-sent', handler as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, txType]);


  // Handler for QR modal submission: use transactionId instead of image
  const handleQrProofSubmit = async ({ amount, transactionId }: { amount: number; transactionId: string }) => {
    setTopUpSubmitting(true);
    try {
      const topUp: TopUpDto = await walletService.topUp({
        amount,
        currency: summary?.currency || 'PKR',
        channel: 'Easypaisa',
      }) as TopUpDto;

      // submit the transaction id against the created topup
      await walletService.submitTopUpReference(topUp.id, transactionId);

      setToast('Transaction submitted. Awaiting admin approval.');
      setQrModalOpen(false);
      await loadSummary();
      await loadTx();
      await loadAnalytics();
    } catch (e: any) {
      setToast(e?.message || 'Top-up submit failed');
    } finally {
      setTopUpSubmitting(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ px: { xs: 1.5, sm: 2 } }}>
      <Box sx={{ mb: 2, position: 'relative', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Typography variant="h4">My Wallet</Typography>
        <Typography variant="body2" color="text.secondary">Manage your balance, view transactions, and top up.</Typography>
        <Fade in={!!withdrawableBadge} unmountOnExit>
          <Chip
            color="success"
            variant="filled"
            label={`New withdrawable funds${withdrawableBadge?.amount ? ': ' + (withdrawableBadge.currency || 'PKR') + ' ' + withdrawableBadge.amount.toLocaleString() : ''}${withdrawableBadge?.orderCode ? ' (Order ' + withdrawableBadge.orderCode + ')' : ''}`}
            onDelete={() => setWithdrawableBadge(null)}
            sx={{ alignSelf: 'flex-start', mt: 0.5, fontWeight: 600 }}
          />
        </Fade>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      {/* Balance Card and Analytics - Equal Width Layout */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
        gap: 2, 
        mb: 3,
        minWidth: 0,
        width: '100%'
      }}>
        <Box sx={{ minWidth: 0, height: '340px' }}>
          <BalanceCard
            summary={summary}
            onRefresh={handleRefreshBalance}
            refreshing={refreshing}
            onTopUp={() => setQrModalOpen(true)}
          />
        </Box>
        <Box sx={{ minWidth: 0, height: '340px' }}>
          <WalletCharts analytics={analytics} />
        </Box>
      </Box>

      <TopUpQrModal
        open={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        onSubmit={handleQrProofSubmit}
        submitting={topUpSubmitting}
      />
        
      {/* Transactions Section */}
      <Paper sx={{ p: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="Transactions" />
          <Tab label="Details" />
        </Tabs>
        {tab === 0 && (
          <>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
              <TextField
                label="Type"
                select
                value={txType}
                onChange={(e) => { setTxType(e.target.value as any); setPage(1); }}
                sx={{ width: 220 }}
              >
                {['All', 'TopUp', 'Payment', 'Refund', 'Withdrawal', 'Adjustment'].map((t) => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </TextField>
              <Button variant="outlined" onClick={() => { loadTx(); }} disabled={loading}>Refresh</Button>
            </Stack>
            <Box sx={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <Box sx={{ minWidth: { xs: 640, sm: 720, md: '100%' } }}>
                <TransactionTable
                  rows={tx}
                  rowCount={rowCount}
                  page={page}
                  pageSize={pageSize}
                  loading={loading}
                  onPageChange={setPage}
                  onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
                  // Temporary client-side derivation of frozen amount until backend supplies authoritative value
                  overrideCurrentFrozen={(() => {
                    let frozen = 0; let processed = 0;
                    tx.forEach(r => {
                      const desc = (r.description || '').toLowerCase();
                      const amtRaw = typeof r.amount === 'string' ? parseFloat(r.amount) : r.amount;
                      const amt = (typeof amtRaw === 'number' && !isNaN(amtRaw)) ? amtRaw : 0;
                      const isProcessed = desc.includes('payment completed for order') || desc.includes('payment completed');
                      const isFrozen = ((desc.includes('payment for order') && !desc.includes('payment received for order')) ||
                        desc.includes('payment for orde') || desc.includes('order 0199') ||
                        desc.includes('freeze'));
                      const isPaymentReceived = desc.includes('payment received for order');
                      if (isProcessed || isPaymentReceived) {
                        processed += amt;
                      } else if (isFrozen) {
                        frozen += amt;
                      }
                    });
                    return Math.max(0, frozen - processed);
                  })()}
                />
              </Box>
            </Box>
          </>
        )}
        {tab === 1 && (
          <Box>
            <Typography variant="body2">Wallet currency: {summary?.currency || '—'}</Typography>
            <Typography variant="body2">Status: {summary?.status || '—'}</Typography>
            <Typography variant="body2">Last updated: {summary ? new Date(summary.updatedAt).toLocaleString() : '—'}</Typography>
          </Box>
        )}
      </Paper>

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast(null)}>
        <Alert severity="info" onClose={() => setToast(null)}>{toast}</Alert>
      </Snackbar>
    </Container>
  );
};

export default WalletPage;
