import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Card,
  CardContent,
  CardHeader,
} from '@mui/material';
import {
  Save as SaveIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as BankIcon,
  Wallet as WalletIcon,
  Security as SecurityIcon,
  TrendingUp as LimitIcon,
  Edit as EditIcon,
  CheckCircle as VerifiedIcon,
} from '@mui/icons-material';
import { useSettings } from '../../../context/SettingsContext';
import { SettingsCategory } from '../../../services/settingsService';
import type { PaymentSettings as PaymentSettingsType } from '../../../services/settingsService';

const currencies = [
  { value: 'PKR', label: 'Pakistani Rupee (PKR)', symbol: 'Rs' },
  { value: 'USD', label: 'US Dollar (USD)', symbol: '$' },
  { value: 'EUR', label: 'Euro (EUR)', symbol: '€' },
];

const paymentMethods = [
  { value: 'wallet', label: 'YaqeenPay Wallet', icon: <WalletIcon />, enabled: true },
  { value: 'jazzcash', label: 'JazzCash', icon: <CreditCardIcon />, enabled: true },
  { value: 'easypaisa', label: 'EasyPaisa', icon: <CreditCardIcon />, enabled: true },
  { value: 'bank', label: 'Bank Transfer', icon: <BankIcon />, enabled: false },
  { value: 'card', label: 'Credit/Debit Card', icon: <CreditCardIcon />, enabled: false },
];

const withdrawalMethods = [
  { value: 'bank', label: 'Bank Transfer', minAmount: 500, processingTime: '1-2 business days' },
  { value: 'jazzcash', label: 'JazzCash', minAmount: 100, processingTime: 'Instant' },
  { value: 'easypaisa', label: 'EasyPaisa', minAmount: 100, processingTime: 'Instant' },
];

