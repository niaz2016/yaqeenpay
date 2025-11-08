import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Snackbar,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Chip,
  IconButton,
  InputAdornment,
  Divider,
  LinearProgress
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
import CategorySelector from '../../components/CategorySelector';

interface ProductImage {
  file: File;
  preview: string;
  isPrimary: boolean;
}

interface ProductAttribute {
  name: string;
  value: string;
}

interface ProductFaq {
  question: string;
  answer: string;
}

type ProgressStatus = 'idle' | 'uploading' | 'submitting' | 'success' | 'error';

const NewProductPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [progressState, setProgressState] = useState<{ status: ProgressStatus; percent: number; message: string }>(
    { status: 'idle', percent: 0, message: '' }
  );

  // Track whether the user is scrolled to the bottom of the page.
  const [isAtBottom, setIsAtBottom] = useState(false);

  useEffect(() => {
    const checkBottom = () => {
      const threshold = 150; // px from bottom considered "at bottom"
      const atBottom = (window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - threshold);
      setIsAtBottom(atBottom);
    };
    checkBottom();
    window.addEventListener('scroll', checkBottom, { passive: true });
    window.addEventListener('resize', checkBottom);
    return () => {
      window.removeEventListener('scroll', checkBottom);
      window.removeEventListener('resize', checkBottom);
    };
  }, []);

  const isUploadingOrSubmitting = progressState.status === 'uploading' || progressState.status === 'submitting';
  const isError = progressState.status === 'error';
  const isSuccess = progressState.status === 'success';

  const updateProgress = (status: ProgressStatus, percent: number, message: string) => {
    const clampedPercent = Math.min(100, Math.max(0, percent));
    setProgressState({ status, percent: clampedPercent, message });
  };

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    discountPrice: '',
    stockQuantity: '',
    categoryId: '',
    status: 'Active' as 'Draft' | 'Active' | 'Inactive',
    currency: 'USD',
    brand: '',
    model: '',
    sku: '',
    gtin: '',
    mpn: '',
    minOrderQuantity: '',
    maxOrderQuantity: '',
    weight: '',
    weightUnit: 'kg',
    dimensions: '',
    // Removed color, size, material from top-level formData to avoid duplication with variants/attributes
    allowBackorders: false,
    isFeatured: false,
    tags: '',
    featuredUntil: ''
  });

  const [images, setImages] = useState<ProductImage[]>([]);
  const [attributes, setAttributes] = useState<ProductAttribute[]>([
    { name: '', value: '' }
  ]);
  const [faqs, setFaqs] = useState<ProductFaq[]>([
    { question: '', answer: '' }
  ]);
  // Product variants state
  const [variants, setVariants] = useState([
    { size: '', color: '', price: '', stockQuantity: '', sku: '' }
  ]);
  // Variant handlers
  const addVariant = () => {
    setVariants(prev => [...prev, { size: '', color: '', price: '', stockQuantity: '', sku: '' }]);
  };

  const removeVariant = (index: number) => {
    setVariants(prev => prev.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: string, value: string) => {
    setVariants(prev => prev.map((variant, i) =>
      i === index ? { ...variant, [field]: value } : variant
    ));
  };

  // FAQ handlers
  const addFaq = () => {
    setFaqs(prev => [...prev, { question: '', answer: '' }]);
  };

  const removeFaq = (index: number) => {
    setFaqs(prev => prev.filter((_, i) => i !== index));
  };

  const updateFaq = (index: number, field: 'question' | 'answer', value: string) => {
    setFaqs(prev => prev.map((faq, i) =>
      i === index ? { ...faq, [field]: value } : faq
    ));
  };

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
    // Special handling for boolean fields from select
    if (field === 'allowBackorders' || field === 'isFeatured') {
      setFormData(prev => ({
        ...prev,
        [field]: value === 'yes'
      }));
      return;
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

    setProgressState({ status: 'idle', percent: 0, message: '' });
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    updateProgress('uploading', images.length > 0 ? 5 : 50, images.length > 0 ? 'Preparing images for upload...' : 'Preparing product details...');

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
      const validVariants = variants
        .filter(v => v.size || v.color || v.price || v.stockQuantity)
        .map(v => ({
          size: v.size || undefined,
          color: v.color || undefined,
          price: v.price !== '' ? parseFloat(v.price) : undefined,
          stockQuantity: v.stockQuantity !== '' ? parseInt(v.stockQuantity) : undefined,
          sku: v.sku || undefined
        }));
      const validFaqs = faqs.filter(f => f.question.trim() && f.answer.trim());

      const productData: CreateProductRequest = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        discountPrice: formData.discountPrice || undefined,
        stockQuantity: formData.stockQuantity,
        categoryId: formData.categoryId,
        status: formData.status,
        currency: formData.currency,
        brand: formData.brand || undefined,
        model: formData.model || undefined,
        sku: formData.sku || undefined,
        minOrderQuantity: formData.minOrderQuantity || undefined,
        maxOrderQuantity: formData.maxOrderQuantity || undefined,
        weight: formData.weight || undefined,
        weightUnit: formData.weightUnit || undefined,
        dimensions: formData.dimensions || undefined,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(t => t) : undefined,
        allowBackorders: formData.allowBackorders,
        isFeatured: formData.isFeatured,
        featuredUntil: formData.featuredUntil || undefined,
        attributes: validAttributes,
        faqs: validFaqs,
        newImages: productImages,
        variants: validVariants
      };

      // Add GTIN and MPN as attributes if provided
      if (formData.gtin) {
        productData.attributes = productData.attributes || [];
        productData.attributes.push({ name: 'GTIN', value: formData.gtin });
      }
      if (formData.mpn) {
        productData.attributes = productData.attributes || [];
        productData.attributes.push({ name: 'MPN', value: formData.mpn });
      }

      await productService.createProduct(productData, {
        onUploadStart: ({ total }) => {
          if (total === 0) {
            updateProgress('submitting', 60, 'Uploading skipped. Saving product details...');
            return;
          }
          const descriptor = total === 1 ? 'image' : 'images';
          updateProgress('uploading', 5, `Uploading ${total} ${descriptor}...`);
        },
        onUploadProgress: ({ index, total, percent, fileName }) => {
          const overall = total > 0
            ? Math.min(99, Math.round(((index + percent / 100) / total) * 100))
            : Math.min(99, percent);
          const label = total > 0
            ? `Uploading ${fileName} (${index + 1}/${total}) ${percent}%`
            : `Uploading ${fileName} ${percent}%`;
          updateProgress('uploading', overall, label);
        },
        onUploadComplete: () => {
          updateProgress('submitting', 90, 'Images uploaded. Finalising product...');
        },
        onSubmitting: () => {
          updateProgress('submitting', 95, 'Saving product details...');
        },
      });

      updateProgress('success', 100, 'Product created successfully!');
      setSuccess('Product created successfully!');
      setTimeout(() => {
        navigate('/seller/products');
      }, 2000);
    } catch (error) {
      console.error('Error creating product:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create product';
      setError(errorMessage);
      updateProgress('error', 0, errorMessage.includes('Network')
        ? 'Network error while uploading. Please check your connection or try smaller images.'
        : errorMessage || 'An unexpected error occurred while creating the product.');
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

      {/* Progress/notification shown as a toast (Snackbar). */}

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

                    <CategorySelector
                      categories={categories}
                      value={formData.categoryId}
                      onChange={(id) => handleInputChange('categoryId', id)}
                      disabled={categoriesLoading}
                    />
                </Box>

                {/* SEO Fields Section */}
                <Divider sx={{ my: 3 }}>
                  <Chip label="SEO & Product Identifiers" size="small" />
                </Divider>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Brand"
                    value={formData.brand}
                    onChange={(e) => handleInputChange('brand', e.target.value)}
                    placeholder="e.g., Sony, Samsung, Apple"
                    helperText="Product brand (important for SEO)"
                  />

                  <TextField
                    fullWidth

                    label="Model Number"
                    value={formData.model}
                    onChange={(e) => handleInputChange('model', e.target.value)}
                    placeholder="e.g., XYZ-123"
                    helperText="Product model"
                  />
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="SKU"
                    value={formData.sku}
                    onChange={(e) => handleInputChange('sku', e.target.value)}
                    placeholder="e.g., PROD-001"
                    helperText="Stock Keeping Unit"
                  />

                  <TextField
                    fullWidth
                    label="GTIN"
                    value={formData.gtin}
                    onChange={(e) => handleInputChange('gtin', e.target.value)}
                    placeholder="UPC/EAN/ISBN"
                    helperText="Global Trade Item Number (critical for Google)"
                  />


                  <TextField
                    fullWidth
                    label="MPN"
                    value={formData.mpn}
                    onChange={(e) => handleInputChange('mpn', e.target.value)}
                    placeholder="Manufacturer Part Number"
                    helperText="Helps identify authentic products"
                  />
                </Box>
              </Box>
            </Paper>

            {/* Product Variants */}
            <Paper sx={{ p: 3, mb: 2}}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Product Variants
              </Typography>
              {variants.map((variant, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                  <TextField
                    label="Size"
                    value={variant.size}
                    onChange={(e) => updateVariant(index, 'size', e.target.value)}
                    placeholder="e.g., Large, Medium"
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    label="Color"
                    value={variant.color}
                    onChange={(e) => updateVariant(index, 'color', e.target.value)}
                    placeholder="e.g., Red, Blue"
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    label="Price"
                    type="number"
                    value={variant.price}
                    onChange={(e) => updateVariant(index, 'price', e.target.value)}
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    label="Stock"
                    type="number"
                    value={variant.stockQuantity}
                    onChange={(e) => updateVariant(index, 'stockQuantity', e.target.value)}
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    label="SKU"
                    value={variant.sku}
                    onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                    placeholder="e.g., VAR-001"
                    sx={{ flex: 1 }}
                  />
                  {variants.length > 1 && (
                    <IconButton onClick={() => removeVariant(index)} color="error">
                      <RemoveIcon />
                    </IconButton>
                  )}
                  
                </Box>
                
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={addVariant}
                variant="outlined"
                size="small"
               >
                Add Variant
              </Button>

              {/* Additional Backend Fields */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', m: 1, gap: 2 }}>
                <TextField
                  fullWidth
                  label="Min Order Quantity"
                  type="number"
                  value={formData.minOrderQuantity}
                  onChange={(e) => handleInputChange('minOrderQuantity', e.target.value)}
                  slotProps={{
                    input: { title: "Minimum quantity per order" }
                  }}
                />
                <TextField
                  fullWidth
                  label="Max Order Quantity"
                  type="number"
                  value={formData.maxOrderQuantity}
                  onChange={(e) => handleInputChange('maxOrderQuantity', e.target.value)}
                  slotProps={{
                    input: { title: "Maximum quantity per order" }
                  }}
                />
                <TextField
                  fullWidth
                  label="Weight"
                  type="number"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  slotProps={{
                    input: { title: "Product weight" }
                  }}
                />
                <TextField
                  fullWidth
                  label="Weight Unit"
                  value={formData.weightUnit}
                  onChange={(e) => handleInputChange('weightUnit', e.target.value)}
                  slotProps={{
                    input: { title: "e.g., kg, g, lb" }
                  }}
                />
                <TextField
                fullWidth
                label="Dimensions"
                value={formData.dimensions}
                onChange={(e) => handleInputChange('dimensions', e.target.value)}
                slotProps={{
                  input: { title: "e.g., 10x20x5 cm" }
                }}
              />
              <TextField
                fullWidth
                label="Tags (comma separated)"
                value={formData.tags}
                onChange={(e) => handleInputChange('tags', e.target.value)}
                slotProps={{
                  input: { title: "e.g., electronics, cable, hdmi" }
                }}
              />
              </Box>
            </Paper>
            {/* Custom Attributes */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Custom Attributes
              </Typography>
              {attributes.map((attribute, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                  <TextField
                    label="Attribute Name"
                    value={attribute.name}
                    onChange={(e) => updateAttribute(index, 'name', e.target.value)}
                    placeholder="e.g., Material, Brand"
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    label="Value"
                    value={attribute.value}
                    onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                    placeholder="e.g., Cotton, Samsung"
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

            {/* Product FAQs */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Product FAQs (Optional)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Add frequently asked questions to help customers make informed purchasing decisions.
              </Typography>
              {faqs.map((faq, index) => (
                <Box key={index} sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle2" color="primary">FAQ {index + 1}</Typography>
                    {faqs.length > 1 && (
                      <IconButton onClick={() => removeFaq(index)} color="error" size="small">
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>
                  <TextField
                    fullWidth
                    label="Question"
                    value={faq.question}
                    onChange={(e) => updateFaq(index, 'question', e.target.value)}
                    placeholder="e.g., What is the warranty period?"
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Answer"
                    value={faq.answer}
                    onChange={(e) => updateFaq(index, 'answer', e.target.value)}
                    placeholder="e.g., This product comes with a 1-year manufacturer warranty."
                    multiline
                    rows={3}
                  />
                </Box>
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={addFaq}
                variant="outlined"
                size="small"
              >
                Add FAQ
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

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <FormControl >
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
                    renderValue={() => 'PKR'}
                  >
                    <MenuItem value="PKR">PKR</MenuItem>
                  </Select>
                </FormControl>
                <FormControl>
                  <InputLabel>Allow Backorders</InputLabel>
                  <Select
                    value={formData.allowBackorders ? 'yes' : 'no'}
                    onChange={(e) => handleInputChange('allowBackorders', e.target.value)}
                    label="Allow Backorders"
                  >
                    <MenuItem value="no">No</MenuItem>
                    <MenuItem value="yes">Yes</MenuItem>
                  </Select>
                </FormControl>
                <FormControl>
                  <InputLabel>Featured</InputLabel>
                  <Select
                    value={formData.isFeatured ? 'yes' : 'no'}
                    onChange={(e) => handleInputChange('isFeatured', e.target.value)}
                    label="Featured"
                  >
                    <MenuItem value="no">No</MenuItem>
                    <MenuItem value="yes">Yes</MenuItem>
                  </Select>

                </FormControl>
                <FormControl fullWidth sx={{ gridColumn: '1 / -1' }}>
                  <TextField
                    id="featured-until-date"
                    type="date"
                    fullWidth
                    label="Featured Until"
                    value={formData.featuredUntil}
                    onChange={(e) => handleInputChange('featuredUntil', e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
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

      {/* Snackbar toast for upload progress / result */}
      <Snackbar
        open={progressState.status !== 'idle' || Boolean(success) || Boolean(error)}
        anchorOrigin={isAtBottom ? { vertical: 'bottom', horizontal: 'center' } : { vertical: 'top', horizontal: 'right' }}
        onClose={() => {
          // allow manual closing after final state
          if (progressState.status === 'success' || progressState.status === 'error') {
            updateProgress('idle', 0, '');
            setSuccess(null);
            setError(null);
          }
        }}
  slotProps={{ clickAwayListener: { mouseEvent: false } }}
        disableWindowBlurListener
        autoHideDuration={progressState.status === 'success' || progressState.status === 'error' ? 4000 : undefined}
      >
        <Paper sx={{ p: 2, minWidth: 300, display: 'flex', flexDirection: 'column', gap: 1 }} elevation={6}>
          <Typography variant="body2" color={progressState.status === 'error' ? 'error.main' : 'text.primary'}>
            {progressState.message || (progressState.status === 'success' ? 'Product created successfully.' : 'Processing...')}
          </Typography>
          {isUploadingOrSubmitting ? (
            <LinearProgress
              variant={isError ? 'indeterminate' : 'determinate'}
              value={isError ? undefined : progressState.percent}
              color={isError ? 'error' : isSuccess ? 'success' : 'primary'}
            />
          ) : (
            // show a thin progress bar on final states for a short time
            <LinearProgress
              variant={isError ? 'indeterminate' : 'determinate'}
              value={isSuccess ? 100 : 0}
              color={isError ? 'error' : isSuccess ? 'success' : 'primary'}
            />
          )}
        </Paper>
      </Snackbar>
    </Box>
  );
};

export default NewProductPage;