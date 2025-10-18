import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Alert,
  Chip,
  IconButton,
  InputAdornment,
  Divider
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Remove as RemoveIcon
} from '@mui/icons-material';

import productService, { type CreateProductRequest, type ProductImage as ServiceProductImage, type ProductAttribute as ServiceProductAttribute } from '../../services/productService';
import categoryService, { type Category } from '../../services/categoryService';

interface ProductImage {
  file: File;
  preview: string;
  isPrimary: boolean;
}

interface ProductAttribute {
  name: string;
  value: string;
}

const NewProductPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    discountPrice: '',
    stockQuantity: '',
    categoryId: '',
    status: 'Active' as 'Draft' | 'Active' | 'Inactive',
    currency: 'USD'
  });

  const [images, setImages] = useState<ProductImage[]>([]);
  const [attributes, setAttributes] = useState<ProductAttribute[]>([
    { name: '', value: '' }
  ]);

  // Load categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategoriesLoading(true);
        
        // Clear cache to ensure fresh data
        categoryService.clearCache();
        
        const fetchedCategories = await categoryService.getCategories();
        
        if (fetchedCategories && fetchedCategories.length > 0) {
          setCategories(fetchedCategories);
        } else {
          console.warn('[NewProductPage] No categories received from backend');
          setCategories([]);
        }
      } catch (error) {
        console.error('[NewProductPage] Failed to load categories:', error);
        // Don't fall back to PRODUCT_CATEGORIES to avoid GUID mismatch
        setCategories([]);
        setError('Failed to load categories. Please ensure the backend is running.');
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadCategories();
  }, []);

  const handleInputChange = (field: string, value: string | number) => {
    if (field === 'categoryId') {
    }
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        setImages(prev => [...prev, {
          file,
          preview,
          isPrimary: prev.length === 0 // First image is primary by default
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      // If we removed the primary image, make the first remaining image primary
      if (prev[index].isPrimary && newImages.length > 0) {
        newImages[0].isPrimary = true;
      }
      return newImages;
    });
  };

  const setPrimaryImage = (index: number) => {
    setImages(prev => prev.map((img, i) => ({
      ...img,
      isPrimary: i === index
    })));
  };

  const addAttribute = () => {
    setAttributes(prev => [...prev, { name: '', value: '' }]);
  };

  const removeAttribute = (index: number) => {
    setAttributes(prev => prev.filter((_, i) => i !== index));
  };

  const updateAttribute = (index: number, field: 'name' | 'value', value: string) => {
    setAttributes(prev => prev.map((attr, i) => 
      i === index ? { ...attr, [field]: value } : attr
    ));
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return 'Product name is required';
    if (!formData.description.trim()) return 'Product description is required';
    if (!formData.price || parseFloat(formData.price) <= 0) return 'Valid price is required';
    if (!formData.stockQuantity || parseInt(formData.stockQuantity) < 0) return 'Valid stock quantity is required';
    if (!formData.categoryId) return 'Category is required';
    
    // Check if categoryId is a valid GUID format
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!guidRegex.test(formData.categoryId)) {
      console.error('Invalid categoryId format:', formData.categoryId);
      return 'Invalid category selection. Please select a category from the dropdown.';
    }
    
    if (images.length === 0) return 'At least one product image is required';
    
    return null;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Convert images to service format
      const productImages: ServiceProductImage[] = images.map(img => ({
        file: img.file,
        isPrimary: img.isPrimary
      }));

      // Convert attributes to service format (filter out empty ones)
      const validAttributes: ServiceProductAttribute[] = attributes
        .filter(attr => attr.name.trim() && attr.value.trim())
        .map(attr => ({
          name: attr.name.trim(),
          value: attr.value.trim()
        }));

      // Prepare product data
      const productData: CreateProductRequest = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        discountPrice: formData.discountPrice || undefined,
        stockQuantity: formData.stockQuantity,
        categoryId: formData.categoryId,
        status: formData.status,
        currency: formData.currency,
        attributes: validAttributes,
        images: productImages
      };
      await productService.createProduct(productData);
      
      setSuccess('Product created successfully!');
      setTimeout(() => {
        navigate('/seller/products');
      }, 2000);
    } catch (error) {
      console.error('Error creating product:', error);
      setError(error instanceof Error ? error.message : 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/seller/products')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Add New Product
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create a new product to sell in the marketplace
          </Typography>
        </Box>
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

      <form onSubmit={handleSubmit}>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, 
          gap: 3 
        }}>
          {/* Left Column - Basic Information */}
          <Box>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Basic Information
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Product Name"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter product name"
                />
                
                <TextField
                  fullWidth
                  label="Description"
                  required
                  multiline
                  rows={4}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your product in detail"
                />

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Price"
                    required
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Discount Price (Optional)"
                    type="number"
                    value={formData.discountPrice}
                    onChange={(e) => handleInputChange('discountPrice', e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Stock Quantity"
                    required
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) => handleInputChange('stockQuantity', e.target.value)}
                  />

                  <FormControl fullWidth required>
                    <InputLabel id="category-select-label">Category</InputLabel>
                    <Select
                      labelId="category-select-label"
                      value={formData.categoryId}
                      onChange={(e) => handleInputChange('categoryId', e.target.value)}
                      label="Category"
                      disabled={categoriesLoading}
                      MenuProps={{
                        PaperProps: {
                          style: {
                            maxHeight: 300,
                            zIndex: 1500,
                          },
                        },
                        anchorOrigin: {
                          vertical: 'bottom',
                          horizontal: 'left',
                        },
                        transformOrigin: {
                          vertical: 'top',
                          horizontal: 'left',
                        },
                      }}
                    >
                      {categoriesLoading ? (
                        <MenuItem disabled>Loading categories...</MenuItem>
                      ) : (
                        [
                          /* Always render backend categories first */
                          ...categoryService.getFlattenedCategories(categories).map((category: Category) => (
                            <MenuItem key={category.id} value={category.id}>
                              <Box>
                                <Typography variant="body2">{category.name}</Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {category.description}
                                </Typography>
                              </Box>
                            </MenuItem>
                          )),
                          
                          /* Show message if no categories loaded */
                          ...(categories.length === 0 ? [(
                            <MenuItem key="no-categories" disabled>
                              <Typography variant="body2" color="error">
                                No categories available. Please ensure backend is running.
                              </Typography>
                            </MenuItem>
                          )] : [])
                        ]
                      )}
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            </Paper>

            {/* Product Attributes */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Product Attributes (Optional)
              </Typography>
              
              {attributes.map((attribute, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                  <TextField
                    label="Attribute Name"
                    value={attribute.name}
                    onChange={(e) => updateAttribute(index, 'name', e.target.value)}
                    placeholder="e.g., Color, Size, Material"
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    label="Value"
                    value={attribute.value}
                    onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                    placeholder="e.g., Red, Large, Cotton"
                    sx={{ flex: 1 }}
                  />
                  {attributes.length > 1 && (
                    <IconButton onClick={() => removeAttribute(index)} color="error">
                      <RemoveIcon />
                    </IconButton>
                  )}
                </Box>
              ))}
              
              <Button
                startIcon={<AddIcon />}
                onClick={addAttribute}
                variant="outlined"
                size="small"
              >
                Add Attribute
              </Button>
            </Paper>
          </Box>

          {/* Right Column - Sidebar */}
          <Box>
            {/* Status & Publishing */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Status & Publishing
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    label="Status"
                  >
                    <MenuItem value="Draft">Draft</MenuItem>
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Currency</InputLabel>
                  <Select
                    value={formData.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                    label="Currency"
                  >
                    <MenuItem value="USD">USD</MenuItem>
                    <MenuItem value="PKR">PKR</MenuItem>
                    <MenuItem value="EUR">EUR</MenuItem>
                    <MenuItem value="GBP">GBP</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Paper>

            {/* Product Images */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Product Images
              </Typography>
              
              <Button
                component="label"
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                fullWidth
                sx={{ mb: 2, p: 2 }}
              >
                Upload Images
                <input
                  type="file"
                  hidden
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </Button>

              {images.map((image, index) => (
                <Card key={index} sx={{ mb: 2 }}>
                  <Box sx={{ position: 'relative' }}>
                    <img
                      src={image.preview}
                      alt={`Product ${index + 1}`}
                      style={{
                        width: '100%',
                        height: 150,
                        objectFit: 'cover'
                      }}
                    />
                    <IconButton
                      onClick={() => removeImage(index)}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'rgba(0,0,0,0.5)',
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'rgba(0,0,0,0.7)'
                        }
                      }}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                    {image.isPrimary && (
                      <Chip
                        label="Primary"
                        color="primary"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          left: 8
                        }}
                      />
                    )}
                  </Box>
                  <CardContent sx={{ py: 1 }}>
                    <Button
                      size="small"
                      onClick={() => setPrimaryImage(index)}
                      disabled={image.isPrimary}
                      fullWidth
                    >
                      {image.isPrimary ? 'Primary Image' : 'Set as Primary'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </Paper>
          </Box>
        </Box>

        {/* Form Actions */}
        <Divider sx={{ my: 3 }} />
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/seller/products')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Creating Product...' : 'Create Product'}
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default NewProductPage;