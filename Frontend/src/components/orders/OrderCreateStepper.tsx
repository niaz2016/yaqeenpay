import React, { useState } from 'react';
import { Box, Stack, Stepper, Step, StepLabel, TextField, Button, Typography, Divider } from '@mui/material';
import type { CreateOrderPayload, OrderItem } from '../../types/order';
import RoleSelector, { type UserRole } from './RoleSelector';
import SellerBrowser, { type SellerInfo } from './SellerBrowser';
import WalletValidator from './WalletValidator';

interface Props {
  submitting?: boolean;
  onSubmit: (payload: CreateOrderPayload) => void | Promise<void>;
}

const steps = ['Role', 'Seller', 'Details', 'Wallet', 'Confirm'];

const OrderCreateStepper: React.FC<Props> = ({ submitting, onSubmit }) => {
  const [activeStep, setActiveStep] = useState(0);

  // Form state
  const [userRole, setUserRole] = useState<UserRole>('buyer');
  const [selectedSeller, setSelectedSeller] = useState<SellerInfo | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [currency, setCurrency] = useState('PKR');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [walletValid, setWalletValid] = useState(false);
  // const [walletBalance, setWalletBalance] = useState(0); // Currently unused but may be needed for future features

  // Simple seller selection; in real app fetch from API
  // const sellerOptions = [
  //   { id: 'seller-1', label: 'Acme Supplies' },
  //   { id: 'seller-2', label: 'Contoso Traders' },
  //   { id: 'seller-3', label: 'Northwind Export' },
  // ];

  const addItem = () => setItems([...items, { name: '', quantity: 1, unitPrice: 0 }]);
  const updateItem = (idx: number, patch: Partial<OrderItem>) => {
    const next = [...items];
    next[idx] = { ...next[idx], ...patch };
    setItems(next);
  };
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const totalFromItems = items.reduce((sum, it) => sum + (it.quantity || 0) * (it.unitPrice || 0), 0);
  const total = amount > 0 ? amount : totalFromItems;

  const canNext = () => {
    if (activeStep === 0) return !!userRole;
    if (activeStep === 1) return userRole === 'seller' || !!selectedSeller;
    if (activeStep === 2) return total > 0 && !!currency;
    if (activeStep === 3) return userRole === 'seller' || walletValid;
    return true;
  };

  const handleNext = () => setActiveStep((s) => Math.min(s + 1, steps.length - 1));
  const handleBack = () => setActiveStep((s) => Math.max(s - 1, 0));

  const handleWalletValidation = (isValid: boolean, _balance: number) => {
    setWalletValid(isValid);
    // Store balance if needed for future features: setWalletBalance(balance);
  };

  const handleFinish = async () => {
    if (userRole === 'seller') {
      // TODO: Handle seller creating a request for buyers
      alert('Seller order creation not yet implemented');
      return;
    }

    const payload: CreateOrderPayload = {
      sellerId: selectedSeller?.id || '',
      amount: Number(total.toFixed(2)),
      currency,
      description,
      items: items.length ? items : undefined,
    };
    await onSubmit(payload);
  };

  return (
    <Box>
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
        {steps.map(label => (
          <Step key={label}><StepLabel>{label}</StepLabel></Step>
        ))}
      </Stepper>

      {activeStep === 0 && (
        <RoleSelector
          role={userRole}
          onRoleChange={setUserRole}
          disabled={submitting}
        />
      )}

      {activeStep === 1 && (
        <Stack gap={2}>
          {userRole === 'buyer' ? (
            <SellerBrowser
              onSellerSelect={setSelectedSeller}
              selectedSeller={selectedSeller || undefined}
            />
          ) : (
            <Box>
              <Typography variant="h6" gutterBottom>
                Seller Mode: Create Order Request
              </Typography>
              <Typography variant="body2" color="text.secondary">
                As a seller, you'll create an order request that buyers can fulfill.
                Buyers will see your request and can choose to create orders with you.
              </Typography>
            </Box>
          )}
        </Stack>
      )}

      {activeStep === 2 && (
        <Stack gap={2}>
          <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} multiline minRows={2} />
          <Stack direction={{ xs: 'column', md: 'row' }} gap={2}>
            <TextField type="number" label="Amount (optional)" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} />
            <TextField label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} sx={{ maxWidth: 160 }} />
          </Stack>

          <Divider>Items (optional)</Divider>
          <Stack gap={2}>
            {items.map((it, idx) => (
              <Stack key={idx} direction={{ xs: 'column', md: 'row' }} gap={2} alignItems="center">
                <TextField label="Name" value={it.name} onChange={(e) => updateItem(idx, { name: e.target.value })} sx={{ flex: 1 }} />
                <TextField type="number" label="Qty" value={it.quantity} onChange={(e) => updateItem(idx, { quantity: parseInt(e.target.value) || 0 })} sx={{ maxWidth: 120 }} />
                <TextField type="number" label="Unit Price" value={it.unitPrice} onChange={(e) => updateItem(idx, { unitPrice: parseFloat(e.target.value) || 0 })} sx={{ maxWidth: 180 }} />
                <Button color="error" onClick={() => removeItem(idx)}>Remove</Button>
              </Stack>
            ))}
            <Button onClick={addItem}>Add Item</Button>
            <Typography variant="subtitle1">Calculated total: {totalFromItems.toFixed(2)} {currency}</Typography>
          </Stack>
        </Stack>
      )}

      {activeStep === 3 && (
        <Stack gap={2}>
          {userRole === 'buyer' ? (
            <WalletValidator
              orderAmount={total}
              currency={currency}
              onValidationComplete={handleWalletValidation}
              disabled={submitting}
            />
          ) : (
            <Box>
              <Typography variant="h6" gutterBottom>
                Seller Mode: No Wallet Check Required
              </Typography>
              <Typography variant="body2" color="text.secondary">
                As a seller, you don't need to pre-fund orders. 
                Payments will be released to your wallet once buyers confirm receipt.
              </Typography>
            </Box>
          )}
        </Stack>
      )}

      {activeStep === 4 && (
        <Stack gap={2}>
          <Typography variant="h6">Order Summary</Typography>
          <Typography>Role: {userRole === 'buyer' ? 'Buyer' : 'Seller'}</Typography>
          {userRole === 'buyer' && selectedSeller && (
            <Typography>Seller: {selectedSeller.businessName}</Typography>
          )}
          <Typography>Description: {description || '-'}</Typography>
          <Typography>Total: {total.toFixed(2)} {currency}</Typography>
          {userRole === 'buyer' && (
            <Typography color={walletValid ? 'success.main' : 'error.main'}>
              Wallet Status: {walletValid ? 'Sufficient funds ✓' : 'Insufficient funds ✗'}
            </Typography>
          )}
          {!!items.length && (
            <>
              <Divider>Items</Divider>
              {items.map((it, i) => (
                <Typography key={i}>{it.name} x {it.quantity} = {(it.quantity * it.unitPrice).toFixed(2)} {currency}</Typography>
              ))}
            </>
          )}
        </Stack>
      )}

      <Stack direction="row" justifyContent="space-between" mt={3}>
        <Button onClick={handleBack} disabled={activeStep === 0 || submitting}>Back</Button>
        {activeStep < steps.length - 1 ? (
          <Button variant="contained" onClick={handleNext} disabled={!canNext() || submitting}>Next</Button>
        ) : (
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleFinish} 
            disabled={submitting || (userRole === 'buyer' && !walletValid)}
          >
            {userRole === 'buyer' ? 'Create Order & Freeze Funds' : 'Create Order Request'}
          </Button>
        )}
      </Stack>
    </Box>
  );
};

export default OrderCreateStepper;
