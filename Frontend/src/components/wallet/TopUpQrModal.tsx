import React, { useRef, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, TextField, IconButton, Alert } from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import CloseIcon from '@mui/icons-material/Close';
import Compress from 'browser-image-compression';
const payQr = '/pay-qr.jpg';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { amount: number; file: File; notes: string }) => Promise<void> | void;
  submitting?: boolean;
}

const TopUpQrModal: React.FC<Props> = ({ open, onClose, onSubmit, submitting }) => {
  const [amount, setAmount] = useState<number | ''>('');
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const compressed = await Compress(f, { maxSizeMB: 0.5, maxWidthOrHeight: 1024, useWebWorker: true });
      setFile(compressed as File);
      setError(null);
    } catch (err) {
      setError('Image compression failed');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!file) {
      setError('Please upload proof of payment');
      return;
    }
    setError(null);
    onSubmit({ amount: Number(amount), file, notes });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        Scan QR to Top Up
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <img src={payQr} alt="Pay QR" style={{ width: 220, borderRadius: 8 }} />
          <Typography variant="body2" color="textSecondary">Scan this QR code with your Easypaisa app to pay.</Typography>
          <TextField
            label="Amount"
            type="number"
            inputProps={{ min: 1, step: '0.01' }}
            value={amount}
            onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
            fullWidth
            required
            sx={{ mb: 1 }}
          />
          <Button variant="outlined" startIcon={<ImageIcon />} onClick={() => fileInputRef.current?.click()}>
            {file ? 'Change Proof Image' : 'Upload Proof of Payment'}
          </Button>
          <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleFileChange} />
          {file && <Typography variant="caption" color="success.main">Image ready for upload</Typography>}
          <TextField label="Notes (optional)" fullWidth value={notes} onChange={e => setNotes(e.target.value)} multiline minRows={2} />
          {error && <Alert severity="error">{error}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={!!submitting}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!!submitting}>Submit Proof</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TopUpQrModal;
