import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  IconButton,
  Chip,
  Divider
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import productService from '../../services/productService';
import categoryService, { type Category } from '../../services/categoryService';

// Category interface is now imported from categoryService

interface ProductImage {
  imageUrl: string;
  altText?: string;
  isPrimary: boolean;
  sortOrder: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  discountPrice?: number;
  sku: string;
  stockQuantity: number;
  status: string; // Changed to accept any string status from API
  categoryId: string;
  category: {
    id: string;
    name: string;
  };
  images: ProductImage[];
  attributes: Record<string, string>; // Changed to match ProductResponse
}

interface EditProductFormData {
  name: string;
  description: string;
  price: string;
  discountPrice: string;
  stockQuantity: string;
  categoryId: string;
  status: 'Draft' | 'Active' | 'Inactive';
  currency: string;
}

const EditProductPage: React.FC = () => {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  
  // State for product data
  const [product, setProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<EditProductFormData>({
    name: '',
    description: '',
    price: '',
    discountPrice: '',
    stockQuantity: '',
    categoryId: '',
    status: 'Draft',
    currency: 'PKR'
  });
  
  // State for images
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  
  // State for categories
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!productId) {
        setError('Product ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Load product details
        const productData = await productService.getProductById(productId);
        setProduct(productData);
        
        // Populate form data
        setFormData({
          name: productData.name,
          description: productData.description,
          price: productData.price.toString(),
          discountPrice: productData.discountPrice?.toString() || '',
          stockQuantity: productData.stockQuantity.toString(),
          categoryId: productData.categoryId,
          status: productData.status as 'Draft' | 'Active' | 'Inactive',
          currency: productData.currency
        });
        
        // Set existing images
        setExistingImages(productData.images || []);
        
        // Load all categories
        const allCategories = await categoryService.getCategories();
                setAvailableCategories(allCategories);
        
      } catch (err) {
        console.error('Error loading product:', err);
        setError('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [productId]);

  const handleInputChange = (field: keyof EditProductFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const selectedFiles = Array.from(files);
      setNewImages(prev => [...prev, ...selectedFiles]);
    }
  };

  const handleRemoveExistingImage = (imageUrl: string) => {
    setExistingImages(prev => prev.filter(img => img.imageUrl !== imageUrl));
    setImagesToDelete(prev => [...prev, imageUrl]);
  };

  const handleRemoveNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!productId) {
      setError('Product ID is required');
      return;
    }

    // Basic validation
    if (!formData.name.trim() || !formData.description.trim() || !formData.price) {
      setError('Please fill in all required fields');
      return;
    }

    if (parseFloat(formData.price) <= 0) {
      setError('Price must be greater than 0');
      return;
    }

    if (parseInt(formData.stockQuantity) < 0) {
      setError('Stock quantity cannot be negative');
      return;
    }

    if (!formData.categoryId || formData.categoryId.trim() === '') {
      setError('Please select a category');
      return;
    }

    if (formData.discountPrice && parseFloat(formData.discountPrice) >= parseFloat(formData.price)) {
      setError('Discount price must be less than regular price');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Prepare update data
      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        discountPrice: formData.discountPrice ? parseFloat(formData.discountPrice) : undefined,
        stockQuantity: parseInt(formData.stockQuantity),
        categoryId: formData.categoryId,
        status: formData.status,
        currency: formData.currency,
        imagesToDelete,
        newImages: newImages.map((file, index) => ({
          file,
          isPrimary: existingImages.length === 0 && index === 0 // Set first new image as primary if no existing images
        }))
      };

      await productService.updateProduct(productId, updateData);
      
      setSuccess('Product updated successfully!');
      
      // Navigate back to seller products after a delay
      setTimeout(() => {
        navigate('/seller/products');
      }, 2000);
      
    } catch (err) {
      console.error('Error updating product:', err);
      setError(err instanceof Error ? err.message : 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!product) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Product not found</Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/seller/products')}
          sx={{ mt: 2 }}
        >
          Back to Products
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/seller/products')}
          variant="outlined"
        >
          Back to Products
        </Button>
        <Typography variant="h4" component="h1">
          Edit Product
        </Typography>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
          {/* Basic Information */}
          <Box sx={{ flex: { md: 2 } }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Product Information
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Product Name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    fullWidth
                    required
                    disabled={saving}
                  />
                  
                  <TextField
                    label="Description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    fullWidth
                    multiline
                    rows={4}
                    required
                    disabled={saving}
                  />
                  
                  <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <TextField
                      label="Price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      fullWidth
                      required
                      inputProps={{ min: 0, step: 0.01 }}
                      disabled={saving}
                    />
                    
                    <TextField
                      label="Discount Price (Optional)"
                      type="number"
                      value={formData.discountPrice}
                      onChange={(e) => handleInputChange('discountPrice', e.target.value)}
                      fullWidth
                      inputProps={{ min: 0, step: 0.01 }}
                      disabled={saving}
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <TextField
                      label="Stock Quantity"
                      type="number"
                      value={formData.stockQuantity}
                      onChange={(e) => handleInputChange('stockQuantity', e.target.value)}
                      fullWidth
                      required
                      inputProps={{ min: 0 }}
                      disabled={saving}
                    />
                    
                    <FormControl fullWidth disabled={saving} required>
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={formData.categoryId}
                        label="Category"
                        onChange={(e) => handleInputChange('categoryId', e.target.value)}
                      >
                        {availableCategories.map((category) => (
                          <MenuItem key={category.id} value={category.id}>
                            {category.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  
                  <FormControl fullWidth disabled={saving}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={formData.status}
                      label="Status"
                      onChange={(e) => handleInputChange('status', e.target.value)}
                    >
                      <MenuItem value="Draft">Draft</MenuItem>
                      <MenuItem value="Active">Active</MenuItem>
                      <MenuItem value="Inactive">Inactive</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Product Images */}
          <Box sx={{ flex: { md: 1 } }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Product Images
                </Typography>
                
                {/* Existing Images */}
                {existingImages.length > 0 && (
                  <>
                    <Typography variant="subtitle2" gutterBottom>
                      Current Images:
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      {existingImages.map((image, index) => (
                        <Box key={index} sx={{ position: 'relative', display: 'inline-block', mr: 1, mb: 1 }}>
                          <Paper sx={{ p: 1 }}>
                            <img 
                              src={image.imageUrl} 
                              alt={image.altText || `Product image ${index + 1}`}
                              style={{ width: 100, height: 100, objectFit: 'cover' }}
                            />
                            {image.isPrimary && (
                              <Chip 
                                label="Primary" 
                                size="small" 
                                color="primary" 
                                sx={{ position: 'absolute', top: 4, left: 4 }}
                              />
                            )}
                            <IconButton
                              size="small"
                              color="error"
                              sx={{ position: 'absolute', top: 4, right: 4 }}
                              onClick={() => handleRemoveExistingImage(image.imageUrl)}
                              disabled={saving}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Paper>
                        </Box>
                      ))}
                    </Box>
                    <Divider sx={{ my: 2 }} />
                  </>
                )}
                
                {/* New Images */}
                {newImages.length > 0 && (
                  <>
                    <Typography variant="subtitle2" gutterBottom>
                      New Images:
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      {newImages.map((file, index) => (
                        <Box key={index} sx={{ position: 'relative', display: 'inline-block', mr: 1, mb: 1 }}>
                          <Paper sx={{ p: 1 }}>
                            <img 
                              src={URL.createObjectURL(file)} 
                              alt={`New image ${index + 1}`}
                              style={{ width: 100, height: 100, objectFit: 'cover' }}
                            />
                            <IconButton
                              size="small"
                              color="error"
                              sx={{ position: 'absolute', top: 4, right: 4 }}
                              onClick={() => handleRemoveNewImage(index)}
                              disabled={saving}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Paper>
                        </Box>
                      ))}
                    </Box>
                    <Divider sx={{ my: 2 }} />
                  </>
                )}
                
                {/* Upload Button */}
                <Button
                  variant="outlined"
                  startIcon={<PhotoCameraIcon />}
                  component="label"
                  fullWidth
                  disabled={saving}
                >
                  Add Images
                  <input
                    type="file"
                    hidden
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </Button>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Submit Button */}
        <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/seller/products')}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                disabled={saving}
              >
                {saving ? 'Updating...' : 'Update Product'}
              </Button>
            </Box>
        </Box>
      </form>
    </Box>
  );
};

export default EditProductPage;