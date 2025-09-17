// src/components/orders/SellerBrowser.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Avatar,
  Chip,
  Rating,
  InputAdornment,
  CircularProgress,
  Alert,
  Stack
} from '@mui/material';
import { Search, Store, CheckCircle } from '@mui/icons-material';

export interface SellerInfo {
  id: string;
  businessName: string;
  businessType: string;
  businessCategory: string;
  description: string;
  city: string;
  state: string;
  rating: number;
  totalOrders: number;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  avatarUrl?: string;
}

interface Props {
  onSellerSelect: (seller: SellerInfo) => void;
  selectedSeller?: SellerInfo;
}

// Mock data - replace with API call
const mockSellers: SellerInfo[] = [
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    businessName: 'TechHub Electronics',
    businessType: 'Electronics',
    businessCategory: 'Consumer Electronics',
    description: 'Premium electronics and gadgets with warranty',
    city: 'Karachi',
    state: 'Sindh',
    rating: 4.8,
    totalOrders: 1250,
    verificationStatus: 'verified'
  },
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d480',
    businessName: 'Fashion Forward',
    businessType: 'Retail',
    businessCategory: 'Clothing & Fashion',
    description: 'Latest fashion trends and custom tailoring',
    city: 'Lahore',
    state: 'Punjab',
    rating: 4.6,
    totalOrders: 890,
    verificationStatus: 'verified'
  },
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d481',
    businessName: 'BookWorm Paradise',
    businessType: 'Books',
    businessCategory: 'Education & Books',
    description: 'Academic and recreational books, new and used',
    city: 'Islamabad',
    state: 'ICT',
    rating: 4.9,
    totalOrders: 650,
    verificationStatus: 'verified'
  },
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d482',
    businessName: 'Home & Garden Co',
    businessType: 'Home Goods',
    businessCategory: 'Home & Garden',
    description: 'Everything for your home and garden needs',
    city: 'Faisalabad',
    state: 'Punjab',
    rating: 4.4,
    totalOrders: 420,
    verificationStatus: 'verified'
  }
];

const SellerBrowser: React.FC<Props> = ({ onSellerSelect, selectedSeller }) => {
  const [sellers, setSellers] = useState<SellerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSellers, setFilteredSellers] = useState<SellerInfo[]>([]);

  useEffect(() => {
    // Simulate API call
    const loadSellers = async () => {
      setLoading(true);
      // In real implementation, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSellers(mockSellers);
      setFilteredSellers(mockSellers);
      setLoading(false);
    };

    loadSellers();
  }, []);

  useEffect(() => {
    // Filter sellers based on search term
    const filtered = sellers.filter(seller =>
      seller.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seller.businessCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seller.city.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSellers(filtered);
  }, [searchTerm, sellers]);

  const getVerificationColor = (status: string) => {
    switch (status) {
      case 'verified': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getVerificationText = (status: string) => {
    switch (status) {
      case 'verified': return 'Verified';
      case 'pending': return 'Pending';
      case 'rejected': return 'Rejected';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Store />
        Select a Seller
      </Typography>

      <TextField
        fullWidth
        placeholder="Search sellers by name, category, or city..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 3 }}
      />

      {filteredSellers.length === 0 ? (
        <Alert severity="info">
          No sellers found matching your search criteria.
        </Alert>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
          {filteredSellers.map((seller) => (
            <Box key={seller.id}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  border: selectedSeller?.id === seller.id ? 2 : 1,
                  borderColor: selectedSeller?.id === seller.id ? 'primary.main' : 'divider',
                  '&:hover': {
                    boxShadow: 2,
                    borderColor: 'primary.light'
                  }
                }}
                onClick={() => onSellerSelect(seller)}
              >
                <CardContent>
                  <Stack spacing={1}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <Store />
                      </Avatar>
                      <Box flex={1}>
                        <Typography variant="h6" component="div">
                          {seller.businessName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {seller.businessCategory}
                        </Typography>
                      </Box>
                      <Chip
                        icon={<CheckCircle />}
                        label={getVerificationText(seller.verificationStatus)}
                        color={getVerificationColor(seller.verificationStatus) as any}
                        size="small"
                      />
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ minHeight: 40 }}>
                      {seller.description}
                    </Typography>

                    <Box display="flex" alignItems="center" gap={2}>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Rating value={seller.rating} precision={0.1} size="small" readOnly />
                        <Typography variant="body2">
                          {seller.rating}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {seller.totalOrders} orders
                      </Typography>
                    </Box>

                    <Typography variant="body2" color="text.secondary">
                      📍 {seller.city}, {seller.state}
                    </Typography>

                    {selectedSeller?.id === seller.id && (
                      <Alert severity="success" sx={{ mt: 1 }}>
                        Selected seller: {seller.businessName}
                      </Alert>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default SellerBrowser;