const PaymentSettings: React.FC = () => {
  const { settings, updateSetting, loading: contextLoading } = useSettings();
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettingsType>({
    defaultPaymentMethod: 'wallet',
    autoPaymentEnabled: false,
    displayCurrency: 'PKR',
    dailyTransactionLimit: 50000,
    monthlyTransactionLimit: 500000,
    preferredWithdrawalMethod: 'bank',
    minimumWithdrawalAmount: 500,
    enableTransactionNotifications: true,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (settings?.payments) {
      setPaymentSettings(settings.payments);
    }
  }, [settings]);

  const handleInputChange = (field: keyof PaymentSettingsType, value: any) => {
    setPaymentSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess(false);

      // Validate limits
      if (paymentSettings.dailyTransactionLimit && paymentSettings.monthlyTransactionLimit) {
        if (paymentSettings.dailyTransactionLimit > paymentSettings.monthlyTransactionLimit) {
          setError('Daily limit cannot exceed monthly limit');
          return;
        }
      }

      const success = await updateSetting(SettingsCategory.Payments, paymentSettings);
      
      if (success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError('Failed to update payment settings');
      }
    } catch (err) {
      setError('An error occurred while saving settings');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = paymentSettings.displayCurrency) => {
    const currencyInfo = currencies.find(c => c.value === currency);
    return `${currencyInfo?.symbol}${amount.toLocaleString()}`;
  };

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.min((used / limit) * 100, 100);
  };

  // Mock current usage data - in real app this would come from API
  const currentUsage = {
    dailyUsed: 12500,
    monthlyUsed: 125000,
  };

  if (contextLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Payment settings updated successfully!
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Payment Methods */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Payment Methods
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Configure your preferred payment methods and default options.
        </Typography>

        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth sx={{ maxWidth: { md: '50%' } }}>
            <InputLabel>Default Payment Method</InputLabel>
            <Select
              value={paymentSettings.defaultPaymentMethod}
              label="Default Payment Method"
              onChange={(e) => handleInputChange('defaultPaymentMethod', e.target.value)}
            >
              {paymentMethods.filter(method => method.enabled).map((method) => (
                <MenuItem key={method.value} value={method.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {method.icon}
                    {method.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <List>
          {paymentMethods.map((method) => (
            <ListItem key={method.value} divider>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {method.icon}
                    <Typography>{method.label}</Typography>
                    {method.enabled && <VerifiedIcon color="success" fontSize="small" />}
                    {!method.enabled && <Chip label="Coming Soon" size="small" color="default" />}
                  </Box>
                }
                secondary={method.enabled ? "Available for transactions" : "Not yet available"}
              />
              <ListItemSecondaryAction>
                {method.enabled && (
                  <IconButton edge="end" disabled>
                    <EditIcon />
                  </IconButton>
                )}
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>

        <FormControlLabel
          control={
            <Switch
              checked={paymentSettings.autoPaymentEnabled}
              onChange={(e) => handleInputChange('autoPaymentEnabled', e.target.checked)}
            />
          }
          label="Enable automatic payments for recurring transactions"
          sx={{ mt: 2 }}
        />
      </Paper>

      {/* Currency & Display */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Currency & Display
        </Typography>
        
        <Box sx={{ maxWidth: { md: '50%' } }}>
          <FormControl fullWidth>
            <InputLabel>Display Currency</InputLabel>
            <Select
              value={paymentSettings.displayCurrency}
              label="Display Currency"
              onChange={(e) => handleInputChange('displayCurrency', e.target.value)}
            >
              {currencies.map((currency) => (
                <MenuItem key={currency.value} value={currency.value}>
                  {currency.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Transaction Limits */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <LimitIcon />
          <Typography variant="h6">
            Transaction Limits
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Manage your daily and monthly transaction limits for security.
        </Typography>

        {/* Current Usage Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
          <Card variant="outlined">
            <CardHeader
              title="Daily Limit"
              subheader={`${formatCurrency(currentUsage.dailyUsed)} of ${formatCurrency(paymentSettings.dailyTransactionLimit || 0)} used`}
            />
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Box
                  sx={{
                    flex: 1,
                    height: 8,
                    backgroundColor: 'grey.300',
                    borderRadius: 4,
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      width: `${getUsagePercentage(currentUsage.dailyUsed, paymentSettings.dailyTransactionLimit || 1)}%`,
                      height: '100%',
                      backgroundColor: 'primary.main',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </Box>
                <Typography variant="caption">
                  {getUsagePercentage(currentUsage.dailyUsed, paymentSettings.dailyTransactionLimit || 1).toFixed(0)}%
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardHeader
              title="Monthly Limit"
              subheader={`${formatCurrency(currentUsage.monthlyUsed)} of ${formatCurrency(paymentSettings.monthlyTransactionLimit || 0)} used`}
            />
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Box
                  sx={{
                    flex: 1,
                    height: 8,
                    backgroundColor: 'grey.300',
                    borderRadius: 4,
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      width: `${getUsagePercentage(currentUsage.monthlyUsed, paymentSettings.monthlyTransactionLimit || 1)}%`,
                      height: '100%',
                      backgroundColor: 'secondary.main',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </Box>
                <Typography variant="caption">
                  {getUsagePercentage(currentUsage.monthlyUsed, paymentSettings.monthlyTransactionLimit || 1).toFixed(0)}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Limit Configuration */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
          <TextField
            label="Daily Transaction Limit"
            type="number"
            value={paymentSettings.dailyTransactionLimit || ''}
            onChange={(e) => handleInputChange('dailyTransactionLimit', parseFloat(e.target.value) || 0)}
            InputProps={{
              startAdornment: <InputAdornment position="start">{currencies.find(c => c.value === paymentSettings.displayCurrency)?.symbol}</InputAdornment>,
            }}
            fullWidth
          />
          
          <TextField
            label="Monthly Transaction Limit"
            type="number"
            value={paymentSettings.monthlyTransactionLimit || ''}
            onChange={(e) => handleInputChange('monthlyTransactionLimit', parseFloat(e.target.value) || 0)}
            InputProps={{
              startAdornment: <InputAdornment position="start">{currencies.find(c => c.value === paymentSettings.displayCurrency)?.symbol}</InputAdornment>,
            }}
            fullWidth
          />
        </Box>
      </Paper>

      {/* Withdrawal Settings */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Withdrawal Preferences
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Configure your preferred withdrawal method and minimum amounts.
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Preferred Withdrawal Method</InputLabel>
            <Select
              value={paymentSettings.preferredWithdrawalMethod}
              label="Preferred Withdrawal Method"
              onChange={(e) => handleInputChange('preferredWithdrawalMethod', e.target.value)}
            >
              {withdrawalMethods.map((method) => (
                <MenuItem key={method.value} value={method.value}>
                  <Box>
                    <Typography>{method.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Min: {formatCurrency(method.minAmount)} • {method.processingTime}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Minimum Withdrawal Amount"
            type="number"
            value={paymentSettings.minimumWithdrawalAmount}
            onChange={(e) => handleInputChange('minimumWithdrawalAmount', parseFloat(e.target.value))}
            InputProps={{
              startAdornment: <InputAdornment position="start">{currencies.find(c => c.value === paymentSettings.displayCurrency)?.symbol}</InputAdornment>,
            }}
            fullWidth
          />
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            Withdrawal fees may apply based on the method selected. Processing times vary by provider.
          </Typography>
        </Alert>
      </Paper>

      {/* Security & Notifications */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <SecurityIcon />
          <Typography variant="h6">
            Security & Notifications
          </Typography>
        </Box>
        
        <FormControlLabel
          control={
            <Switch
              checked={paymentSettings.enableTransactionNotifications}
              onChange={(e) => handleInputChange('enableTransactionNotifications', e.target.checked)}
            />
          }
          label="Send notifications for all payment transactions"
        />
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 4 }}>
          Receive instant notifications for payments, withdrawals, and transaction status updates.
        </Typography>
      </Paper>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? <CircularProgress size={20} /> : 'Save Changes'}
        </Button>
      </Box>
    </Box>
  );
};

export default PaymentSettings;