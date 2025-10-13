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
    Alert,
    Pagination,
    Fab,
    Badge
} from '@mui/material';
import {
    Search as SearchIcon,
    ShoppingCart as CartIcon,
    Store as StoreIcon,
    Add as AddIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

import productService from '../services/productService';
import categoryService, { type Category } from '../services/categoryService';
import cartService from '../services/cartService';

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    discountPrice?: number;
    stockQuantity: number;
    status: 'Draft' | 'Active' | 'Inactive' | 'OutOfStock' | 'Discontinued';
    category: {
        id: string;
        name: string;
    };
    seller: {
        id: string;
        businessName: string;
        phoneNumber?: string;
    };
    images: Array<{
        id: string;
        imageUrl?: string;
        ImageUrl?: string;
        isPrimary?: boolean;
        IsPrimary?: boolean;
        altText?: string;
        AltText?: string;
        sortOrder?: number;
        SortOrder?: number;
    }>;
    createdAt: string;
    isOnSale: boolean;
    effectivePrice: number;
}

const MarketplacePage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');

    console.log('MarketplacePage rendered, selectedCategory:', selectedCategory);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [error, setError] = useState<string | null>(null);
    const [cartCount, setCartCount] = useState(0);
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);

    // Check if user is a seller
    const isSeller = user?.roles?.some((role: string) => role.toLowerCase() === 'seller');

    // Load categories on mount
    useEffect(() => {
        const loadCategories = async () => {
            try {
                console.log('Loading categories from backend...');
                setCategoriesLoading(true);

                // Clear cache to ensure fresh data
                categoryService.clearCache();

                const fetchedCategories = await categoryService.getCategories();
                console.log('Fetched categories:', fetchedCategories);
                setCategories(fetchedCategories);
            } catch (error) {
                console.error('Failed to load categories:', error);
                // Fall back to empty categories array
                setCategories([]);
            } finally {
                setCategoriesLoading(false);
            }
        };

        loadCategories();
    }, []);

    useEffect(() => {
        fetchProducts();
        if (!isSeller) {
            fetchCartCount();
        }
    }, [page, search, selectedCategory, isSeller]);

    // Listen for cart updates from other components
    useEffect(() => {
        if (!isSeller) {
            const handleCartUpdate = (event: CustomEvent) => {
                setCartCount(event.detail.totalItems);
            };

            window.addEventListener('cartUpdated', handleCartUpdate as EventListener);

            return () => {
                window.removeEventListener('cartUpdated', handleCartUpdate as EventListener);
            };
        }
    }, [isSeller]);

    const fetchProducts = async () => {
        try {
            setLoading(true);

            const params = {
                page: page,
                pageSize: 12,
                ...(search && { search }),
                ...(selectedCategory && selectedCategory !== '' && { categoryId: selectedCategory })
            };

            console.log('[MarketplacePage] Fetching products with params:', params);
            console.log('[MarketplacePage] User is seller:', isSeller);
            console.log('[MarketplacePage] Using endpoint:', isSeller ? '/products/seller' : '/products');

            // Use different service method based on user role
            const data = isSeller
                ? await productService.getSellerProducts(params)
                : await productService.getProducts(params);

            console.log('[MarketplacePage] API Response:', data);
            console.log('[MarketplacePage] API Response Type:', typeof data);
            console.log('[MarketplacePage] API Response Keys:', data ? Object.keys(data) : 'null');

            // Handle different response structures
            let productsArray = [];
            let totalCount = 0;

            console.log('[MarketplacePage] Processing response data...');
            console.log('[MarketplacePage] data.success:', data?.success);
            console.log('[MarketplacePage] data.data exists:', !!data?.data);
            console.log('[MarketplacePage] data.data structure:', data?.data ? Object.keys(data.data) : 'N/A');

            if (data && typeof data === 'object' && 'items' in data) {
                // ApiService has already unwrapped the response, data is the inner data object
                console.log('[MarketplacePage] Direct data object with items');
                console.log('[MarketplacePage] data.items exists:', !!data.items);
                console.log('[MarketplacePage] data.items is array:', Array.isArray(data.items));
                console.log('[MarketplacePage] data.items length:', data.items?.length);

                productsArray = Array.isArray(data.items) ? data.items : [];
                totalCount = data.totalCount || data.total || productsArray.length;

                console.log('[MarketplacePage] Extracted productsArray:', productsArray);
                console.log('[MarketplacePage] Extracted totalCount:', totalCount);
            } else if (data.success && data.data) {
                // API response wrapper format (if not unwrapped)
                console.log('[MarketplacePage] Wrapped response format');
                console.log('[MarketplacePage] data.data.items exists:', !!data.data.items);
                console.log('[MarketplacePage] data.data.items is array:', Array.isArray(data.data.items));
                console.log('[MarketplacePage] data.data.items length:', data.data.items?.length);

                productsArray = Array.isArray(data.data.products) ? data.data.products :
                    Array.isArray(data.data.items) ? data.data.items :
                        Array.isArray(data.data) ? data.data : [];
                totalCount = data.data.totalCount || data.data.total || productsArray.length;

                console.log('[MarketplacePage] Extracted productsArray:', productsArray);
                console.log('[MarketplacePage] Extracted totalCount:', totalCount);
            } else if (Array.isArray(data)) {
                // Direct array response
                productsArray = data;
                totalCount = data.length;
                console.log('[MarketplacePage] Direct array response:', productsArray.length);
            } else if (data.products && Array.isArray(data.products)) {
                // Products property
                productsArray = data.products;
                totalCount = data.totalCount || data.total || productsArray.length;
                console.log('[MarketplacePage] Products property response:', productsArray.length);
            } else {
                // Fallback to empty array
                productsArray = [];
                totalCount = 0;
                console.log('[MarketplacePage] Fallback to empty array');
            }

            console.log('[MarketplacePage] Final productsArray before setProducts:', productsArray);
            console.log('[MarketplacePage] Final productsArray length:', productsArray.length);

            setProducts(productsArray);
            setTotalPages(Math.ceil(totalCount / 12));
            setError(null);
        } catch (error: any) {
            console.error('[MarketplacePage] Error fetching products:', error);

            // Check for CategoryId validation error
            if (error?.response?.data?.errors?.CategoryId) {
                const categoryError = error.response.data.errors.CategoryId[0];
                console.error('[MarketplacePage] CategoryId validation error:', categoryError);
                setError(`Category error: ${categoryError}. Please select a different category.`);
                // Reset category selection on validation error
                setSelectedCategory('');
            } else {
                setError('Error fetching products');
            }

            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchCartCount = async () => {
        try {
            // Use local cart service instead of API
            const totalItems = cartService.getTotalItems();
            setCartCount(totalItems);
            console.log('[MarketplacePage] Cart count updated:', totalItems);
        } catch (error) {
            console.error('Error fetching cart count:', error);
        }
    };

    const handleAddToCart = async (product: Product) => {
        try {
            console.log('[MarketplacePage] Adding to cart:', product.name);

            const success = cartService.addToCart(
                {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    currency: product.currency,
                    stockQuantity: product.stockQuantity,
                    sku: (product as any).sku || '', // fallback if sku is missing
                    images: product.images,
                    seller: product.seller
                },
                1
            );

            if (success) {
                // Update cart count
                const newCartCount = cartService.getTotalItems();
                setCartCount(newCartCount);
                console.log('Product added to cart successfully from marketplace');
                // Could add a success notification here
            } else {
                setError('Failed to add item to cart');
            }
        } catch (error) {
            console.error('Error adding item to cart:', error);
            setError('Error adding item to cart');
        }
    };

    const formatPrice = (price: number, currency: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD'
        }).format(price);
    };

    const getPrimaryImage = (images: Array<{ imageUrl?: string; ImageUrl?: string; isPrimary?: boolean; IsPrimary?: boolean }>) => {
        console.log('🖼️ [getPrimaryImage] === IMAGE DEBUG START ===');
        console.log('🖼️ [getPrimaryImage] Images array:', images);
        console.log('🖼️ [getPrimaryImage] Images array length:', images?.length);
        console.log('🖼️ [getPrimaryImage] Images array type:', typeof images, Array.isArray(images));

        if (images && images.length > 0) {
            images.forEach((img, index) => {
                console.log(`🖼️ [getPrimaryImage] Image ${index}:`, {
                    imageUrl: img.imageUrl,
                    ImageUrl: img.ImageUrl,
                    isPrimary: img.isPrimary,
                    IsPrimary: img.IsPrimary,
                    fullObject: img
                });
            });
        }

        // Handle both C# (IsPrimary) and JavaScript (isPrimary) naming conventions
        const primary = images?.find(img => img.isPrimary || img.IsPrimary);
        // Handle both possible property names for imageUrl
        const primaryUrl = primary?.imageUrl || primary?.ImageUrl;
        const fallbackUrl = images?.[0]?.imageUrl || images?.[0]?.ImageUrl;

        console.log('🖼️ [getPrimaryImage] Primary image object:', primary);
        console.log('🖼️ [getPrimaryImage] Primary image URL:', primaryUrl);
        console.log('🖼️ [getPrimaryImage] Fallback image URL:', fallbackUrl);

        // Check for valid URLs (not empty strings)
        const validPrimaryUrl = primaryUrl && primaryUrl.trim() !== '' ? primaryUrl : null;
        const validFallbackUrl = fallbackUrl && fallbackUrl.trim() !== '' ? fallbackUrl : null;

        console.log('🖼️ [getPrimaryImage] Valid primary URL:', validPrimaryUrl);
        console.log('🖼️ [getPrimaryImage] Valid fallback URL:', validFallbackUrl);

        // Use data URL for local placeholder to avoid external requests
        const localPlaceholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0xMjAgODBDMTIwIDkxLjA0NTcgMTI5Ljk1NCA5OCAxNDIgOThDMTU0LjA0NiA5OCAxNjQgOTEuMDQ1NyAxNjQgODBDMTY0IDY4Ljk1NDMgMTU0LjA0NiA2MiAxNDIgNjJDMTI5Ljk1NCA2MiAxMjAgNjguOTU0MyAxMjAgODBaIiBmaWxsPSIjOUU5RTlFIi8+CjxwYXRoIGQ9Ik0xMDAgMTQwTDE4NCAxNDBMMTY0IDExNkwxNDIgMTMwTDEyMCAxMTZMMTAwIDE0MFoiIGZpbGw9IiM5RTlFOUUiLz4KPHR5cGUgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2NjY2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9IjE1MCIgeT0iMTcwIj5QUk9EVUNUIElNQUdFPC90eXBlPgo8L3N2Zz4=';
        const finalUrl = validPrimaryUrl || validFallbackUrl || localPlaceholder;
        console.log('🖼️ [getPrimaryImage] Final selected URL:', finalUrl);

        // Test if the URL is actually reachable (only for real URLs, not placeholders)
        if (finalUrl && !finalUrl.startsWith('data:')) {
            console.log('🌐 [getPrimaryImage] Testing URL accessibility:', finalUrl);
            fetch(finalUrl, { method: 'HEAD' })
                .then(response => {
                    console.log(`🌐 [getPrimaryImage] URL ${finalUrl} status:`, response.status, response.statusText);
                    if (!response.ok) {
                        console.error(`🌐 [getPrimaryImage] URL ${finalUrl} is not accessible!`);
                    }
                })
                .catch(error => {
                    console.error(`🌐 [getPrimaryImage] Failed to reach URL ${finalUrl}:`, error);
                });
        }

        console.log('🖼️ [getPrimaryImage] === IMAGE DEBUG END ===');

        return finalUrl;
    };

    const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
    };

    if (loading && products.length === 0) {
        return (
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <Typography>Loading marketplace...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, position: 'relative' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
                        YaqeenPay Marketplace
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Discover amazing products from verified sellers
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    {isSeller && (
                        <>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<AddIcon />}
                                onClick={() => navigate('/seller/products/new')}
                                sx={{ mr: 1 }}
                            >
                                Add New Product
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={() => navigate('/seller/marketplace')}
                            >
                                Manage My Products
                            </Button>
                        </>
                    )}
                    {!isSeller && cartCount > 0 && (
                        <Button
                            variant="outlined"
                            startIcon={<CartIcon />}
                            onClick={() => navigate('/cart')}
                            sx={{ position: 'relative' }}
                        >
                            View Cart
                            <Badge
                                badgeContent={cartCount}
                                color="primary"
                                sx={{ ml: 1 }}
                            />
                        </Button>
                    )}
                </Box>
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
                        {/* Temporary: Add both native and MUI selects for testing */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 200 }}>

                            {/* MUI Select */}
                            <FormControl sx={{ minWidth: 200 }}>
                                <InputLabel id="marketplace-category-label">Category</InputLabel>
                                <Select
                                    labelId="marketplace-category-label"
                                    value={selectedCategory}
                                    onChange={(e) => {
                                        console.log('MUI Category selected:', e.target.value);
                                        setSelectedCategory(e.target.value);
                                    }}
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
                                    <MenuItem value="">All Categories</MenuItem>
                                    {categoriesLoading ? (
                                        <MenuItem disabled>Loading categories...</MenuItem>
                                    ) : (
                                        [
                                            /* Only render backend categories */
                                            ...categoryService.getFlattenedCategories(categories).map((category: Category) => (
                                                <MenuItem key={category.id} value={category.id}>
                                                    {category.name}
                                                </MenuItem>
                                            )),

                                            /* Show message if no categories loaded */
                                            ...(categories.length === 0 ? [(
                                                <MenuItem key="no-categories" disabled>
                                                    <Typography variant="body2" color="error">
                                                        No categories available
                                                    </Typography>
                                                </MenuItem>
                                            )] : [])
                                        ]
                                    )}
                                </Select>
                            </FormControl>
                        </Box>
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
            {(() => {
                console.log('[MarketplacePage] RENDER - products:', products);
                console.log('[MarketplacePage] RENDER - products.length:', products.length);
                console.log('[MarketplacePage] RENDER - loading:', loading);
                console.log('[MarketplacePage] RENDER - error:', error);
                return null;
            })()}
            {products.length === 0 ? (
                <Card>
                    <CardContent sx={{ textAlign: 'center', py: 8 }}>
                        <StoreIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h5" sx={{ mb: 1 }}>
                            {search || selectedCategory ? "No products found" : "No products available"}
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                            {search || selectedCategory
                                ? "Try adjusting your search criteria or browse all categories."
                                : "Be the first to discover products when sellers start listing them!"}
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: '1fr',
                            sm: 'repeat(2, 1fr)',
                            md: 'repeat(3, 1fr)',
                            lg: 'repeat(4, 1fr)'
                        },
                        gap: 3
                    }}>
                        {Array.isArray(products) && products.map(product => (
                            <Card key={product.id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <CardMedia
                                    component="img"
                                    height="200"
                                    image={getPrimaryImage(product.images)}
                                    alt={product.name}
                                    sx={{
                                        objectFit: 'cover',
                                        cursor: 'pointer',
                                        backgroundColor: '#f5f5f5'
                                    }}
                                    onClick={() => navigate(`/products/${product.id}`)}
                                    onError={(e) => {
                                        console.log('[CardMedia] Image load error for product:', product.name);
                                        const target = e.target as HTMLImageElement;
                                        // Use same local placeholder as getPrimaryImage function
                                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0xMjAgODBDMTIwIDkxLjA0NTcgMTI5Ljk1NCA5OCAxNDIgOThDMTU0LjA0NiA5OCAxNjQgOTEuMDQ1NyAxNjQgODBDMTY0IDY4Ljk1NDMgMTU0LjA0NiA2MiAxNDIgNjJDMTI5Ljk1NCA2MiAxMjAgNjguOTU0MyAxMjAgODBaIiBmaWxsPSIjOUU5RTlFIi8+CjxwYXRoIGQ9Ik0xMDAgMTQwTDE4NCAxNDBMMTY0IDExNkwxNDIgMTMwTDEyMCAxMTZMMTAwIDE0MFoiIGZpbGw9IiM5RTlFOUUiLz4KPHR5cGUgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2NjY2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9IjE1MCIgeT0iMTcwIj5ObyBJbWFnZTwvdHlwZT4KPC9zdmc+';
                                    }}
                                />
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Typography
                                        variant="h6"
                                        component="h3"
                                        sx={{ fontWeight: 'bold', mb: 1, cursor: 'pointer' }}
                                        onClick={() => navigate(`/products/${product.id}`)}
                                    >
                                        {product.name}
                                    </Typography>

                                    {product.seller && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                            By: {product.seller.businessName}
                                        </Typography>
                                    )}

                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        {categoryService.getCategoryName(product.category?.id || product.category?.name || '', categories)}
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
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                                        {!isSeller && (
                                            <>
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    startIcon={<CartIcon />}
                                                    onClick={() => handleAddToCart(product)}
                                                    disabled={product.stockQuantity === 0}
                                                >
                                                    Add to Cart
                                                </Button>
                                                {product.isOnSale && <Chip label="Sale" color="error" size="small" />}
                                            </>
                                        )}
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                </>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={handlePageChange}
                        color="primary"
                        size="large"
                    />
                </Box>
            )}

            {/* Floating Cart Button */}
            {!isSeller && cartCount > 0 && (
                <Fab
                    color="primary"
                    sx={{ position: 'fixed', bottom: 20, right: 20 }}
                    onClick={() => navigate('/cart')}
                >
                    <Badge badgeContent={cartCount} color="error">
                        <CartIcon />
                    </Badge>
                </Fab>
            )}

            {/* Floating Add Product Button for Sellers */}
            {isSeller && (
                <Fab
                    color="secondary"
                    sx={{ position: 'fixed', bottom: 20, right: 20 }}
                    onClick={() => navigate('/seller/products/new')}
                    aria-label="Add new product"
                >
                    <AddIcon />
                </Fab>
            )}
        </Box>
    );
};

export default MarketplacePage;