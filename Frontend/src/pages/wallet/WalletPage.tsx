import React, { useEffect, useState } from 'react';
import { Container, Paper, Typography, Tabs, Tab, Box, Alert, Snackbar, TextField, MenuItem, Stack, Button } from '@mui/material';
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

  const loadSummary = async () => {
    try {
      const data = await walletService.getSummary();
      setSummary(data);
    } catch (e: any) {
      console.error('Wallet summary load failed:', e);
      setError(e?.message || 'Failed to load wallet summary');
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, txType]);


  // Handler for QR modal submission (to be implemented)
  const handleQrProofSubmit = async ({ amount, file, notes }: { amount: number; file: File; notes: string }) => {
    setTopUpSubmitting(true);
    try {
      // 1. Initiate top-up (create a pending top-up record)
      const topUp: TopUpDto = await walletService.topUp({
        amount,
        currency: summary?.currency || 'PKR',
        channel: 'Easypaisa',
      }) as TopUpDto;
      // 2. Upload proof
      await walletService.uploadTopUpProof(topUp.id, file, notes);
      setToast('Proof uploaded successfully. Awaiting admin approval.');
      setQrModalOpen(false);
      await loadSummary();
      await loadTx();
      await loadAnalytics();
    } catch (e: any) {
      setToast(e?.message || 'Top-up proof upload failed');
    } finally {
      setTopUpSubmitting(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4">My Wallet</Typography>
        <Typography variant="body2" color="text.secondary">Manage your balance, view transactions, and top up.</Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        <Box>
          <BalanceCard summary={summary} />
        </Box>
        <Box>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>Top Up</Typography>
            <Button variant="contained" color="primary" onClick={() => setQrModalOpen(true)}>
              Top Up
            </Button>
          </Paper>
        </Box>
      <TopUpQrModal
        open={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        onSubmit={handleQrProofSubmit}
        submitting={topUpSubmitting}
      />
        <Box sx={{ gridColumn: '1 / -1' }}>
          <WalletCharts analytics={analytics} />
        </Box>
        <Box sx={{ gridColumn: '1 / -1' }}>
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
                <TransactionTable
                  rows={tx}
                  rowCount={rowCount}
                  page={page}
                  pageSize={pageSize}
                  loading={loading}
                  onPageChange={setPage}
                  onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
                />
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
        </Box>
      </Box>

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast(null)}>
        <Alert severity="info" onClose={() => setToast(null)}>{toast}</Alert>
      </Snackbar>
    </Container>
  );
};

export default WalletPage;
