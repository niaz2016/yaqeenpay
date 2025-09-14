import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Button, 
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Box,
  Typography,
  Chip
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string, evidenceUrls?: string[]) => void;
}

const reasonTemplates = [
  'Item not as described',
  'Item damaged during shipping',
  'Wrong item received',
  'Item not received',
  'Quality issues',
  'Missing parts/accessories',
  'Seller communication issues',
  'Other (specify below)'
];

const DeliveryDecisionDialog: React.FC<Props> = ({ open, onClose, onSubmit }) => {
  const [reasonTemplate, setReasonTemplate] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [evidenceUrls, setEvidenceUrls] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setReasonTemplate('');
    setCustomReason('');
    setEvidenceUrls('');
    setSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    const finalReason = reasonTemplate === 'Other (specify below)' || !reasonTemplate 
      ? customReason 
      : reasonTemplate;
      
    if (!finalReason.trim()) return;

    setSubmitting(true);
    try {
      const urls = evidenceUrls
        .split(/\s|,|\n/g)
        .map(s => s.trim())
        .filter(Boolean);
      
      await onSubmit(finalReason, urls.length ? urls : undefined);
      reset();
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitting(false);
    }
  };

  const finalReason = reasonTemplate === 'Other (specify below)' || !reasonTemplate 
    ? customReason 
    : reasonTemplate;

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Stack direction="row" alignItems="center" gap={1}>
          <WarningIcon color="warning" />
          <Typography variant="h6">Reject Delivery / Open Dispute</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack gap={3} pt={1}>
          <Alert severity="info">
            By rejecting this delivery, you're opening a dispute that will be reviewed by our team. 
            Please provide clear details about the issue.
          </Alert>

          <FormControl fullWidth>
            <InputLabel>Reason for rejection</InputLabel>
            <Select
              value={reasonTemplate}
              label="Reason for rejection"
              onChange={(e) => setReasonTemplate(e.target.value)}
            >
              {reasonTemplates.map((template) => (
                <MenuItem key={template} value={template}>
                  {template}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {(reasonTemplate === 'Other (specify below)' || !reasonTemplate) && (
            <TextField
              label="Describe the issue"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              multiline
              minRows={3}
              placeholder="Please provide specific details about why you're rejecting this delivery..."
              required
            />
          )}

          {reasonTemplate && reasonTemplate !== 'Other (specify below)' && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Selected reason:
              </Typography>
              <Chip label={reasonTemplate} color="primary" variant="outlined" />
            </Box>
          )}

          <TextField
            label="Evidence URLs (optional)"
            value={evidenceUrls}
            onChange={(e) => setEvidenceUrls(e.target.value)}
            helperText="Provide URLs to images or documents that support your claim (separated by comma, space, or new line)"
            multiline
            minRows={2}
            placeholder="https://example.com/image1.jpg, https://example.com/document.pdf"
          />

          {finalReason.trim() && (
            <Alert severity="warning">
              <Typography variant="body2">
                <strong>Final reason:</strong> {finalReason}
              </Typography>
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button 
          variant="contained" 
          color="error" 
          onClick={handleSubmit} 
          disabled={!finalReason.trim() || submitting}
        >
          {submitting ? 'Submitting...' : 'Submit Rejection'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeliveryDecisionDialog;
