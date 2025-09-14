import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, Button, Chip, CircularProgress, Snackbar, Alert, Stack } from '@mui/material';
import apiService from '../../services/api';

// Minimal TopUp type for admin review
interface TopUp {
  id: string;
  userId: string;
  walletId: string;
  amount: number;
  currency: string;
  channel: string;
  status: string;
  externalReference?: string;
  requestedAt: string;
  confirmedAt?: string;
  failedAt?: string;
  failureReason?: string;
}

const statusColor = (status: string) => {
  switch (status) {
    case 'Confirmed': return 'success';
    case 'Failed': return 'error';
    case 'PendingConfirmation': return 'warning';
    default: return 'default';
  }
};

const AdminTopUpReview: React.FC = () => {
  const [topUps, setTopUps] = useState<TopUp[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const fetchTopUps = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.get<TopUp[]>('/admin/topups');
      setTopUps(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load top-ups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTopUps(); }, []);

  const handleReview = async (id: string, reviewStatus: 'Paid' | 'Suspicious' | 'NotPaid') => {
    try {
      await apiService.post('/admin/topups/review', { topUpId: id, reviewStatus });
      setSnackbar(`Top-up marked as ${reviewStatus}`);
      fetchTopUps();
    } catch (e: any) {
      setSnackbar(e?.message || 'Review failed');
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Wallet Top-Up Reviews</Typography>
      <Paper sx={{ p: 2 }}>
        {loading ? <CircularProgress /> : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Channel</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Requested At</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {topUps.map(t => (
                <TableRow key={t.id}>
                  <TableCell>{t.id.slice(0, 8)}...</TableCell>
                  <TableCell>{t.userId.slice(0, 8)}...</TableCell>
                  <TableCell>{t.amount} {t.currency}</TableCell>
                  <TableCell>{t.channel}</TableCell>
                  <TableCell><Chip label={t.status} color={statusColor(t.status) as any} size="small" /></TableCell>
                  <TableCell>{new Date(t.requestedAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Button size="small" color="success" variant="contained" disabled={t.status === 'Confirmed'} onClick={() => handleReview(t.id, 'Paid')}>Paid</Button>
                      <Button size="small" color="warning" variant="contained" disabled={t.status === 'Confirmed'} onClick={() => handleReview(t.id, 'Suspicious')}>Suspicious</Button>
                      <Button size="small" color="error" variant="contained" disabled={t.status === 'Confirmed'} onClick={() => handleReview(t.id, 'NotPaid')}>Not Paid</Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Paper>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)}>
        <Alert severity="info" onClose={() => setSnackbar(null)}>{snackbar}</Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminTopUpReview;
