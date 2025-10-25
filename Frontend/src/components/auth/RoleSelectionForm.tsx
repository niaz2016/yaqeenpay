// src/components/auth/RoleSelectionForm.tsx
import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Stack,
  Paper,
  Button
} from '@mui/material';
import {
  ShoppingCart,
  Store,
  ArrowBack
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import type { UserRole } from '../../types/roles';

interface RoleSelectionFormProps {
  onRoleSelect: (role: UserRole) => void;
  onBack?: () => void;
}

const RoleSelectionForm: React.FC<RoleSelectionFormProps> = ({ 
  onRoleSelect, 
  onBack 
}) => {
  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Join YaqeenPay
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Choose how you want to use our platform
        </Typography>
      </Box>

      <Stack 
        spacing={3} 
        direction={{ xs: 'column', md: 'row' }}
        sx={{ mb: 4 }}
      >
        <Box sx={{ flex: 1 }}>
          <Card 
            sx={{ 
              height: '100%',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4
              }
            }}
          >
            <CardActionArea 
              onClick={() => onRoleSelect('buyer')}
              sx={{ height: '100%', p: 3 }}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <ShoppingCart 
                  sx={{ 
                    fontSize: 64, 
                    color: 'primary.main', 
                    mb: 2 
                  }} 
                />
                <Typography variant="h5" component="h2" gutterBottom>
                  I'm a Buyer
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Purchase products and services with secure escrow protection
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    ✓ Browse and purchase products
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    ✓ Secure escrow payments
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    ✓ Dispute resolution support
                  </Typography>
                  <Typography variant="body2">
                    ✓ Order tracking and management
                  </Typography>
                </Box>
              </CardContent>
            </CardActionArea>
          </Card>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Card 
            sx={{ 
              height: '100%',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4
              }
            }}
          >
            <CardActionArea 
              onClick={() => onRoleSelect('seller')}
              sx={{ height: '100%', p: 3 }}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <Store 
                  sx={{ 
                    fontSize: 64, 
                    color: 'success.main', 
                    mb: 2 
                  }} 
                />
                <Typography variant="h5" component="h2" gutterBottom>
                  I'm a Seller
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Sell your products and services with trusted payment processing
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    ✓ List and sell products
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    ✓ Secure payment processing
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    ✓ Analytics and reporting
                  </Typography>
                  <Typography variant="body2">
                    ✓ Withdrawal management
                  </Typography>
                </Box>
              </CardContent>
            </CardActionArea>
          </Card>
        </Box>
      </Stack>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Already have an account?{' '}
          <Button 
            component={Link}
            to="/auth/login" 
            variant="text" 
            size="small"
          >
            Sign In
          </Button>
        </Typography>
        
        {onBack && (
          <Button
            startIcon={<ArrowBack />}
            onClick={onBack}
            variant="outlined"
            sx={{ mt: 1 }}
          >
            Back
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default RoleSelectionForm;