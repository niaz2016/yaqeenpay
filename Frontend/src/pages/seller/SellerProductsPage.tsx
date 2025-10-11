import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Pagination
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Inventory as PackageIcon,
  Visibility as EyeIcon,
  Clear as ClearIcon
} from '@mui/icons-material';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  discountPrice?: number;
  sku: string;
  stockQuantity: number;
  status: 'Draft' | 'Active' | 'Inactive' | 'OutOfStock' | 'Discontinued';
  category: {
    id: string;
    name: string;
  };
  images: Array<{
    id: string;
    imageUrl: string;
    isPrimary: boolean;
  }>;
  createdAt: string;
  viewCount: number;
  averageRating: number;
  reviewCount: number;
  isOnSale: boolean;
  effectivePrice: number;
}

interface Category {
  id: string;
  name: string;
}

const SellerProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning' => {
    switch (status) {
      case 'Draft': return 'default';
      case 'Active': return 'success';
      case 'Inactive': return 'error';
      case 'OutOfStock': return 'warning';
      case 'Discontinued': return 'error';
      default: return 'default';
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [page, search, selectedCategory, selectedStatus]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        pageSize: '12',
        ...(search && { search }),
        ...(selectedCategory && { categoryId: selectedCategory }),
        ...(selectedStatus && { status: selectedStatus })
      });

      console.log('[SellerProductsPage] Fetching products with URL:', `/api/products/seller?${queryParams}`);
      
      // Check both possible token keys
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      console.log('[SellerProductsPage] Token exists:', !!token);
      console.log('[SellerProductsPage] Token key used:', localStorage.getItem('access_token') ? 'access_token' : 'token');
      console.log('[SellerProductsPage] Token value (first 20 chars):', token?.substring(0, 20));

      const response = await fetch(`/api/products/seller?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('[SellerProductsPage] Response status:', response.status);
      console.log('[SellerProductsPage] Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('[SellerProductsPage] API Response:', data);
        console.log('[SellerProductsPage] Response structure keys:', data ? Object.keys(data) : 'null');
        console.log('[SellerProductsPage] data.data exists:', !!data.data);
        console.log('[SellerProductsPage] data.data structure:', data.data ? Object.keys(data.data) : 'null');
        
        // Check both possible data structures
        let productsArray = [];
        if (data.data?.products) {
          productsArray = data.data.products;
          console.log('[SellerProductsPage] Using data.data.products:', productsArray.length);
        } else if (data.data?.items) {
          productsArray = data.data.items;
          console.log('[SellerProductsPage] Using data.data.items:', productsArray.length);
        } else {
          console.log('[SellerProductsPage] No products or items found in response');
        }
        
        setProducts(productsArray);
        setTotalPages(Math.ceil((data.data?.totalCount || 0) / 12));
        console.log('[SellerProductsPage] Set products array length:', productsArray.length);
      } else {
        const errorText = await response.text();
        console.error('[SellerProductsPage] Failed response:', response.status, errorText);
        setError('Failed to fetch products');
      }
    } catch (error) {
      console.error('[SellerProductsPage] Error fetching products:', error);
      setError('Error fetching products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const response = await fetch(`/api/products/${productToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchProducts();
        setDeleteDialogOpen(false);
        setProductToDelete(null);
      } else {
        setError('Failed to delete product');
      }
    } catch (error) {
      setError('Error deleting product');
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(price);
  };

  const getPrimaryImage = (images: Array<{ imageUrl: string; isPrimary: boolean }>) => {
    const primary = images.find(img => img.isPrimary);
    return primary?.imageUrl || images[0]?.imageUrl || '/api/placeholder/300/200';
  };

  if (loading && products.length === 0) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
            Marketplace Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your product listings and grow your business
          </Typography>
        </Box>
        <Button 
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/seller/products/new')}
        >
          Add Product
        </Button>
      </Box>

      {/* Quick Stats */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" color="primary">
              {products.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Products
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6" color="success.main">
              {products.filter(p => p.status === 'Active').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active Listings
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6" color="warning.main">
              {products.filter(p => p.status === 'OutOfStock').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Out of Stock
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6" color="info.main">
              {categories.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Categories Available
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
            <TextField
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ flex: 1 }}
            />
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                label="Category"
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map(category => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                label="Status"
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="Draft">Draft</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
                <MenuItem value="OutOfStock">Out of Stock</MenuItem>
                <MenuItem value="Discontinued">Discontinued</MenuItem>
              </Select>
            </FormControl>
            <Button 
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={() => {
                setSearch('');
                setSelectedCategory('');
                setSelectedStatus('');
                setPage(1);
              }}
              sx={{ minWidth: 150 }}
            >
              Clear Filters
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Products Grid */}
      {products.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <PackageIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" sx={{ mb: 1 }}>
              {search || selectedCategory || selectedStatus ? "No products found" : "Welcome to your Marketplace!"}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {search || selectedCategory || selectedStatus 
                ? "Try adjusting your filters or search terms." 
                : "Start your selling journey by adding your first product to the marketplace. Reach thousands of customers and grow your business!"}
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => navigate('/seller/products/new')}
            >
              Add Product
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { 
            xs: '1fr', 
            sm: 'repeat(2, 1fr)', 
            md: 'repeat(3, 1fr)' 
          }, 
          gap: 3 
        }}>
          {products.map(product => (
            <Card key={product.id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                component="img"
                height="200"
                image={getPrimaryImage(product.images)}
                alt={product.name}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold', flex: 1 }}>
                    {product.name}
                  </Typography>
                  <Chip
                    label={product.status}
                    color={getStatusColor(product.status)}
                    size="small"
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {product.category.name}
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {product.isOnSale ? (
                      <>
                        <Typography variant="h6" color="success.main" sx={{ fontWeight: 'bold' }}>
                          {formatPrice(product.effectivePrice, product.currency)}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ textDecoration: 'line-through', color: 'text.secondary' }}
                        >
                          {formatPrice(product.price, product.currency)}
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {formatPrice(product.price, product.currency)}
                      </Typography>
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    SKU: {product.sku}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Stock: {product.stockQuantity}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <EyeIcon fontSize="small" />
                    <Typography variant="body2" color="text.secondary">
                      {product.viewCount}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/seller/products/${product.id}`)}
                    color="primary"
                  >
                    <EyeIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/seller/products/${product.id}/edit`)}
                    color="info"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setProductToDelete(product.id);
                      setDeleteDialogOpen(true);
                    }}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
            size="large"
          />
        </Box>
      )}

      {/* Delete Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Product</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this product? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleDeleteProduct} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SellerProductsPage;