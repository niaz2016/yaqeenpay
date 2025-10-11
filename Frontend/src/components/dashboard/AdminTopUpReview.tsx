import React, { useEffect, useState } from 'react';
import { Box, Paper, Table, TableHead, TableRow, TableCell, TableBody, Button, IconButton, Tooltip, Chip, CircularProgress, Snackbar, Alert, Stack, FormControl, InputLabel, Select, MenuItem, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Typography } from '@mui/material';
import apiService from '../../services/api';

// derive API host/base from Vite env (api.ts uses VITE_API_URL which includes '/api')
const API_HOST = (import.meta.env.VITE_API_URL || 'https://localhost:7137/api').replace(/\/api\/?$/i, '');

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
  // optional fields that may come from backend
  proofUrl?: string;
  proofs?: { fileUrl?: string; fileName?: string; notes?: string }[];
  notes?: string;
  description?: string;
}

const statusColor = (status: string) => {
  switch (status) {
    case 'Confirmed': return 'success';
    case 'Failed': return 'error';
    case 'PendingConfirmation': return 'warning';
    case 'PendingAdminApproval': return 'info';
    default: return 'default';
  }
};

const AdminTopUpReview: React.FC = () => {
  const [topUps, setTopUps] = useState<TopUp[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('PendingAdminApproval');
  const [daysFilter, setDaysFilter] = useState<number>(2);
  const [selectedTopUp, setSelectedTopUp] = useState<TopUp | null>(null);
  const [viewOpen, setViewOpen] = useState(false);

  const fetchTopUps = async () => {
    setLoading(true);
    setError(null);
    try {
      // compute dateFrom based on daysFilter
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - daysFilter);
      const dateFromIso = dateFrom.toISOString();
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (daysFilter > 0) params.append('dateFrom', dateFromIso);
      const url = `/admin/topups?${params.toString()}`;
  const resp = await apiService.get<any>(url);
  const items = Array.isArray(resp) ? resp : (resp.items || resp.Items || resp.data || []);
  setTopUps(items);
    } catch (e: any) {
      setError(e?.message || 'Failed to load top-ups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTopUps(); }, [statusFilter, daysFilter]);

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
      <Paper sx={{ p: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <FormControl size="small">
            <InputLabel id="status-filter-label">Status</InputLabel>
            <Select labelId="status-filter-label" value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value as string)}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="PendingConfirmation">Pending Confirmation</MenuItem>
              <MenuItem value="PendingAdminApproval">Pending Admin Approval</MenuItem>
              <MenuItem value="Confirmed">Confirmed</MenuItem>
              <MenuItem value="Failed">Failed</MenuItem>
            </Select>
          </FormControl>
          <TextField size="small" label="Days" type="number" value={daysFilter} onChange={(e) => setDaysFilter(Number(e.target.value))} sx={{ width: 100 }} />
          <Button variant="outlined" onClick={() => fetchTopUps()}>Refresh</Button>
        </Stack>
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
                  <TableCell>{t.id?.slice(0, 8) || 'N/A'}...</TableCell>
                  <TableCell>{t.userId?.slice(0, 8) || 'N/A'}...</TableCell>
                  <TableCell>{t.amount} {t.currency}</TableCell>
                  <TableCell>{t.channel}</TableCell>
                  <TableCell><Chip label={t.status} color={statusColor(t.status) as any} size="small" /></TableCell>
                  <TableCell>{new Date(t.requestedAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Tooltip title="View proof & notes">
                        <IconButton size="small" onClick={() => { setSelectedTopUp(t); setViewOpen(true); }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </IconButton>
                      </Tooltip>
                      <Button size="small" color="success" variant="contained" disabled={t.status === 'Confirmed' || t.status === 'Failed'} onClick={() => handleReview(t.id, 'Paid')}>Paid</Button>
                      <Button size="small" color="warning" variant="contained" disabled={t.status === 'Confirmed' || t.status === 'Failed'} onClick={() => handleReview(t.id, 'Suspicious')}>Suspicious</Button>
                      <Button size="small" color="error" variant="contained" disabled={t.status === 'Confirmed' || t.status === 'Failed'} onClick={() => handleReview(t.id, 'NotPaid')}>Not Paid</Button>
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
      <Dialog open={viewOpen} onClose={() => { setViewOpen(false); setSelectedTopUp(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>Top-up Details</DialogTitle>
        <DialogContent>
          {selectedTopUp ? (
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">Requested At</Typography>
              <Typography>{new Date(selectedTopUp.requestedAt).toLocaleString()}</Typography>

              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>Amount</Typography>
              <Typography>{selectedTopUp.amount} {selectedTopUp.currency}</Typography>

              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>Channel</Typography>
              <Typography>{selectedTopUp.channel}</Typography>

              {/* show description/notes if the backend provides them in any field */}
              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>Notes</Typography>
              <Typography>{(selectedTopUp as any).notes || (selectedTopUp as any).description || ((selectedTopUp as any).proofs && (selectedTopUp as any).proofs[0]?.notes) || '-'}</Typography>

              {/* show proof image if available (prefer dto.proofUrl, then dto.proofs[0].fileUrl, then attachments) */}
              {((selectedTopUp as any).proofUrl || ((selectedTopUp as any).proofs && (selectedTopUp as any).proofs.length)) ? (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Proof</Typography>
                  <img
                    src={(() => {
                      const raw = (selectedTopUp as any).proofUrl || (selectedTopUp as any).proofs && (selectedTopUp as any).proofs[0]?.fileUrl;
                      if (!raw) return undefined;
                      // keep data: and absolute URLs unchanged
                      if (raw.startsWith('data:') || raw.match(/^https?:\/\//i)) return raw;
                      // relative paths (starting with /uploads or uploads) should be requested from API host
                      if (raw.startsWith('/')) return API_HOST + raw;
                      return API_HOST + '/' + raw;
                    })()}
                    alt={(selectedTopUp as any).proofs && (selectedTopUp as any).proofs[0]?.fileName ? (selectedTopUp as any).proofs[0].fileName : 'proof'}
                    style={{ width: '100%', maxHeight: 400, objectFit: 'contain', cursor: 'pointer' }}
                    onClick={() => {
                      const raw = (selectedTopUp as any).proofUrl || (selectedTopUp as any).proofs && (selectedTopUp as any).proofs[0]?.fileUrl;
                      const url = raw ? (raw.startsWith('data:') || raw.match(/^https?:\/\//i) ? raw : (raw.startsWith('/') ? API_HOST + raw : API_HOST + '/' + raw)) : undefined;
                      if (url) window.open(url, '_blank');
                    }}
                  />
                </Box>
              ) : ((selectedTopUp as any).attachments && (selectedTopUp as any).attachments.length && (selectedTopUp as any).attachments[0].url ? (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Proof</Typography>
                  <img src={(selectedTopUp as any).attachments[0].url} alt={(selectedTopUp as any).attachments[0].name || 'proof'} style={{ width: '100%', maxHeight: 400, objectFit: 'contain', cursor: 'pointer' }} onClick={() => { const url = (selectedTopUp as any).attachments && (selectedTopUp as any).attachments.length ? (selectedTopUp as any).attachments[0].url : undefined; if (url) window.open(url, '_blank'); }} />
                </Box>
              ) : null)}
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setViewOpen(false); setSelectedTopUp(null); }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminTopUpReview;
