// src/components/seller/WithdrawalRequestForm.tsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Chip
} from '@mui/material';
import { AccountBalance, CreditCard } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { selectedUserService } from '../../services/userServiceSelector';
import { useAuth } from '../../context/AuthContext';
import notificationService from '../../services/notificationService';

const withdrawalSchema = z.object({
  amount: z.number().min(10, 'Minimum withdrawal amount is $10').max(10000, 'Maximum withdrawal amount is $10,000'),
  method: z.enum(['bank_transfer', 'paypal', 'stripe']),
  accountDetails: z.string().min(1, 'Account details are required'),
  notes: z.string().optional()
});

type WithdrawalFormData = z.infer<typeof withdrawalSchema>;

interface WithdrawalRequestFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  availableBalance: number; // total wallet balance
  currentlyFrozen?: number; // amount that must remain (cannot be withdrawn)
}

const WithdrawalRequestForm: React.FC<WithdrawalRequestFormProps> = ({
  open,
  onClose,
  onSuccess,
  availableBalance,
  currentlyFrozen = 0,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm<WithdrawalFormData>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: 0,
      method: 'bank_transfer',
      accountDetails: '',
      notes: ''
    }
  });

  const selectedMethod = watch('method');
  const selectedAmount = watch('amount');

  const handleClose = () => {
    reset();
    setError(null);
    onClose();
  };

  const onSubmit = async (data: WithdrawalFormData) => {
    setSubmitting(true);
    setError(null);

    try {
      const withdrawalRequest = {
        amount: data.amount,
        currency: 'PKR',
        paymentMethod: data.method,
        notes: data.notes
      };
      await selectedUserService.requestWithdrawal(withdrawalRequest as any);
      
      // Call the notification service to send notifications to backend
      try {
        await notificationService.notifyWithdrawalInitiated(
          user?.id || '',
          data.amount,
          'PKR',
          getMethodLabel(data.method)
        );
      } catch (notifError) {
        console.warn('Failed to send withdrawal notification:', notifError);
        // Don't fail the withdrawal if notification fails
      }
      
      onSuccess();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create withdrawal request');
    } finally {
      setSubmitting(false);
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'bank_transfer':
        return <AccountBalance />;
      case 'paypal':
      case 'stripe':
        return <CreditCard />;
      default:
        return <AccountBalance />;
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'paypal':
        return 'PayPal';
      case 'stripe':
        return 'Stripe';
      default:
        return method;
    }
  };

  const getAccountPlaceholder = (method: string) => {
    switch (method) {
      case 'bank_transfer':
        return 'Account Number (e.g., 1234567890)';
    case 'paypal':
      return 'PayPal Email (e.g., user@example.com)';
      case 'stripe':
        return 'Stripe Account ID';
      default:
        return 'Account details';
    }
  };

  const safeFrozen = Math.max(0, currentlyFrozen);
  const withdrawableBalance = Math.max(0, availableBalance - safeFrozen);
  const processingFee = selectedAmount * 0.025; // 2.5% processing fee
  const netAmount = selectedAmount - processingFee;
  const exceedsWithdrawable = selectedAmount > withdrawableBalance;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccountBalance color="primary" />
          Request Withdrawal
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Available Balance
            </Typography>
            <Typography variant="h5" color="success.main" sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <span>${availableBalance.toLocaleString()}</span>
              {safeFrozen > 0 && (
                <Chip size="small" color="warning" label={`Frozen: $${safeFrozen.toLocaleString()}`} />
              )}
              {safeFrozen > 0 && (
                <Chip size="small" variant="outlined" color="primary" label={`Withdrawable: $${withdrawableBalance.toLocaleString()}`} />
              )}
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Withdrawal Amount"
                  type="number"
                  fullWidth
                  required
                  error={!!errors.amount}
                  helperText={errors.amount?.message || (exceedsWithdrawable ? `Amount exceeds withdrawable balance ($${withdrawableBalance.toLocaleString()})` : undefined)}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              )}
            />

            <Controller
              name="method"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth required>
                  <InputLabel>Withdrawal Method</InputLabel>
                  <Select
                    {...field}
                    label="Withdrawal Method"
                    error={!!errors.method}
                  >
                    <MenuItem value="bank_transfer">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccountBalance fontSize="small" />
                        Bank Transfer
                      </Box>
                    </MenuItem>
                    <MenuItem value="paypal">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CreditCard fontSize="small" />
                        PayPal
                      </Box>
                    </MenuItem>
                    <MenuItem value="stripe">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CreditCard fontSize="small" />
                        Stripe
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              )}
            />

            <Controller
              name="accountDetails"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Account Details"
                  placeholder={getAccountPlaceholder(selectedMethod)}
                  fullWidth
                  required
                  error={!!errors.accountDetails}
                  helperText={errors.accountDetails?.message || `Enter your ${getMethodLabel(selectedMethod)} account details`}
                  multiline={selectedMethod === 'bank_transfer'}
                  rows={selectedMethod === 'bank_transfer' ? 3 : 1}
                />
              )}
            />

            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Notes (Optional)"
                  placeholder="Additional information or instructions"
                  fullWidth
                  multiline
                  rows={2}
                  error={!!errors.notes}
                  helperText={errors.notes?.message}
                />
              )}
            />

            {selectedAmount > 0 && (
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Withdrawal Summary
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Withdrawal Amount:</Typography>
                  <Typography variant="body2">${selectedAmount.toFixed(2)}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Processing Fee (2.5%):</Typography>
                  <Typography variant="body2" color="error.main">
                    -${processingFee.toFixed(2)}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="body1" fontWeight="medium">
                    Net Amount:
                  </Typography>
                  <Typography variant="body1" fontWeight="medium" color="success.main">
                    ${netAmount.toFixed(2)}
                  </Typography>
                </Box>

                <Box sx={{ mt: 2 }}>
                  <Chip
                    icon={getMethodIcon(selectedMethod)}
                    label={`via ${getMethodLabel(selectedMethod)}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting || selectedAmount <= 0 || exceedsWithdrawable}
          >
            {submitting ? 'Processing...' : 'Request Withdrawal'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default WithdrawalRequestForm;