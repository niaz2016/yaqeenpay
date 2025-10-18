import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  
} from '@mui/material';
import adminService from '../../services/adminService';
import type { UserWithdrawal as Withdrawal } from '../../types/user';
import { useNotifications } from '../../context/NotificationContext';

const API_HOST = (import.meta.env.VITE_API_URL || 'https://localhost:7137/api').replace(/\/api\/?$/i, '');

const AdminWithdrawals: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity?: 'success' | 'error' } | null>(null);
  const [filterRef, setFilterRef] = useState<string>('');
  const [filterSeller, setFilterSeller] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedApproveId, setSelectedApproveId] = useState<string | null>(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const { fetchNewNotifications } = useNotifications();

  const fetchWithdrawals = async () => {
    setLoading(true);
    setError(null);
    try {
      const opts: any = { pageNumber: page, pageSize };
      if (filterRef) opts.reference = filterRef;
      if (filterSeller) opts.sellerId = filterSeller;
      // If no status filter is selected, send both 'Initiated' and 'PendingProvider' for pending by default
      if (filterStatus && filterStatus !== 'all') {
        opts.status = filterStatus;
      }

  const list = await adminService.getWithdrawals(opts as any);
      // backend may return a paginated object { items, total, totalCount } or an array fallback
      let items: Withdrawal[] = [];
      let total: number | null = null;
      if (Array.isArray(list)) {
        items = list as Withdrawal[];
      } else if (list && typeof list === 'object') {
        if (Array.isArray((list as any).items)) items = (list as any).items;
        else if (Array.isArray((list as any).transactions)) items = (list as any).transactions;
        else if (Array.isArray((list as any).data)) items = (list as any).data;
        else items = [];

        total = (list as any).total ?? (list as any).totalCount ?? (Array.isArray(items) ? items.length : null);
      }
      setWithdrawals(items);
      setTotalCount(typeof total === 'number' ? total : null);
    } catch (e) {
      console.error('Failed to fetch withdrawals', e);
      setError('Failed to load withdrawals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // refetch when page or any filter changes
    fetchWithdrawals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, filterRef, filterSeller, filterStatus]);

  const handleApprove = async (id: string) => {
    try {
      // Find the withdrawal details for notification
      const withdrawal = withdrawals.find(w => w.id === id);
      
      await adminService.approveWithdrawal(id);
      setSnack({ open: true, message: 'Withdrawal approved', severity: 'success' });
      
      // Send approval notification to the user
      if (withdrawal) {
        try {
          // Import notification service dynamically to avoid circular dependencies
          const { default: notificationService } = await import('../../services/notificationService');
          await notificationService.notifyWithdrawalApproved(
            withdrawal.sellerId, // Use sellerId as the user ID
            withdrawal.amount,
            withdrawal.currency || 'PKR',
            withdrawal.channel || withdrawal.paymentMethod || 'Bank Transfer'
          );
        } catch (notifError) {
          console.error('Failed to send withdrawal approval notification:', notifError);
          // Don't fail the whole approval process if notification fails
        }
      }
      
      // Update local list: mark approved/Settled
      setWithdrawals((prev) => prev.map(w => w.id === id ? { ...w, status: 'Settled' } : w));
      
      // Trigger notification refresh to pick up any new notifications
      // Wait a bit for the backend to process the notification, then refresh multiple times
      setTimeout(() => {
        fetchNewNotifications({ limit: 15 });
      }, 500);
      setTimeout(() => {
        fetchNewNotifications({ limit: 15 });
      }, 2000);
      setTimeout(() => {
        fetchNewNotifications({ limit: 15 });
      }, 5000);
    } catch (e) {
      console.error('Approve failed', e);
      setSnack({ open: true, message: 'Failed to approve withdrawal', severity: 'error' });
    }
  };

  const isPendingStatus = (s?: string | null) => {
    if (!s) return false;
    const t = String(s).toLowerCase();
    return t === 'pending' || t === 'initiated' || t.includes('pending') || t === 'pendingprovider' || t === 'processing';
  };

  const pending = withdrawals.filter(w => isPendingStatus(w.status));

  // Note: server-side pagination is used; the returned `withdrawals` already reflect current filters/page

  // When using server-side pagination we just render withdrawals as returned
  const paged = withdrawals;
  const isFirstPage = page <= 1;
  const isLastPage = totalCount !== null ? (page * pageSize >= totalCount) : (withdrawals.length < pageSize);

  return (
    <Box>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6">Pending Withdrawals: {pending.length}</Typography>
          <Typography variant="body2" color="textSecondary">Total Withdrawals: {withdrawals.length}</Typography>
        </CardContent>
      </Card>

      <Box mb={2} display="flex" gap={2} alignItems="center">
        <TextField label="Reference" size="small" value={filterRef} onChange={(e) => { setPage(1); setFilterRef(e.target.value); }} />
        <TextField label="Seller ID" size="small" value={filterSeller} onChange={(e) => { setPage(1); setFilterSeller(e.target.value); }} />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={filterStatus} onChange={(e) => { setPage(1); setFilterStatus(String(e.target.value)); }}>
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="Initiated">Pending (Initiated)</MenuItem>
            <MenuItem value="PendingProvider">Pending (Provider)</MenuItem>
            <MenuItem value="Settled">Completed</MenuItem>
            <MenuItem value="Failed">Failed</MenuItem>
            <MenuItem value="Reversed">Reversed</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}><CircularProgress /></Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <Card>
          <CardContent>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Reference</TableCell>
                  <TableCell>Seller</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Bank Name</TableCell>
                  <TableCell>Account Title</TableCell>
                  <TableCell>Account Number</TableCell>
                  <TableCell>Requested</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paged.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell>{w.reference || w.id}</TableCell>
                    <TableCell>{w.sellerName || w.sellerId}</TableCell>
                    <TableCell>{w.amount} {w.currency}</TableCell>
                    {/* Parse bank details from notes: expected format e.g. "Account: 12345 | Account Title: John Doe | Bank: ABL" */}
                    {(() => {
                      const notes = w.notes || '';
                      const bankMatch = notes.match(/Bank:\s*([^|]+)/i);
                      const titleMatch = notes.match(/Account Title:\s*([^|]+)/i);
                      const accMatch = notes.match(/Account:\s*([^|]+)/i);
                      return (
                        <>
                          <TableCell>{bankMatch ? bankMatch[1].trim() : '-'}</TableCell>
                          <TableCell>{titleMatch ? titleMatch[1].trim() : '-'}</TableCell>
                          <TableCell>{accMatch ? accMatch[1].trim() : '-'}</TableCell>
                        </>
                      );
                    })()}
                    <TableCell>{w.requestedAt ? new Date(w.requestedAt).toLocaleString() : 'N/A'}</TableCell>
                    <TableCell>{w.status}</TableCell>
                    <TableCell>
                      {(w.status === 'Initiated' || w.status === 'PendingProvider') && (
                        <Button variant="contained" color="primary" size="small" onClick={() => { setSelectedApproveId(w.id); setSelectedWithdrawal(w); setConfirmOpen(true); }}>Approve</Button>
                      )}
                      {w.status === 'Settled' && (
                        <Typography color="success.main">Paid</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Box display="flex" justifyContent="center" mt={2} gap={1}>
              <Button disabled={isFirstPage} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</Button>
              <Typography sx={{ alignSelf: 'center' }}>Page {page}</Typography>
              <Button disabled={isLastPage} onClick={() => setPage(p => p + 1)}>Next</Button>
            </Box>
          </CardContent>
        </Card>
      )}

      <Snackbar open={!!snack?.open} autoHideDuration={4000} onClose={() => setSnack(null)}>
        {/* Snackbar expects a ReactElement child; provide a hidden Alert when snack is null to satisfy typing */}
        {snack ? (
          <Alert severity={snack.severity || 'success'} onClose={() => setSnack(null)}>{snack.message}</Alert>
        ) : (
          <Alert sx={{ display: 'none' }} severity="info">{''}</Alert>
        )}
      </Snackbar>

      <Dialog open={confirmOpen} onClose={() => { setConfirmOpen(false); setSelectedWithdrawal(null); setSelectedApproveId(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Approval</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to approve this withdrawal? This action will mark it as completed.</Typography>
          {selectedWithdrawal && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Seller Notes</Typography>
              <Typography>{selectedWithdrawal.notes || selectedWithdrawal.description || '-'}</Typography>

              {/* show proof image if available */}
              {selectedWithdrawal.proofUrl ? (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Proof</Typography>
                  <img src={(() => {
                      const raw = selectedWithdrawal.proofUrl;
                      if (!raw) return undefined;
                      if (raw.startsWith('data:') || raw.match(/^https?:\/\//i)) return raw;
                      if (raw.startsWith('/')) return API_HOST + raw;
                      return API_HOST + '/' + raw;
                    })()} alt="proof" style={{ width: '100%', maxHeight: 400, objectFit: 'contain', cursor: 'pointer' }} onClick={() => {
                      const raw = selectedWithdrawal.proofUrl;
                      const url = raw ? (raw.startsWith('data:') || raw.match(/^https?:\/\//i) ? raw : (raw.startsWith('/') ? API_HOST + raw : API_HOST + '/' + raw)) : undefined;
                      if (url) window.open(url, '_blank');
                    }} />
                </Box>
              ) : (selectedWithdrawal.attachments && selectedWithdrawal.attachments.length && selectedWithdrawal.attachments[0].url ? (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Proof</Typography>
                  <img src={(() => {
                      const raw = selectedWithdrawal.attachments && selectedWithdrawal.attachments.length ? selectedWithdrawal.attachments[0].url : undefined;
                      if (!raw) return undefined;
                      if (raw.startsWith('data:') || raw.match(/^https?:\/\//i)) return raw;
                      if (raw.startsWith('/')) return API_HOST + raw;
                      return API_HOST + '/' + raw;
                    })()} alt={selectedWithdrawal.attachments[0].name || 'proof'} style={{ width: '100%', maxHeight: 400, objectFit: 'contain', cursor: 'pointer' }} onClick={() => { const raw = selectedWithdrawal.attachments && selectedWithdrawal.attachments.length ? selectedWithdrawal.attachments[0].url : undefined; const url = raw ? (raw.startsWith('data:') || raw.match(/^https?:\/\//i) ? raw : (raw.startsWith('/') ? API_HOST + raw : API_HOST + '/' + raw)) : undefined; if (url) window.open(url, '_blank'); }} />
                </Box>
              ) : null)}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setConfirmOpen(false); setSelectedWithdrawal(null); setSelectedApproveId(null); }}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={() => {
            if (selectedApproveId) handleApprove(selectedApproveId);
            setConfirmOpen(false);
            setSelectedWithdrawal(null);
            setSelectedApproveId(null);
          }}>Approve</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminWithdrawals;
