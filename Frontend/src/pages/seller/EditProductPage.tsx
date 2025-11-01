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
import AddIcon from '@mui/icons-material/Add';
import productService from '../../services/productService';
import categoryService, { type Category } from '../../services/categoryService';

// Category interface is now imported from categoryService

import type { ProductDetail, ProductImage } from '../../types/product';

// Extended image type that guarantees imageUrl is present
interface EditableImage extends ProductImage {
  imageUrl: string;
}

// Form data interface matching the API expectations
interface EditProductFormData {
  name: string;
  description: string;
  price: string;
  discountPrice: string;
  stockQuantity: string;
  categoryId: string;
  status: 'Draft' | 'Active' | 'Inactive';
  currency: string;
  sku?: string;
  minOrderQuantity?: string;
  maxOrderQuantity?: string;
  weight?: string;
  weightUnit?: string;
  dimensions?: string;
  brand?: string;
  model?: string;
  material?: string;
  tags?: string; // comma separated
}

const EditProductPage: React.FC = () => {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  
  // State for product data
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [formData, setFormData] = useState<EditProductFormData>({
    name: '',
    description: '',
    price: '',
    discountPrice: '',
    stockQuantity: '',
    categoryId: '',
    status: 'Draft',
    currency: 'PKR',
    sku: '',
    minOrderQuantity: '1',
    maxOrderQuantity: '999999',
    weight: '',
    weightUnit: 'kg',
    dimensions: '',
    brand: '',
    model: '',
    
    tags: ''
  });
  
  // State for images
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  // Variants state
  const [variants, setVariants] = useState<Array<{ size?: string; color?: string; price?: string; stockQuantity?: string; sku?: string }>>([
    { size: '', color: '', price: '', stockQuantity: '' }
  ]);
  
  // State for categories
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);

  // Attributes (name/value pairs)
  const [attributes, setAttributes] = useState<Array<{ name: string; value: string }>>([
    { name: '', value: '' }
  ]);
  
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
        const productData = await productService.getProduct(productId);
        
        if (!productData) {
          throw new Error('Product not found');
        }

        // Set product data
        setProduct(productData);
        
        // Populate form data
        setFormData({
          name: productData.name || '',
          description: productData.description || '',
          price: String(productData.price || ''),
          discountPrice: productData.discountPrice ? String(productData.discountPrice) : '',
          stockQuantity: String(productData.stockQuantity || ''),
          categoryId: productData.categoryId || '',
          status: (productData.status as 'Draft' | 'Active' | 'Inactive') || 'Draft',
          currency: productData.currency || 'PKR',
          sku: productData.sku || '',
          minOrderQuantity: productData.minOrderQuantity ? String(productData.minOrderQuantity) : '1',
          maxOrderQuantity: productData.maxOrderQuantity ? String(productData.maxOrderQuantity) : '999999',
          weight: productData.weight ? String(productData.weight) : '',
          weightUnit: productData.weightUnit || 'kg',
          dimensions: productData.dimensions || '',
          brand: productData.brand || '',
          model: productData.model || '',
          
          tags: productData.tags && Array.isArray(productData.tags) ? productData.tags.join(', ') : ''
        });
        
        // Convert product images to EditableImage type
        const editableImages: EditableImage[] = (productData.images || [])
          .filter((img): img is EditableImage => {
            const imageUrl = img.imageUrl || img.ImageUrl;
            return typeof imageUrl === 'string' && typeof img.isPrimary === 'boolean';
          })
          .map(img => ({
            ...img,
            imageUrl: img.imageUrl || img.ImageUrl || ''
          }));
          
        setExistingImages(editableImages);
        // Load variants if present
        if (productData.variants && Array.isArray(productData.variants) && productData.variants.length > 0) {
          setVariants(productData.variants.map(v => ({
            size: v.size || '',
            color: v.color || '',
            price: v.price !== undefined && v.price !== null ? String(v.price) : '',
            stockQuantity: v.stockQuantity !== undefined && v.stockQuantity !== null ? String(v.stockQuantity) : '',
            sku: v.sku || ''
          })));
        }
        
        // Load all categories
        const allCategories = await categoryService.getCategories();
                setAvailableCategories(allCategories);

        // Load attributes from product attributes dictionary
        if (productData.attributes && typeof productData.attributes === 'object') {
          const attrs = Object.entries(productData.attributes).map(([name, value]) => ({ name, value }));
          if (attrs.length > 0) setAttributes(attrs);
        }
        
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

  const addVariantRow = () => setVariants(prev => [...prev, { size: '', color: '', price: '', stockQuantity: '' }]);

  const removeVariantRow = (index: number) => setVariants(prev => prev.filter((_, i) => i !== index));

  const updateVariantField = (index: number, field: string, value: string) => {
    setVariants(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v));
  };

  // Attribute handlers
  const addAttribute = () => setAttributes(prev => [...prev, { name: '', value: '' }]);
  const removeAttribute = (index: number) => setAttributes(prev => prev.filter((_, i) => i !== index));
  const updateAttribute = (index: number, field: 'name' | 'value', value: string) => {
    setAttributes(prev => prev.map((a, i) => i === index ? { ...a, [field]: value } : a));
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

      // Prepare update data with string values for API
      const updateData: any = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: formData.price,
        discountPrice: formData.discountPrice || undefined,
        stockQuantity: formData.stockQuantity,
        categoryId: formData.categoryId,
        status: formData.status,
        currency: formData.currency,
        sku: formData.sku,
        minOrderQuantity: formData.minOrderQuantity,
        maxOrderQuantity: formData.maxOrderQuantity,
        weight: formData.weight,
        weightUnit: formData.weightUnit,
        dimensions: formData.dimensions,
        brand: formData.brand,
        model: formData.model,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        imagesToDelete,
        images: newImages.map((file, index) => ({
          file,
          isPrimary: existingImages.length === 0 && index === 0 // Set first new image as primary if no existing images
        }))
      };

      // Include attributes if provided
      const validAttributes = attributes.filter(a => a.name.trim() && a.value.trim()).map(a => ({ name: a.name.trim(), value: a.value.trim() }));
      if (validAttributes.length > 0) updateData.attributes = validAttributes;

      // Include variants if any
      const validVariants = variants.filter(v => (v.size && v.size.trim()) || (v.color && v.color.trim()) || (v.price && v.price.trim()) || (v.stockQuantity && v.stockQuantity.trim()));
      if (validVariants.length > 0) {
        (updateData as any).variants = validVariants.map(v => ({
          size: v.size || undefined,
          color: v.color || undefined,
          price: v.price || undefined,
          stockQuantity: v.stockQuantity || undefined,
          sku: v.sku || undefined
        }));
      }

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
                  <Box sx={{ display: 'flex', gap: 2, mt: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <FormControl fullWidth>
                      <InputLabel>Currency</InputLabel>
                      <Select
                        value={formData.currency}
                        label="Currency"
                        onChange={(e) => handleInputChange('currency', e.target.value)}
                        disabled={saving}
                      >
                        <MenuItem value="PKR">PKR</MenuItem>
                        <MenuItem value="USD">USD</MenuItem>
                        <MenuItem value="EUR">EUR</MenuItem>
                      </Select>
                    </FormControl>

                    <TextField
                      label="SKU"
                      value={formData.sku}
                      onChange={(e) => handleInputChange('sku' as any, e.target.value)}
                      fullWidth
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
                  <Box sx={{ display: 'flex', gap: 2, mt: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <TextField
                      label="Min Order Quantity"
                      type="number"
                      value={formData.minOrderQuantity}
                      onChange={(e) => handleInputChange('minOrderQuantity' as any, e.target.value)}
                      fullWidth
                      inputProps={{ min: 1 }}
                      disabled={saving}
                    />

                    <TextField
                      label="Max Order Quantity"
                      type="number"
                      value={formData.maxOrderQuantity}
                      onChange={(e) => handleInputChange('maxOrderQuantity' as any, e.target.value)}
                      fullWidth
                      inputProps={{ min: 1 }}
                      disabled={saving}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, mt: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <TextField
                      label="Weight"
                      type="number"
                      value={formData.weight}
                      onChange={(e) => handleInputChange('weight' as any, e.target.value)}
                      fullWidth
                      inputProps={{ min: 0, step: 0.01 }}
                      disabled={saving}
                    />

                    <FormControl fullWidth>
                      <InputLabel>Weight Unit</InputLabel>
                      <Select
                        value={formData.weightUnit}
                        label="Weight Unit"
                        onChange={(e) => handleInputChange('weightUnit' as any, e.target.value)}
                        disabled={saving}
                      >
                        <MenuItem value="kg">kg</MenuItem>
                        <MenuItem value="g">g</MenuItem>
                        <MenuItem value="lb">lb</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  <TextField
                    label="Dimensions (LxWxH)"
                    value={formData.dimensions}
                    onChange={(e) => handleInputChange('dimensions' as any, e.target.value)}
                    fullWidth
                    disabled={saving}
                    sx={{ mt: 2 }}
                  />

                  <Box sx={{ display: 'flex', gap: 2, mt: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <TextField
                      label="Brand"
                      value={formData.brand}
                      onChange={(e) => handleInputChange('brand' as any, e.target.value)}
                      fullWidth
                      disabled={saving}
                    />

                    <TextField
                      label="Model"
                      value={formData.model}
                      onChange={(e) => handleInputChange('model' as any, e.target.value)}
                      fullWidth
                      disabled={saving}
                    />
                  </Box>

                  <TextField
                    label="Tags (comma separated)"
                    value={formData.tags}
                    onChange={(e) => handleInputChange('tags' as any, e.target.value)}
                    fullWidth
                    disabled={saving}
                    sx={{ mt: 2 }}
                  />

                  {/* Attributes */}
                  <Card sx={{ mt: 2, p: 1 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle1">Attributes</Typography>
                        <Button size="small" startIcon={<AddIcon />} onClick={addAttribute} disabled={saving}>Add Attribute</Button>
                      </Box>
                      {attributes.map((attr, idx) => (
                        <Box key={idx} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                          <TextField
                            label="Name"
                            value={attr.name}
                            onChange={(e) => updateAttribute(idx, 'name', e.target.value)}
                            size="small"
                            fullWidth
                            disabled={saving}
                          />
                          <TextField
                            label="Value"
                            value={attr.value}
                            onChange={(e) => updateAttribute(idx, 'value', e.target.value)}
                            size="small"
                            fullWidth
                            disabled={saving}
                          />
                          <IconButton onClick={() => removeAttribute(idx)} disabled={saving} color="error">
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                  
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

            {/* Variants Card */}
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6">Variants</Typography>
                  <Button size="small" onClick={addVariantRow} disabled={saving}>Add Variant</Button>
                </Box>

                {variants.map((variant, idx) => (
                  <Box key={idx} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center', flexDirection: { xs: 'column', sm: 'row' } }}>
                    <TextField
                      label="Size"
                      value={variant.size || ''}
                      onChange={(e) => updateVariantField(idx, 'size', e.target.value)}
                      size="small"
                      disabled={saving}
                    />
                    <TextField
                      label="Color"
                      value={variant.color || ''}
                      onChange={(e) => updateVariantField(idx, 'color', e.target.value)}
                      size="small"
                      disabled={saving}
                    />
                    <TextField
                      label="Price"
                      type="number"
                      value={variant.price || ''}
                      onChange={(e) => updateVariantField(idx, 'price', e.target.value)}
                      size="small"
                      inputProps={{ step: 0.01, min: 0 }}
                      disabled={saving}
                    />
                    <TextField
                      label="Stock"
                      type="number"
                      value={variant.stockQuantity || ''}
                      onChange={(e) => updateVariantField(idx, 'stockQuantity', e.target.value)}
                      size="small"
                      inputProps={{ min: 0 }}
                      disabled={saving}
                    />
                    <TextField
                      label="SKU"
                      value={variant.sku || ''}
                      onChange={(e) => updateVariantField(idx, 'sku', e.target.value)}
                      size="small"
                      disabled={saving}
                    />
                    <IconButton onClick={() => removeVariantRow(idx)} disabled={saving} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
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
                              onClick={() => image.imageUrl && handleRemoveExistingImage(image.imageUrl)}
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