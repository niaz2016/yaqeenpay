import React, { useState } from 'react';
import { Box, Stack, Stepper, Step, StepLabel, TextField, Button, Typography, Divider, Alert } from '@mui/material';
import type { CreateOrderPayload, OrderItem } from '../../types/order';
import RoleSelector, { type UserRole } from './RoleSelector';
import WalletValidator from './WalletValidator';
import ImageUpload from '../common/ImageUpload';

interface Props {
  submitting?: boolean;
  onSubmit: (payload: CreateOrderPayload | any) => void | Promise<void>;
  initialStep?: number;
  initialRole?: UserRole;
  initialItems?: OrderItem[];
  initialAmount?: number;
  initialCurrency?: string;
  initialDescription?: string;
}

const steps = ['Role', 'Target User', 'Details', 'Wallet', 'Confirm'];

const OrderCreateStepper: React.FC<Props> = ({ 
  submitting, 
  onSubmit, 
  initialStep = 0,
  initialRole = 'buyer',
  initialItems = [],
  initialAmount = 0,
  initialCurrency = 'PKR',
  initialDescription = ''
}) => {
  const [activeStep, setActiveStep] = useState(initialStep);

  // Form state
  const [userRole, setUserRole] = useState<UserRole>(initialRole);
  const [targetUserMobile, setTargetUserMobile] = useState<string>(
    // For cart orders, buyer is creating order, so target should be themselves initially
    // (This will be updated based on the actual flow logic)
    initialStep > 0 ? '' : ''
  ); // Mobile number of target user
  const [amount, setAmount] = useState<number>(initialAmount);
  const [currency, setCurrency] = useState(initialCurrency);
  const [description, setDescription] = useState(initialDescription);
  const [items, setItems] = useState<OrderItem[]>(initialItems);
  const [walletValid, setWalletValid] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // const [walletBalance, setWalletBalance] = useState(0); // Currently unused but may be needed for future features

  // Simple seller selection; in real app fetch from API
  // const sellerOptions = [
  //   { id: 'seller-1', label: 'Acme Supplies' },
  //   { id: 'seller-2', label: 'Contoso Traders' },
  //   { id: 'seller-3', label: 'Northwind Export' },
  // ];

  const addItem = () => setItems([...items, { name: '', quantity: 1, unitPrice: 0, images: [] }]);
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
    if (activeStep === 1) return !!targetUserMobile.trim();
    if (activeStep === 2) {
      // Check if total amount is valid
      if (!(total > 0 && !!currency)) return false;
      
      // Seller: items optional (they may just list a single offering described in description)
      if (userRole === 'seller') {
        return true; // allow proceeding based on amount/currency only
      }
      
      // Buyer flow: Require at least one item
      if (items.length === 0) return false;
      
      // For buyer, require at least one image per item
      if (userRole === 'buyer') {
        return items.every(item => 
          item.name.trim() !== '' && 
          item.quantity > 0 && 
          item.unitPrice > 0 &&
          item.images && 
          item.images.length > 0
        );
      }
      
      return true;
    }
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
    setSubmitError(null);
    try {
      // Debug the current state
      
      // Collect all images from items first (common for both buyer and seller)
      const allImages: File[] = [];
      
      items.forEach((item) => {
        
        if (item.images) {
          allImages.push(...item.images);
        }
      });
      
      if (userRole === 'seller') {
        // SELLER creates order for BUYER
        // Seller is creating a product listing that the buyer (targetUserMobile) can purchase
        // No immediate payment - this is just a listing
        
        // Ensure description is not empty to satisfy backend validator
        const effectiveDescription = description.trim().length > 0
          ? description
          : `Product listing for ${items.length > 0 ? items.map(i => i.name || 'item').join(', ') : 'unspecified product'} (created ${new Date().toLocaleDateString()})`;
        
        const sellerRequestData = {
          isSellerRequest: true,
          title: (description.split('\n')[0].trim() || (items[0]?.name) || 'Product Listing'),
          description: effectiveDescription,
          amount: Number(total.toFixed(2)),
          currency,
          images: allImages,
          targetUserMobile: targetUserMobile.trim(), // This is the buyer who will be able to purchase
          creatorRole: 'seller'
        };
        await onSubmit(sellerRequestData);
        return;
      }

      if (userRole === 'buyer') {
        // BUYER creates order for SELLER 
        // Buyer wants to purchase from seller (targetUserMobile)
        // Buyer's funds should be escrowed immediately
        
        const buyerOrderData = {
          title: description.split('\n')[0] || 'Purchase Request',
          description,
          amount: Number(total.toFixed(2)),
          currency,
          targetUserMobile: targetUserMobile.trim(), // This is the seller
          images: allImages,
          creatorRole: 'buyer'
        };
        await onSubmit(buyerOrderData);
        return;
      }
    } catch (e:any) {
      console.error('Order creation failed:', e);
      setSubmitError(e.message || 'Failed to create');
    }
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
          <Typography variant="h6" gutterBottom>
            Enter Target User Mobile Number
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {userRole === 'buyer' 
              ? 'Enter the mobile number of the seller you want to create this order for.'
              : 'Enter the mobile number of the buyer you want to create this order for.'
            }
          </Typography>
          <TextField
            label={`${userRole === 'buyer' ? 'Seller' : 'Buyer'} Mobile Number`}
            value={targetUserMobile}
            onChange={(e) => setTargetUserMobile(e.target.value)}
            placeholder="+92XXXXXXXXXX or 03XXXXXXXXX"
            fullWidth
            required
            helperText="Enter the mobile number of the user this order is intended for"
          />
        </Stack>
      )}

      {activeStep === 2 && (
        <Stack gap={2}>
          <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} multiline minRows={2} />
          <Stack direction={{ xs: 'column', md: 'row' }} gap={2}>
            <TextField type="number" label="Amount (optional)" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} />
            <TextField label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} sx={{ maxWidth: 160 }} />
          </Stack>

          <Divider>Product Items *</Divider>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {userRole === 'seller' 
              ? 'Add your products that buyers can purchase. Images are optional but recommended.'
              : 'Add at least one product item with images to proceed. Each item must have at least one product image.'
            }
          </Typography>
          <Stack gap={2}>
            {items.map((it, idx) => (
              <Box key={idx} sx={{ border: '1px solid #e0e0e0', borderRadius: 2, p: 2 }}>
                <Stack gap={2}>
                  <Stack direction={{ xs: 'column', md: 'row' }} gap={2} alignItems="center">
                    <TextField 
                      label="Name" 
                      value={it.name} 
                      onChange={(e) => updateItem(idx, { name: e.target.value })} 
                      sx={{ flex: 1 }} 
                    />
                    <TextField 
                      type="number" 
                      label="Qty" 
                      value={it.quantity} 
                      onChange={(e) => updateItem(idx, { quantity: parseInt(e.target.value) || 0 })} 
                      sx={{ maxWidth: 120 }} 
                    />
                    <TextField 
                      type="number" 
                      label="Unit Price" 
                      value={it.unitPrice} 
                      onChange={(e) => updateItem(idx, { unitPrice: parseFloat(e.target.value) || 0 })} 
                      sx={{ maxWidth: 180 }} 
                    />
                    <Button color="error" onClick={() => removeItem(idx)}>Remove</Button>
                  </Stack>
                  
                  <ImageUpload
                    images={it.images || []}
                    onImagesChange={(images) => updateItem(idx, { images })}
                    maxImages={3}
                    required={userRole === 'buyer'}
                    disabled={submitting}
                  />
                </Stack>
              </Box>
            ))}
            {items.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 3, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  No product items added yet. Click "Add Item" to get started.
                </Typography>
              </Box>
            )}
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
          <Typography variant="h6">
            {userRole === 'seller' ? 'Product Listing Summary' : 'Order Summary'}
          </Typography>
          <Typography>Role: {userRole === 'buyer' ? 'Buyer' : 'Seller'}</Typography>
          <Typography>
            Target User Mobile: {targetUserMobile || '-'}
          </Typography>
          {userRole === 'seller' && (
            <Typography color="info.main">
              Creating product listing for buyer with mobile: {targetUserMobile}
            </Typography>
          )}
          {userRole === 'buyer' && (
            <Typography color="info.main">
              Creating order for seller with mobile: {targetUserMobile}
            </Typography>
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
                <Box key={i} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    {it.name} x {it.quantity} = {(it.quantity * it.unitPrice).toFixed(2)} {currency}
                  </Typography>
                  {it.images && it.images.length > 0 && (
                    <Stack direction="row" gap={1} mt={1} flexWrap="wrap">
                      {it.images.map((image, imgIdx) => (
                        <Box
                          key={imgIdx}
                          component="img"
                          src={URL.createObjectURL(image)}
                          alt={`${it.name} image ${imgIdx + 1}`}
                          sx={{
                            width: 60,
                            height: 60,
                            objectFit: 'cover',
                            borderRadius: 1,
                            border: '1px solid #ddd',
                          }}
                        />
                      ))}
                    </Stack>
                  )}
                </Box>
              ))}
            </>
          )}
        </Stack>
      )}

      {submitError && <Alert severity="error" sx={{ mt:2 }}>{submitError}</Alert>}

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
            {userRole === 'buyer' ? 'Create Order' : 'Create Order Request'}
          </Button>
        )}
      </Stack>
    </Box>
  );
};

export default OrderCreateStepper;
