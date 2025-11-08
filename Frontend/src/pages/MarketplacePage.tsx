import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, useMediaQuery } from '@mui/material';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    CardMedia,
    Chip,
    TextField,
    InputAdornment,
    Alert,
    Pagination,
    Fab,
    Badge,
    Stack
} from '@mui/material';
import {
    Search as SearchIcon,
    ShoppingCart as CartIcon,
    Store as StoreIcon,
    Add as AddIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { normalizeImageUrl, placeholderDataUri } from '../utils/image';
import { buildProductPath } from '../utils/slug';

import productService from '../services/productService';
import categoryService, { type Category } from '../services/categoryService';
import cartService from '../services/cartService';
import CategorySelector from '../components/CategorySelector';
import ratingService from '../services/ratingService';
import RatingBadge from '../components/rating/RatingBadge';
import type { RatingStats } from '../types/rating';

import type { ProductDetail } from '../types/product';

// Marketplace Configuration
const PRODUCTS_PER_PAGE = 12; // Number of products to load per page
const SEARCH_MIN_CHARS = 3;   // Minimum characters required for search
const SEARCH_DEBOUNCE_MS = 500; // Debounce delay in milliseconds

const MarketplacePage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [products, setProducts] = useState<ProductDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [sellerRatings, setSellerRatings] = useState<Record<string, RatingStats>>({});
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [cartCount, setCartCount] = useState(0);
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // Check if user is a seller
    const isSeller = user?.roles?.some((role: string) => role.toLowerCase() === 'seller');

    // Load seller ratings when products change
    useEffect(() => {
        const loadSellerRatings = async () => {
            const sellerIds = [...new Set(products.map(p => p.seller?.id).filter(Boolean))];
            const ratingsMap: Record<string, RatingStats> = {};

            await Promise.all(
                sellerIds.map(async (sellerId) => {
                    if (sellerId) {
                        try {
                            const stats = await ratingService.getRatingStats(sellerId);
                            ratingsMap[sellerId] = stats;
                        } catch (error) {
                            console.error(`Failed to load ratings for seller ${sellerId}:`, error);
                        }
                    }
                })
            );

            setSellerRatings(ratingsMap);
        };

        if (products.length > 0) {
            loadSellerRatings();
        }
    }, [products]);

    // Load categories on mount
    useEffect(() => {
        const loadCategories = async () => {
            try {
                setCategoriesLoading(true);

                // Clear cache to ensure fresh data
                categoryService.clearCache();

                const fetchedCategories = await categoryService.getCategories();
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
        // Debounce search: only search after user stops typing for 500ms
        // and only if search term is empty or at least 3 characters
        const shouldSearch = search === '' || search.length >= SEARCH_MIN_CHARS;

        if (!shouldSearch) {
            // Don't search if less than 3 characters (but not empty)
            // Don't update loading state to prevent unnecessary re-renders
            return;
        }

        const timeoutId = setTimeout(() => {
            fetchProducts();
            if (!isSeller) {
                fetchCartCount();
            }
        }, SEARCH_DEBOUNCE_MS); // Configurable debounce delay

        return () => clearTimeout(timeoutId);
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

    // Add structured data when products change
    useEffect(() => {
        if (products.length === 0) return;

        // Create canonical URL
        const href = window.location.href;
        document.querySelector('link[rel="canonical"]')?.remove();
        const linkEl = document.createElement('link');
        linkEl.rel = 'canonical';
        linkEl.href = href;
        document.head.appendChild(linkEl);

        // JSON-LD structured data for ItemList
        const itemListSchema = {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: 'YaqeenPay Marketplace Products',
            description: 'Browse and purchase products from verified sellers on YaqeenPay marketplace',
            url: href,
            numberOfItems: products.length,
            itemListElement: products.slice(0, 10).map((product, index) => ({
                '@type': 'Product',
                position: index + 1,
                name: product.name,
                description: product.description,
                image: product.images?.map(img => img.imageUrl || img.ImageUrl).filter(Boolean) || [],
                offers: {
                    '@type': 'Offer',
                    price: product.effectivePrice.toString(),
                    priceCurrency: product.currency,
                    availability: product.isInStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
                    seller: {
                        '@type': 'Organization',
                        name: product.seller?.businessName || 'YaqeenPay Seller'
                    }
                },
                url: `${window.location.origin}/product/${product.id}`
            }))
        };

        const addJsonLd = (data: any) => {
            const script = document.createElement('script');
            script.type = 'application/ld+json';
            script.text = JSON.stringify(data);
            document.head.appendChild(script);
            return script;
        };

        const scriptElement = addJsonLd(itemListSchema);

        return () => {
            // Cleanup
            scriptElement.remove();
        };
    }, [products]);

    const fetchProducts = async () => {
        try {
            setLoading(true);

            const params = {
                page: page,
                pageSize: PRODUCTS_PER_PAGE,
                ...(search && { search }),
                ...(selectedCategory && selectedCategory !== '' && { categoryId: selectedCategory })
            };

            // Use different service method based on user role
            const response = isSeller
                ? await productService.getSellerProducts(params)
                : await productService.getProducts(params);

            // Support both ApiResponse wrapper shape ({ success, data: { items, totalCount } })
            // and unwrapped paginated response ({ items, totalCount }) returned by apiService
            const paginated = (response && (response as any).data) ? (response as any).data : response as any;
            const productsArray = (paginated && paginated.items) ? paginated.items : [];
            const totalCount = (paginated && typeof paginated.totalCount === 'number') ? paginated.totalCount : (Array.isArray(productsArray) ? productsArray.length : 0);

            setProducts(productsArray);
            setTotalCount(totalCount);
            setTotalPages(Math.ceil(totalCount / PRODUCTS_PER_PAGE));
            setError(null);
        } catch (error: any) {

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
        } catch (error) {
            console.error('Error fetching cart count:', error);
        }
    };

    const handleAddToCart = async (product: ProductDetail) => {
        try {

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
                // Could add a success notification here
            } else {
                setError('Failed to add item to cart');
            }
        } catch (error) {
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
        // Handle both C# (IsPrimary) and JavaScript (isPrimary) naming conventions
        const primary = images?.find(img => img.isPrimary || img.IsPrimary);
        // Handle both possible property names for imageUrl
        const primaryUrl = primary?.imageUrl || primary?.ImageUrl;
        const fallbackUrl = images?.[0]?.imageUrl || images?.[0]?.ImageUrl;

        // Check for valid URLs (not empty strings)
        const validPrimaryUrl = primaryUrl && primaryUrl.trim() !== '' ? primaryUrl : null;
        const validFallbackUrl = fallbackUrl && fallbackUrl.trim() !== '' ? fallbackUrl : null;

        // Use centralized image normalization for proper mobile/backend resolution
        const resolvedUrl = validPrimaryUrl || validFallbackUrl;
        return resolvedUrl ? normalizeImageUrl(resolvedUrl) || placeholderDataUri(300, '#F5F5F5') : placeholderDataUri(300, '#F5F5F5');
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
        <Box sx={{ p: { xs: 0.5, sm: 2, md: 3 }, position: 'relative' }}>
            {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', margin: '1' }}>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1, fontSize: { xs: '1rem', sm: '1rem' } }}>
                        Marketplace
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 1 }}>
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
                            helperText={
                                search.length > 0 && search.length < SEARCH_MIN_CHARS
                                    ? `Enter at least ${SEARCH_MIN_CHARS} characters to search`
                                    : ''
                            }
                            sx={{ flex: 1 }}
                        />
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 200 }}>

                            {/* MUI Select */}
                            <CategorySelector
                                categories={categories}
                                value={selectedCategory}
                                onChange={(id) => setSelectedCategory(id)}
                                disabled={categoriesLoading}
                            />
                        </Box>
                    </Box>
                </Box>

            {/* Error Alert */}
            {
                error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )
            }

            {/* Products Grid */}
            {
                (() => {
                    return null;
                })()
            }
            {
                products.length === 0 ? (
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
                        {/* Product Count Display */}
                        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                Showing {((page - 1) * PRODUCTS_PER_PAGE) + 1}-{Math.min(page * PRODUCTS_PER_PAGE, totalCount)} of {totalCount} products
                                {totalPages > 1 && ` (Page ${page} of ${totalPages})`}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {PRODUCTS_PER_PAGE} per page
                            </Typography>
                        </Box>

                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: {
                                xs: 'repeat(2, 1fr)',
                                sm: 'repeat(2, 1fr)',
                                md: 'repeat(3, 1fr)',
                                lg: 'repeat(4, 1fr)'
                            },
                            gap: { xs: 1, sm: 2, md: 3 }
                        }}>
                            {Array.isArray(products) && products.map(product => (
                                <Card key={product.id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <CardMedia
                                        component="img"
                                        height={isMobile ? 120 : 200}
                                        image={getPrimaryImage(product.images)}
                                        alt={product.name}
                                        loading="lazy"
                                        sx={{
                                            objectFit: 'cover',
                                            cursor: 'pointer',
                                            backgroundColor: '#f5f5f5'
                                        }}
                                        onClick={() => navigate(buildProductPath(product.id, product.name))}
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            // Use same local placeholder as getPrimaryImage function
                                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0xMjAgODBDMTIwIDkxLjA0NTcgMTI5Ljk1NCA5OCAxNDIgOThDMTU0LjA0NiA5OCAxNjQgOTEuMDQ1NyAxNjQgODBDMTY0IDY4Ljk1NDMgMTU0LjA0NiA2MiAxNDIgNjJDMTI5Ljk1NCA2MiAxMjAgNjguOTU0MyAxMjAgODBaIiBmaWxsPSIjOUU5RTlFIi8+CjxwYXRoIGQ9Ik0xMDAgMTQwTDE4NCAxNDBMMTY0IDExNkwxNDIgMTMwTDEyMCAxMTZMMTAwIDE0MFoiIGZpbGw9IiM5RTlFOUUiLz4KPHR5cGUgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2NjY2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9IjE1MCIgeT0iMTcwIj5ObyBJbWFnZTwvdHlwZT4KPC9zdmc+';
                                        }}
                                    />
                                    <CardContent sx={{ flexGrow: 1, p: isMobile ? 1 : 2 }}>
                                        <Typography
                                            variant="h6"
                                            component="h3"
                                            sx={{
                                                fontWeight: 'bold',
                                                mb: 1,
                                                cursor: 'pointer',
                                                fontSize: { xs: '0.875rem', sm: '1rem', md: '1.25rem' }
                                            }}
                                            onClick={() => navigate(buildProductPath(product.id, product.name))}
                                        >
                                            {product.name}
                                        </Typography>

                                        {product.seller && (
                                            <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    By: {product.seller.businessName}
                                                </Typography>
                                                {sellerRatings[product.seller.id]?.totalRatings > 0 &&
                                                    <RatingBadge stats={sellerRatings[product.seller.id]} size="small" />
                                                }
                                            </Stack>
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
                                        <Box sx={{ display: 'flex', gap: 1, mt: 'auto', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center' }}>
                                            {!isSeller && (
                                                <>
                                                    <Button
                                                        variant="contained"
                                                        size={isMobile ? 'large' : 'small'}
                                                        startIcon={<CartIcon />}
                                                        onClick={() => handleAddToCart(product)}
                                                        disabled={product.stockQuantity === 0}
                                                        fullWidth={isMobile}
                                                    >
                                                        Add to Cart
                                                    </Button>
                                                    {product.isOnSale && (
                                                        <Chip
                                                            label="Sale"
                                                            color="error"
                                                            size={isMobile ? 'medium' : 'small'}
                                                            sx={isMobile ? { alignSelf: 'flex-start', mt: 1 } : undefined}
                                                        />
                                                    )}
                                                </>
                                            )}
                                        </Box>
                                    </CardContent>
                                </Card>
                            ))}
                        </Box>
                    </>
                )
            }

            {/* Pagination */}
            {
                totalPages > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                        <Pagination
                            count={totalPages}
                            page={page}
                            onChange={handlePageChange}
                            color="primary"
                            size="large"
                        />
                    </Box>
                )
            }

            {/* Floating Cart Button */}
            {
                !isSeller && cartCount > 0 && (
                    <Fab
                        color="primary"
                        sx={{ position: 'fixed', bottom: 20, right: 20 }}
                        onClick={() => navigate('/cart')}
                    >
                        <Badge badgeContent={cartCount} color="error">
                            <CartIcon />
                        </Badge>
                    </Fab>
                )
            }

            {/* Floating Add Product Button for Sellers */}
            {
                isSeller && (
                    <Fab
                        color="secondary"
                        sx={{ position: 'fixed', bottom: 20, right: 20 }}
                        onClick={() => navigate('/seller/products/new')}
                        aria-label="Add new product"
                    >
                        <AddIcon />
                    </Fab>
                )
            }
        </Box >
    );
};

export default MarketplacePage;