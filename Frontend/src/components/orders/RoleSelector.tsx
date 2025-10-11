// src/components/orders/RoleSelector.tsx
import React from 'react';
import { Box, Typography, ToggleButton, ToggleButtonGroup, Paper } from '@mui/material';
import { Store, AccountBalance, ShoppingCart } from '@mui/icons-material';

export type UserRole = 'buyer' | 'seller';

interface Props {
  role: UserRole;
  onRoleChange: (role: UserRole) => void;
  disabled?: boolean;
}

const RoleSelector: React.FC<Props> = ({ role, onRoleChange, disabled = false }) => {
  const handleRoleChange = (_: React.MouseEvent<HTMLElement>, newRole: UserRole | null) => {
    if (newRole !== null) {
      onRoleChange(newRole);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AccountBalance />
        I am acting as:
      </Typography>
      
      <ToggleButtonGroup
        value={role}
        exclusive
        onChange={handleRoleChange}
        aria-label="user role"
        disabled={disabled}
        sx={{ width: '100%', mt: 2 }}
      >
        <ToggleButton 
          value="buyer" 
          sx={{ 
            flex: 1, 
            flexDirection: 'column', 
            gap: 1, 
            py: 2,
            '&.Mui-selected': {
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': {
                bgcolor: 'primary.dark',
              }
            }
          }}
        >
          <ShoppingCart />
          <Typography variant="body1" fontWeight="bold">
            Buyer
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            I want to create a purchase order from a seller
          </Typography>
        </ToggleButton>

        <ToggleButton 
          value="seller" 
          sx={{ 
            flex: 1, 
            flexDirection: 'column', 
            gap: 1, 
            py: 2,
            '&.Mui-selected': {
              bgcolor: 'success.main',
              color: 'white',
              '&:hover': {
                bgcolor: 'success.dark',
              }
            }
          }}
        >
          <Store />
          <Typography variant="body1" fontWeight="bold">
            Seller
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            I want to create a product listing for a buyer
          </Typography>
        </ToggleButton>
      </ToggleButtonGroup>

      {role && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {role === 'buyer' 
              ? '🛒 As a buyer, you create purchase orders from sellers. Enter the seller\'s mobile number and your payment will be held in escrow until you confirm receipt.'
              : '🏪 As a seller, you create product listings for buyers. Enter the buyer\'s mobile number to create a listing they can purchase.'
            }
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default RoleSelector;