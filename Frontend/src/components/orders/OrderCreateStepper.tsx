import React, { useState } from 'react';
import { Box, Stack, Stepper, Step, StepLabel, TextField, Button, Autocomplete, Typography, Divider } from '@mui/material';
import type { CreateOrderPayload, OrderItem } from '../../types/order';

interface Props {
  submitting?: boolean;
  onSubmit: (payload: CreateOrderPayload) => void | Promise<void>;
}

const steps = ['Seller', 'Details', 'Confirm'];

const OrderCreateStepper: React.FC<Props> = ({ submitting, onSubmit }) => {
  const [activeStep, setActiveStep] = useState(0);

  // Form state
  const [sellerId, setSellerId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [currency, setCurrency] = useState('USD');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);

  // Simple seller selection; in real app fetch from API
  const sellerOptions = [
    { id: 'seller-1', label: 'Acme Supplies' },
    { id: 'seller-2', label: 'Contoso Traders' },
    { id: 'seller-3', label: 'Northwind Export' },
  ];

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
    if (activeStep === 0) return !!sellerId;
    if (activeStep === 1) return total > 0 && !!currency;
    return true;
  };

  const handleNext = () => setActiveStep((s) => Math.min(s + 1, steps.length - 1));
  const handleBack = () => setActiveStep((s) => Math.max(s - 1, 0));

  const handleFinish = async () => {
    const payload: CreateOrderPayload = {
      sellerId,
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
        <Stack gap={2}>
          <Autocomplete
            options={sellerOptions}
            getOptionLabel={(o) => o.label}
            onChange={(_, val) => setSellerId(val?.id || '')}
            renderInput={(params) => <TextField {...params} label="Select Seller" required />} />
        </Stack>
      )}

      {activeStep === 1 && (
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

      {activeStep === 2 && (
        <Stack gap={2}>
          <Typography>Seller: {sellerOptions.find(s => s.id === sellerId)?.label || sellerId}</Typography>
          <Typography>Description: {description || '-'}</Typography>
          <Typography>Total: {total.toFixed(2)} {currency}</Typography>
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
          <Button variant="contained" color="primary" onClick={handleFinish} disabled={submitting}>Create Order</Button>
        )}
      </Stack>
    </Box>
  );
};

export default OrderCreateStepper;
