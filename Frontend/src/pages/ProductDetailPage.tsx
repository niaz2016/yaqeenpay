import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useProductCache } from '../hooks/useProductCache';
import { usePageViewTracking } from '../hooks/usePageViewTracking';
import Breadcrumbs from '../components/common/Breadcrumbs';
import ShareMenu from '../components/common/ShareMenu';
import WishlistButton from '../components/product/WishlistButton';
import { useWishlist } from '../context/WishlistContext';
import LazyImage from '../components/common/LazyImage';
import ProductImageModal from '../components/product/ProductImageModal';

import type { ProductImage } from '../types/product';
import {
  Box,
  Typography,
  Button,
  Card,
  Chip,
  Alert,
  CircularProgress,
  useTheme,
  TextField,
  Skeleton,
  Tabs,
  Tab,
  Avatar,
  Rating,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Fab,
  Badge,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Link,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import apiService from '../services/api';
import type { ProductReview } from '../types/product';

import {
  ArrowBack as ArrowBackIcon,
  ShoppingCart as CartIcon,
  Store as StoreIcon,
  CheckCircleOutline as CheckCircleIcon,
  LocalShipping as LocalShippingIcon,
  Security as SecurityIcon,
  SupportAgent as SupportAgentIcon,
  Bolt as BoltIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import cartService from '../services/cartService';
import { normalizeImageUrl, placeholderDataUri } from '../utils/image';
import { createSlug } from '../utils/slug';

const humanizeAttributeKey = (value: string): string => {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(' ')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
    .trim();
};

const truncateText = (text: string, maxLength: number): string => {
  if (!text) return '';
  return text.length <= maxLength ? text : `${text.slice(0, Math.max(0, maxLength - 3))}...`;
};

const ProductDetailPage: React.FC<{}> = () => {
  // Tab state
  const [tabIndex, setTabIndex] = useState(0);
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };
  const { id, slug } = useParams<{ id: string; slug?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const { isInWishlist } = useWishlist();
  const { product, loading, error } = useProductCache(id);
  const canonicalSlug = useMemo(() => createSlug(product?.name || ''), [product?.name]);

  // Track page view
  usePageViewTracking({
    pageType: 'Product',
    productId: product?.id,
    sellerId: product?.seller?.id
  });

  useEffect(() => {
    if (!product || !canonicalSlug) return;
    if (slug === canonicalSlug) return;
    navigate(`/products/${product.id}/${canonicalSlug}`, { replace: true });
  }, [canonicalSlug, navigate, product, slug]);

  const isHdmiProduct = useMemo(() => {
    if (!product) return false;
    const searchable = [product.name, product.category?.name, ...(product.tags ?? [])]
      .filter(Boolean)
      .join(' ');
    return /hdmi/i.test(searchable);
  }, [product]);

  const enhancedAttributes = useMemo(() => {
    if (!product) return [] as Array<{ label: string; value: string }>;
    const basics: Array<{ label: string; value: string }> = [];
    if (product.brand) basics.push({ label: 'Brand', value: product.brand });
    if (product.model) basics.push({ label: 'Model', value: product.model });
    if (product.sku) basics.push({ label: 'SKU', value: product.sku });
    Object.entries(product.attributes || {}).forEach(([key, value]) => {
      if (!value) return;
      basics.push({ label: humanizeAttributeKey(key), value });
    });
    return basics;
  }, [product]);

  const keyPoints = useMemo(() => {
    if (!product) return [] as string[];
    const points = new Set<string>();
    const cableLength = product.attributes?.length || product.attributes?.Length || product.attributes?.lengthInMeters;
    const hdmiVersion = product.attributes?.hdmiVersion || product.attributes?.HdmiVersion;
    const bandwidth = product.attributes?.bandwidth;
    if (isHdmiProduct && hdmiVersion) points.add(`Certified HDMI ${hdmiVersion} for 4K/8K, HDR10+, Dolby Vision, and eARC audio.`);
    if (isHdmiProduct && bandwidth) points.add(`${bandwidth} bandwidth ensures zero lag for PS5, Xbox Series X, and high-refresh PC gaming.`);
    if (isHdmiProduct && cableLength) points.add(`Reliable signal up to ${cableLength} meters with triple-layer shielding.`);
    if (product.brand) points.add(`${product.brand} accessory with local warranty and replacement support in Pakistan.`);
    points.add(`Secure payment protection with escrow by TechTorio - funds held safely until delivery confirmed.`);
    return Array.from(points);
  }, [isHdmiProduct, product]);

  const semanticDescription = useMemo(() => {
    if (!product) return '';
    return keyPoints.slice(0, 3).join(' • ');
  }, [keyPoints, product]);

  // Use FAQs from product data if available, otherwise show empty array
  const faqItems = useMemo(() => {
    if (!product) return [] as Array<{ question: string; answer: string }>;
    return product.faqs || [];
  }, [product]);
  
  // Reviews state
  const [reviews, setReviews] = useState<ProductReview[] | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  // Review eligibility and form state
  const [canReview, setCanReview] = useState<boolean | null>(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [newRating, setNewRating] = useState<number | null>(5);
  const [newComment, setNewComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Cart states
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);

  // Image gallery states
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [modalImageZoom, setModalImageZoom] = useState(1);
  const [modalImagePosition, setModalImagePosition] = useState({ x: 0, y: 0 });
  const [clickTimeout, setClickTimeout] = useState<number | null>(null);
  // Product variant selection
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
  // Selected option values per variant attribute (e.g. { size: 'M', color: 'Red' })
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  const isSeller = user?.roles?.some((role: string) => role.toLowerCase() === 'seller');

  const handleModalImageClick = (e: React.MouseEvent) => {
    e.preventDefault();

    if (clickTimeout) {
      // This is a double-click
      clearTimeout(clickTimeout);
      setClickTimeout(null);
      if (modalImageZoom === 1) {
        // Zoom in to 2x on double click
        setModalImageZoom(2);
      } else {
        // If already zoomed, zoom out to fit window
        setModalImageZoom(1);
        setModalImagePosition({ x: 0, y: 0 });
      }
    } else {
      // This might be a single click, wait to see if double-click follows
      const timeout = window.setTimeout(() => {
        // This is a confirmed single-click
        if (modalImageZoom > 1) {
          // Single click when zoomed - zoom out to fit window
          setModalImageZoom(1);
          setModalImagePosition({ x: 0, y: 0 });
        }
        setClickTimeout(null);
      }, 250); // Wait 250ms for potential double-click

      setClickTimeout(timeout);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalImageZoom > 1) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      setModalImagePosition({
        x: (x - 0.5) * (modalImageZoom - 1) * 100,
        y: (y - 0.5) * (modalImageZoom - 1) * 100
      });
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    // Use selected variant if available
    let itemToAdd = product;
    if (Array.isArray(product.variants) && typeof selectedVariant === 'number' && product.variants[selectedVariant]) {
      itemToAdd = {
        ...product,
        ...product.variants[selectedVariant],
      };
    }

    try {
      setAddingToCart(true);
      setCartError(null);
      const success = cartService.addToCart(itemToAdd, quantity);
      if (success) {
        setAddedToCart(true);
        setQuantity(1);
        // Update cart count
        const cart = cartService.getCartItems();
        setCartCount(cart.length);
        setTimeout(() => {
          setAddedToCart(false);
        }, 3000);
      } else {
        setCartError('Failed to add product to cart. Please check stock availability.');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      setCartError('Error adding product to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  // Whenever selectedOptions change, attempt to find a matching variant index
  useEffect(() => {
    if (!product || !Array.isArray(product.variants) || product.variants.length === 0) {
      setSelectedVariant(null);
      return;
    }

    const attrKeys = Array.from(new Set((product.variants ?? []).flatMap(v => Object.keys(v))))
      .filter((k) => k !== 'price' && k !== 'stockQuantity' && k !== 'sku');

    // If no attribute keys, select first variant by default
    if (attrKeys.length === 0) {
      setSelectedVariant(0);
      return;
    }

    // Find variant that matches all selected options (only if option present for that key)
    const matchIndex = product.variants.findIndex((v) => {
      return attrKeys.every((key) => {
        const want = selectedOptions[key];
        if (!want) return false; // require user selection for each attribute
        const val = v[key];
        // Normalize to string for comparison
        return String(val ?? '') === String(want);
      });
    });

    setSelectedVariant(matchIndex >= 0 ? matchIndex : null);
  }, [selectedOptions, product]);

  useEffect(() => {
    if (product) {
      setQuantity(Math.max(1, product.minOrderQuantity ?? 1));
    }
  }, [product]);

  // Auto-select first variant when variants exist and user hasn't selected options
  useEffect(() => {
    if (!product || !Array.isArray(product.variants) || product.variants.length === 0) return;
    // Only auto-select when there is exactly one variant
    if (product.variants.length !== 1) return;
    if (Object.keys(selectedOptions).length > 0) return; // don't override user's selections

    const first = product.variants[0];
    if (!first) return;

    const attrKeys = Object.keys(first).filter(k => !['price', 'stockQuantity', 'sku', 'id'].includes(k));
    const defaults: Record<string, string> = {};
    attrKeys.forEach(k => {
      const v = (first as any)[k];
      if (v !== undefined && v !== null && String(v) !== '') defaults[k] = String(v);
    });

    if (Object.keys(defaults).length > 0) {
      setSelectedOptions(defaults);
      setSelectedVariant(0);
    }
  }, [product, selectedOptions]);

  // Load initial cart count
  useEffect(() => {
    const cart = cartService.getCartItems();
    setCartCount(cart.length);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (clickTimeout) {
        clearTimeout(clickTimeout);
      }
    };
  }, [clickTimeout]);

  // Add structured data when product loads
  useEffect(() => {
    if (!product) return;

    // Helper function to set or update meta tags
    const setMetaTag = (attrValue: string, content: string, isProperty = false) => {
      const selector = isProperty ? `meta[property="${attrValue}"]` : `meta[name="${attrValue}"]`;
      let tag = document.querySelector(selector) as HTMLMetaElement;
      if (!tag) {
        tag = document.createElement('meta');
        if (isProperty) {
          tag.setAttribute('property', attrValue);
        } else {
          tag.setAttribute('name', attrValue);
        }
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
      return tag;
    };

    // Set product-specific meta tags
    const productTitle = isHdmiProduct
      ? `${product.name} Price in Pakistan | HDMI Cable Online | TechTorio`
      : `${product.name} Price in Pakistan | Buy Online | TechTorio`;
    const rawDescription = product.description
      ? product.description
      : `Buy ${product.name} in Pakistan with secure escrow payment. Latest price Rs ${product.effectivePrice}. ${product.isInStock ? 'In stock now' : 'Order with fast restock alerts'}. Safe online shopping at TechTorio.`;
    const extendedDescription = isHdmiProduct
      ? `${rawDescription} Compatible with 4K TVs, PS5, Xbox Series X, and home theatres.`
      : rawDescription;
    const productDescription = truncateText(extendedDescription, 155);
    const productImage = product.images && product.images.length > 0
      ? (normalizeImageUrl(product.images[0]?.imageUrl || product.images[0]?.ImageUrl || '') || 'https://techtorio.online/escrow-market/logo.svg')
      : 'https://techtorio.online/escrow-market/logo.svg';
    const productUrl = window.location.href;

    // Update document title
    document.title = productTitle;

    // Primary meta tags
    const metaTags = [
      setMetaTag('title', productTitle),
      setMetaTag('description', productDescription),
      setMetaTag('keywords', isHdmiProduct
        ? `${product.name}, hdmi cable price in pakistan, high speed hdmi cable, ${product.category?.name || 'product'} pakistan, online shopping pakistan, ${product.name} specifications`
        : `${product.name}, buy ${product.name} pakistan, ${product.category?.name || 'product'} pakistan, online shopping pakistan, ${product.name} price, ${product.name} specifications`),
      setMetaTag('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'),
      setMetaTag('googlebot', 'index, follow'),

      // Open Graph tags
      setMetaTag('og:type', 'product', true),
      setMetaTag('og:url', productUrl, true),
      setMetaTag('og:title', productTitle, true),
      setMetaTag('og:description', productDescription, true),
      setMetaTag('og:image', productImage, true),
      setMetaTag('og:image:width', '1200', true),
      setMetaTag('og:image:height', '630', true),
      setMetaTag('og:image:alt', product.name, true),
      setMetaTag('og:locale', 'en_PK', true),
      setMetaTag('og:site_name', 'TechTorio', true),
      setMetaTag('product:price:amount', (product.effectivePrice ?? 0).toString(), true),
      setMetaTag('product:price:currency', 'PKR', true),
      setMetaTag('product:availability', product.isInStock ? 'in stock' : 'out of stock', true),
      setMetaTag('product:condition', 'new', true),
      setMetaTag('product:brand', product.seller?.businessName || 'TechTorio', true),
      setMetaTag('product:category', product.category?.name || 'General', true),

      // Twitter Card tags
      setMetaTag('twitter:card', 'summary_large_image', true),
      setMetaTag('twitter:url', productUrl, true),
      setMetaTag('twitter:title', productTitle, true),
      setMetaTag('twitter:description', productDescription, true),
      setMetaTag('twitter:image', productImage, true),
      setMetaTag('twitter:image:alt', product.name, true),
      setMetaTag('twitter:label1', 'Price', true),
      setMetaTag('twitter:data1', `PKR ${product.effectivePrice ?? 0}`, true),
      setMetaTag('twitter:label2', 'Availability', true),
      setMetaTag('twitter:data2', product.isInStock ? 'In Stock' : 'Out of Stock', true),
    ];

    // Create canonical URL
    const href = window.location.href;
    document.querySelector('link[rel="canonical"]')?.remove();
    const linkEl = document.createElement('link');
    linkEl.rel = 'canonical';
    linkEl.href = href;
    document.head.appendChild(linkEl);

    // Remove conflicting static schemas from index.html BEFORE adding product schemas
    const removeConflictingSchemas = () => {
      const staticSchemas = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
      staticSchemas.forEach(script => {
        try {
          const data = JSON.parse(script.textContent || '{}');
          // Remove static BreadcrumbList, FinancialService, and FAQPage schemas that conflict with product data
          if (data['@type'] === 'BreadcrumbList' || data['@type'] === 'FinancialService' || data['@type'] === 'FAQPage') {
            script.remove();
          }
        } catch (e) {
          // Ignore malformed JSON
        }
      });
    };
    removeConflictingSchemas();

    // JSON-LD structured data for Product
    const productId = `${productUrl}#product`;

    const productSchema: any = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      '@id': productId,
      name: product.name,
      description: product.description,
      url: productUrl,
      mainEntityOfPage: productUrl,
      image: (product.images || [])
        .map(img => normalizeImageUrl(img?.imageUrl || img?.ImageUrl || ''))
        .filter(Boolean)
        .map(src => ({
          '@type': 'ImageObject',
          url: src,
          contentUrl: src,
          caption: `${product.name} high speed HDMI cable in Pakistan`,
        })),
      sku: product.sku || product.id,
      gtin: product.attributes?.gtin || product.attributes?.GTIN || product.id,
      mpn: product.attributes?.mpn || product.attributes?.MPN || product.id,
      material: product.attributes?.material || product.attributes?.Material,
      cableType: product.attributes?.type || product.attributes?.Type,
      brand: {
        '@type': 'Brand',
        name: product.brand || product.seller?.businessName || 'TechTorio'
      },
      additionalProperty: Object.entries(product.attributes || {})
        .filter(([key]) => !['gtin', 'GTIN', 'mpn', 'MPN', 'material', 'Material', 'type', 'Type'].includes(key))
        .map(([key, value]) => ({
          '@type': 'PropertyValue',
          name: humanizeAttributeKey(key),
          value,
        })),
      category: product.category?.name || 'General',
      offers: {
        '@type': 'Offer',
        price: (product.effectivePrice ?? 0).toString(),
        priceCurrency: 'PKR',
        availability: product.isInStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        url: productUrl,
        priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        itemCondition: 'https://schema.org/NewCondition',
        seller: {
          '@type': 'Organization',
          name: product.seller?.businessName || 'TechTorio Seller',
          url: 'https://techtorio.online/escrow-market'
        },
        shippingDetails: {
          '@type': 'OfferShippingDetails',
          shippingRate: {
            '@type': 'MonetaryAmount',
            value: '0',
            currency: 'PKR'
          },
          shippingDestination: {
            '@type': 'DefinedRegion',
            addressCountry: 'PK'
          },
          deliveryTime: {
            '@type': 'ShippingDeliveryTime',
            handlingTime: {
              '@type': 'QuantitativeValue',
              minValue: 1,
              maxValue: 2,
              unitCode: 'DAY'
            },
            transitTime: {
              '@type': 'QuantitativeValue',
              minValue: 3,
              maxValue: 7,
              unitCode: 'DAY'
            }
          }
        },
        hasMerchantReturnPolicy: {
          '@type': 'MerchantReturnPolicy',
          applicableCountry: 'PK',
          returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
          merchantReturnDays: 7,
          returnMethod: 'https://schema.org/ReturnByMail',
          returnFees: 'https://schema.org/FreeReturn'
        }
      }
    };

    // Add aggregateRating if reviews exist, otherwise add default rating
    if (product.reviewCount && product.reviewCount > 0 && product.averageRating) {
      productSchema.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: (product.averageRating ?? 0).toFixed(1),
        reviewCount: (product.reviewCount ?? 0).toString(),
        bestRating: '5',
        worstRating: '1'
      };
    } else {
      // Add minimal aggregateRating to satisfy Google's requirements
      productSchema.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: '5',
        reviewCount: '1',
        bestRating: '5',
        worstRating: '1'
      };
    }

    const addJsonLd = (data: any) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(data);
      document.head.appendChild(script);
      return script;
    };

    const scriptElement = addJsonLd(productSchema);

    const faqSchema = faqItems.length > 0 ? {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.map(({ question, answer }) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: answer
        }
      }))
    } : null;
    const faqScript = faqSchema ? addJsonLd(faqSchema) : null;

    // Add BreadcrumbList schema for better SEO
    type BreadcrumbEntry = {
      '@type': 'ListItem';
      name: string;
      item: string;
      position?: number;
    };

    const breadcrumbItems = (
      [
        {
          '@type': 'ListItem',
          name: 'Home',
          item: 'https://techtorio.online/escrow-market/'
        },
        {
          '@type': 'ListItem',
          name: 'Marketplace',
          item: 'https://techtorio.online/escrow-market/marketplace'
        },
        product.category?.name
          ? {
            '@type': 'ListItem',
            name: product.category.name,
            item: `https://techtorio.online/escrow-market/marketplace?category=${product.category.id}`
          }
          : null,
        {
          '@type': 'ListItem',
          name: product.name,
          item: productUrl
        }
      ] as Array<BreadcrumbEntry | null>
    ).filter((entry): entry is BreadcrumbEntry => entry !== null);

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      '@id': `${productUrl}#breadcrumb`,
      itemListElement: breadcrumbItems.map((entry, index) => ({
        ...entry,
        position: index + 1
      }))
    };

    const breadcrumbScript = addJsonLd(breadcrumbSchema);

    // Add WebPage schema for additional context
    const webPageSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: productTitle,
      description: productDescription,
      url: productUrl,
      mainEntity: {
        '@type': 'Product',
        '@id': productId
      },
      breadcrumb: {
        '@id': `${productUrl}#breadcrumb`
      },
      inLanguage: 'en-PK',
      isPartOf: {
        '@type': 'WebSite',
        name: 'TechTorio',
        url: 'https://techtorio.online/escrow-market/'
      },
      speakable: {
        '@type': 'SpeakableSpecification',
        cssSelector: ['.product-intro', '.product-key-points']
      },
      mainContentOfPage: {
        '@type': 'WebPageElement',
        cssSelector: '.product-detail-content'
      }
    };

    const webPageScript = addJsonLd(webPageSchema);

    return () => {
      // Cleanup meta tags and restore defaults
      document.title = 'TechTorio - Secure Escrow Services in Pakistan';

      // Restore default meta tags
      setMetaTag('title', 'TechTorio - Secure Escrow Services in Pakistan | Safe Online Shopping & Payment Protection');
      setMetaTag('description', "TechTorio is Pakistan's trusted escrow service platform providing secure payment protection for online shopping, freelancing, and business transactions. Buy and sell safely with buyer and seller protection, dispute resolution, and secure payment escrow in Pakistan.");
      setMetaTag('og:type', 'website', true);
      setMetaTag('og:title', 'TechTorio - Secure Escrow Services in Pakistan', true);
      setMetaTag('og:description', "Pakistan's trusted escrow service platform for secure online transactions. Buy and sell safely with payment protection, dispute resolution, and buyer-seller protection.", true);

      // Remove product-specific OG tags
      document.querySelector('meta[property="product:price:amount"]')?.remove();
      document.querySelector('meta[property="product:price:currency"]')?.remove();
      document.querySelector('meta[property="product:availability"]')?.remove();

      scriptElement.remove();
      faqScript?.remove();
      breadcrumbScript.remove();
      webPageScript.remove();
      metaTags.forEach(tag => tag?.remove && tag.remove());
    };
  }, [product, faqItems]);

  // Load reviews from API when product is available
  useEffect(() => {
    let mounted = true;
    const loadReviews = async () => {
      if (!product) return;
      setReviewsLoading(true);
      try {
        const resp = await apiService.get<any>(`/products/${product.id}/reviews`);
        if (!mounted) return;
        const items = Array.isArray(resp) ? resp : (resp?.items ?? []);
        setReviews(items as ProductReview[]);
      } catch (err) {
        console.warn('Failed to load reviews for product', product?.id, err);
        if (mounted) setReviews([]);
      } finally {
        if (mounted) setReviewsLoading(false);
      }
    };

    setReviews(null);
    loadReviews();

    // Check review eligibility for the current user (only if authenticated)
    const checkEligibility = async () => {
      if (!product || !user) {
        setCanReview(false);
        return;
      }
      setCheckingEligibility(true);
      try {
        // Backend endpoint expected to return { eligible: true } or boolean
        const resp = await apiService.get<any>(`/orders/eligible-to-review?productId=${product.id}`);
        const eligible = typeof resp === 'boolean' ? resp : (resp?.eligible ?? false);
        if (mounted) setCanReview(Boolean(eligible));
      } catch (err) {
        console.warn('Failed to check review eligibility', err);
        if (mounted) setCanReview(false);
      } finally {
        if (mounted) setCheckingEligibility(false);
      }
    };

    checkEligibility();

    return () => { mounted = false; };
  }, [product]);

  useEffect(() => {
    if (product) {
      setQuantity(Math.max(1, product.minOrderQuantity ?? 1));
    }
  }, [product]);



  const handleQuantityChange = (newValue: number) => {
    if (!product) return;
    const min = product.minOrderQuantity ?? 1;
    const maxOrder = product.maxOrderQuantity ?? 999999;
    const stock = product.stockQuantity ?? 0;
    const max = Math.max(1, Math.min(maxOrder, stock));
    const validQuantity = Math.max(min, Math.min(max, newValue));
    setQuantity(validQuantity);
  };

  if (loading) {
    // Structured skeletons to improve perceived performance while product details load
    return (
      <Box sx={{ display: 'flex', gap: 2, p: { xs: 1, sm: 2, md: 3 } }}>
        <Box sx={{ flex: '0 0 50%', minWidth: 280 }}>
          <Skeleton variant="rectangular" height={360} />
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <Skeleton variant="rectangular" width={64} height={64} />
            <Skeleton variant="rectangular" width={64} height={64} />
            <Skeleton variant="rectangular" width={64} height={64} />
          </Box>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="60%" height={48} />
          <Skeleton variant="text" width="30%" height={36} />
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <Skeleton variant="rectangular" width={88} height={32} />
            <Skeleton variant="rectangular" width={88} height={32} />
          </Box>
          <Skeleton variant="rectangular" height={120} sx={{ mt: 2 }} />
          <Skeleton variant="rectangular" height={40} sx={{ mt: 2, width: 160 }} />
          <Box sx={{ mt: 4 }}>
            <Skeleton variant="text" width="40%" />
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <Skeleton variant="rectangular" width={160} height={200} />
              <Skeleton variant="rectangular" width={160} height={200} />
              <Skeleton variant="rectangular" width={160} height={200} />
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {error}
        </Alert>
      </Box>
    );
  }

  if (!product) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h5" color="text.secondary">
          Product not found
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/marketplace')}
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
        >
          Back to Marketplace
        </Button>
      </Box>
    );
  }

  // Loading state
  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        p: { xs: 1, sm: 2, md: 3 }
      }}>
        <CircularProgress size={60} />
        <Typography sx={{ mt: 2 }}>Loading product details...</Typography>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{
        p: { xs: 1, sm: 2, md: 3 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <Alert severity="error" sx={{ mb: 2, width: '100%', maxWidth: 600 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          onClick={() => navigate('/marketplace')}
          startIcon={<ArrowBackIcon />}
        >
          Back to Marketplace
        </Button>
      </Box>
    );
  }

  // No product found
  if (!product) {
    return (
      <Box sx={{
        p: { xs: 1, sm: 2, md: 3 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <Alert severity="info" sx={{ mb: 2, width: '100%', maxWidth: 600 }}>
          Product not found
        </Alert>
        <Button
          variant="contained"
          onClick={() => navigate('/marketplace')}
          startIcon={<ArrowBackIcon />}
        >
          Back to Marketplace
        </Button>
      </Box>
    );
  }

  return (
    <Box className="product-detail-content" sx={{
      p: { xs: 0, sm: 1, md: 1 },
      width: '100%',
      overflowX: 'hidden',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      {/* Back button and breadcrumbs */}
      <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: { xs: '100%', sm: 680, md: 1200 }, boxSizing: 'border-box', mx: 'auto' }}>
        <Breadcrumbs
          items={[
            { label: 'Marketplace', href: '/marketplace' },
            { label: product.category?.name || 'Products', href: `/marketplace?category=${product.category?.id}` },
            { label: product.name }
          ]}
        />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <WishlistButton
            product={product}
            initialState={isInWishlist(product.id)}
          />
          <ShareMenu
            title={product.name}
            description={semanticDescription || truncateText(product.description || '', 150)}
            image={normalizeImageUrl(product.images?.[0]?.imageUrl || product.images?.[0]?.ImageUrl) || ''}
          />
        </Box>
      </Box>

      {/* Main content grid */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        gap: { xs: 2, md: 4 },
        alignItems: { xs: 'start', md: 'stretch' },
        width: '100%',
        maxWidth: { xs: '100%', sm: 500, md: 1200 },
        mx: '100%',
        boxSizing: 'border-box',
        overflowX: 'hidden'
      }}>
        {/* Image Gallery */}
        <Card sx={{ boxShadow: 0, width: '100%', maxWidth: { xs: '100%', sm: 400, md: 500 }, mx: 'auto', boxSizing: 'border-box', overflowX: 'hidden' }}>
          <Box sx={{ position: 'relative', pt: 0, pb: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <LazyImage
              src={normalizeImageUrl(product.images?.[selectedImageIndex]?.imageUrl || product.images?.[selectedImageIndex]?.ImageUrl) || placeholderDataUri(600)}
              alt={`${product.name} - ${product.images?.[selectedImageIndex]?.altText || product.images?.[selectedImageIndex]?.AltText || `View ${selectedImageIndex + 1}`} - Buy online in Pakistan`}
              lowResSrc={placeholderDataUri(100)}
              aspectRatio={4 / 3}
              style={{
                cursor: 'zoom-in',
                display: 'block',
                margin: '0 auto',
                maxHeight: '260px',
                width: '100%',
                objectFit: 'contain',
                background: '#fff'
              }}
              onClick={() => setImageModalOpen(true)}
            />
            {product.isOnSale && (
              <Chip
                label="SALE"
                color="error"
                size="small"
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16
                }}
              />
            )}
            {/* Thumbnails - moved closer to image */}
            {product.images?.length > 1 && (
              <Box sx={{
                display: 'flex',
                gap: 1,
                mt: 1,
                mb: 0,
                p: 0,
                overflowX: 'auto',
                justifyContent: 'center',
                width: '100%',
                maxWidth: { xs: '100%', sm: 320 },
                mx: 'auto'
              }}>
                {(product.images || []).map((image: ProductImage, index: number) => (
                  <Box
                    key={image.id}
                    onClick={() => setSelectedImageIndex(index)}
                    sx={{
                      width: 48,
                      height: 48,
                      flexShrink: 0,
                      cursor: 'pointer',
                      border: index === selectedImageIndex ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
                      overflow: 'hidden',
                      borderRadius: 1,
                      background: '#fafafa'
                    }}
                  >
                    <img
                      src={normalizeImageUrl(image.imageUrl || image.ImageUrl || '') || placeholderDataUri(60)}
                      alt={`${product.name} - ${image.altText || image.AltText || `Thumbnail ${index + 1}`}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </Box>
                ))}
              </Box>
            )}
          </Box>
          {/* Tabbed interface for details */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2, overflowX: 'auto', WebkitOverflowScrolling: 'touch', px: 1 }}>
            <Tabs
              value={tabIndex}
              onChange={handleTabChange}
              aria-label="product details tabs"
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
            >
              <Tab label="Description" />
              <Tab label="Specifications" />
              <Tab label="Shipping" />
              <Tab label="Reviews" />
            </Tabs>
          </Box>
          {tabIndex === 0 && (
            <Box>
              <Typography variant="body1" sx={{ mb: 3, whiteSpace: 'pre-line' }}>
                {product.description}
              </Typography>
            </Box>
          )}
          {tabIndex === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Product Details
              </Typography>
              <Box component="dl" sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 2, mb: 3 }}>
                {enhancedAttributes.length > 0 ? (
                  enhancedAttributes.map(({ label, value }, index) => (
                    <React.Fragment key={`${label}-${index}`}>
                      <Typography component="dt" color="text.secondary">{label}:</Typography>
                      <Typography component="dd" sx={{ m: 0 }}>{value}</Typography>
                    </React.Fragment>
                  ))
                ) : (
                  <Typography component="dd" sx={{ gridColumn: '1 / -1' }}>
                    No additional specifications provided.
                  </Typography>
                )}
              </Box>

              {/* Additional Backend Fields */}
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>More Product Attributes</Typography>
              <Box component="dl" sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 2, mb: 3 }}>
                {product.weight !== undefined && product.weight !== null && (
                  <><Typography component="dt" color="text.secondary">Weight:</Typography><Typography component="dd" sx={{ m: 0 }}>{product.weight} {product.weightUnit || ''}</Typography></>
                )}
                {product.dimensions && (
                  <><Typography component="dt" color="text.secondary">Dimensions:</Typography><Typography component="dd" sx={{ m: 0 }}>{product.dimensions}</Typography></>
                )}
                {product.minOrderQuantity !== undefined && (
                  <><Typography component="dt" color="text.secondary">Min Order Quantity:</Typography><Typography component="dd" sx={{ m: 0 }}>{product.minOrderQuantity}</Typography></>
                )}
                {product.maxOrderQuantity !== undefined && (
                  <><Typography component="dt" color="text.secondary">Max Order Quantity:</Typography><Typography component="dd" sx={{ m: 0 }}>{product.maxOrderQuantity}</Typography></>
                )}
                {(product.attributes?.material || product.attributes?.Material) && (
                  <><Typography component="dt" color="text.secondary">Material:</Typography><Typography component="dd" sx={{ m: 0 }}>{product.attributes.material || product.attributes.Material}</Typography></>
                )}
                {(product.attributes?.color || product.attributes?.Color) && (
                  <><Typography component="dt" color="text.secondary">Color:</Typography><Typography component="dd" sx={{ m: 0 }}>{product.attributes.color || product.attributes.Color}</Typography></>
                )}
                {(product.attributes?.size || product.attributes?.Size) && (
                  <><Typography component="dt" color="text.secondary">Size:</Typography><Typography component="dd" sx={{ m: 0 }}>{product.attributes.size || product.attributes.Size}</Typography></>
                )}
                {(product.attributes?.allowBackorders || product.attributes?.AllowBackorders) && (
                  <><Typography component="dt" color="text.secondary">Allow Backorders:</Typography><Typography component="dd" sx={{ m: 0 }}>{(product.attributes.allowBackorders || product.attributes.AllowBackorders) === 'true' ? 'Yes' : 'No'}</Typography></>
                )}
                {(product.attributes?.isFeatured || product.attributes?.IsFeatured) && (
                  <><Typography component="dt" color="text.secondary">Featured:</Typography><Typography component="dd" sx={{ m: 0 }}>{(product.attributes.isFeatured || product.attributes.IsFeatured) === 'true' ? 'Yes' : 'No'}</Typography></>
                )}
                {product.tags && Array.isArray(product.tags) && product.tags.length > 0 && (
                  <><Typography component="dt" color="text.secondary">Tags:</Typography><Typography component="dd" sx={{ m: 0 }}>{product.tags.join(', ')}</Typography></>
                )}
                {(product.attributes?.featuredUntil || product.attributes?.FeaturedUntil) && (
                  <><Typography component="dt" color="text.secondary">Featured Until:</Typography><Typography component="dd" sx={{ m: 0 }}>{product.attributes.featuredUntil || product.attributes.FeaturedUntil}</Typography></>
                )}
              </Box>
            </Box>
          )}
          {tabIndex === 2 && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                We deliver nationwide across Pakistan with tracked couriers and secure escrow payment protection.
              </Typography>
              <List sx={{ mb: 3 }}>
                <ListItem>
                  <ListItemIcon sx={{ color: 'primary.main' }}>
                    <LocalShippingIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Delivery Timeline"
                    secondary="Karachi, Lahore, Islamabad: 2-3 working days. Other cities: 3-5 working days. Remote areas: up to 7 days."
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon sx={{ color: 'primary.main' }}>
                    <SecurityIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Protected Payments"
                    secondary="Your payment stays in escrow until you confirm the HDMI cable is received and working."
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon sx={{ color: 'primary.main' }}>
                    <SupportAgentIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Support"
                    secondary="Need expedited delivery or bulk pricing? Chat with our support team before placing your order."
                  />
                </ListItem>
              </List>
            </Box>
          )}
          {tabIndex === 3 && (
            <Box>
              {reviewsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box>
                  {(!reviews || reviews.length === 0) ? (
                    <Typography variant="body2" color="text.secondary">No reviews yet.</Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {reviews.map((r) => (
                        <Card key={r.id} variant="outlined" sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                            <Avatar>{(r.userName && r.userName[0]) || 'U'}</Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="subtitle2">{r.userName}</Typography>
                                <Rating value={r.rating} precision={0.5} readOnly size="small" />
                                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>{new Date(r.createdAt).toLocaleDateString()}</Typography>
                              </Box>
                              <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-line' }}>{r.comment}</Typography>
                              {r.images && r.images.length > 0 && (
                                <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                                  {r.images.map((img, idx) => (
                                    <Box key={idx} sx={{ width: 80, height: 80, overflow: 'hidden', borderRadius: 1 }}>
                                      <img src={normalizeImageUrl(img.imageUrl || img.ImageUrl || '')} alt={`review-${r.id}-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </Box>
                                  ))}
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </Card>
                      ))}
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          )}
          {/* Review submission form - only for authenticated users who are eligible */}
          {tabIndex === 3 && (
            <Box sx={{ mt: 2 }}>
              {user ? (
                checkingEligibility ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><CircularProgress size={20} /> <Typography>Checking review eligibility...</Typography></Box>
                ) : canReview ? (
                  <Card variant="outlined" sx={{ p: 2, mt: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>Write a review</Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Rating value={newRating} onChange={(_, val) => setNewRating(val)} />
                      <Typography variant="body2" color="text.secondary">Your rating</Typography>
                    </Box>
                    <TextField
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      multiline
                      rows={4}
                      fullWidth
                      sx={{ mt: 1 }}
                      placeholder="Share your experience about the product"
                    />
                    {reviewError && <Alert severity="error" sx={{ mt: 1 }}>{reviewError}</Alert>}
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1 }}>
                      <Button variant="outlined" onClick={() => { setNewComment(''); setNewRating(5); }}>Clear</Button>
                      <Button variant="contained" onClick={async () => {
                        if (!product) return;
                        if (!newComment.trim()) { setReviewError('Please enter a comment'); return; }
                        setReviewError(null);
                        setSubmittingReview(true);
                        try {
                          const payload = { rating: newRating, comment: newComment };
                          await apiService.post(`/products/${product.id}/reviews`, payload);
                          // Refresh reviews
                          const resp = await apiService.get<any>(`/products/${product.id}/reviews`);
                          const items = Array.isArray(resp) ? resp : (resp?.items ?? []);
                          setReviews(items as ProductReview[]);
                          setNewComment(''); setNewRating(5);
                        } catch (err: any) {
                          console.error('Failed to submit review', err);
                          setReviewError(err?.message || 'Failed to submit review');
                        } finally {
                          setSubmittingReview(false);
                        }
                      }} disabled={submittingReview}>
                        {submittingReview ? 'Submitting...' : 'Submit Review'}
                      </Button>
                    </Box>
                  </Card>
                ) : (
                  <Alert severity="info" sx={{ mt: 2 }}>You can write a review for this product after you have received it.</Alert>
                )
              ) : (
                <Alert severity="info" sx={{ mt: 2 }}>Please sign in to write a review.</Alert>
              )}
            </Box>
          )}
        </Card>

        {/* Product Details */}
        <Box
          sx={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}
        >
          <Typography variant="h4" component="h1" gutterBottom>
            {product.name}
          </Typography>

          {/* Seller info */}
          {product.seller && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <StoreIcon color="action" />
              <Typography variant="body2" color="text.secondary">
                Sold by: <span>{product.seller.businessName}</span>
              </Typography>
            </Box>
          )}

          {/* Price section */}
          <Box sx={{ mb: 3 }}>
            {(() => {
              // If a variant is selected and has its own price, show that
              const variantPrice = (selectedVariant !== null && Array.isArray(product.variants) && product.variants[selectedVariant] && product.variants[selectedVariant].price) ? product.variants[selectedVariant].price : undefined;
              const displayPrice = variantPrice ?? product.effectivePrice ?? product.price;
              const originalPrice = variantPrice ? undefined : product.price;

              if (product.isOnSale && !variantPrice) {
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h5" color="error">
                      {new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', currencyDisplay: 'code' }).format(displayPrice)}
                    </Typography>
                    <Typography variant="body1" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                      {new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', currencyDisplay: 'code' }).format(originalPrice ?? 0)}
                    </Typography>
                    <Chip label={`${Math.round(product.discountPercentage)}% OFF`} color="error" size="small" />
                  </Box>
                );
              }

              return (
                <Typography variant="h5">
                  {new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', currencyDisplay: 'code' }).format(displayPrice)}
                </Typography>
              );
            })()}
          </Box>

          {semanticDescription && (
            <Typography
              variant="subtitle1"
              color="text.primary"
              className="product-intro"
              sx={{ mb: 3, fontWeight: 500 }}
            >
              {semanticDescription}
            </Typography>
          )}

          {keyPoints.length > 0 && (
            <Card variant="outlined" sx={{ mb: 3, bgcolor: 'background.default' }}>
              <List className="product-key-points" dense>
                {keyPoints.map((point, index) => (
                  <ListItem key={index} sx={{ alignItems: 'flex-start', py: 1 }}>
                    <ListItemIcon sx={{ minWidth: 36, color: 'success.main' }}>
                      <CheckCircleIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primaryTypographyProps={{ variant: 'body2', color: 'text.primary' }}
                      primary={point}
                    />
                  </ListItem>
                ))}
              </List>
            </Card>
          )}

          {/* Product Identifiers - SEO friendly */}
          <Card variant="outlined" sx={{ mb: 3, bgcolor: 'background.default', p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.primary', fontWeight: 600 }}>
              Product Identifiers
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 1.5, rowGap: 1 }}>
              {product.sku && (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>SKU:</Typography>
                  <Typography variant="body2" color="text.primary">{product.sku}</Typography>
                </>
              )}
              {(product.attributes?.gtin || product.attributes?.GTIN) && (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>GTIN:</Typography>
                  <Typography variant="body2" color="text.primary">{product.attributes?.gtin || product.attributes?.GTIN}</Typography>
                </>
              )}
              {(product.attributes?.mpn || product.attributes?.MPN) && (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>MPN:</Typography>
                  <Typography variant="body2" color="text.primary">{product.attributes?.mpn || product.attributes?.MPN}</Typography>
                </>
              )}
              {product.brand && (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Brand:</Typography>
                  <Typography variant="body2" color="text.primary">{product.brand}</Typography>
                </>
              )}
              {product.model && (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Model:</Typography>
                  <Typography variant="body2" color="text.primary">{product.model}</Typography>
                </>
              )}
              {product.category && (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Category:</Typography>
                  <Typography variant="body2" color="text.primary">
                    <Link component={RouterLink} to={`/marketplace?category=${product.category.id}`} underline="hover" color="primary">
                      {product.category.name}
                    </Link>
                  </Typography>
                </>
              )}
              {(product.attributes?.material || product.attributes?.Material) && (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Material:</Typography>
                  <Typography variant="body2" color="text.primary">{product.attributes?.material || product.attributes?.Material}</Typography>
                </>
              )}
              {(product.attributes?.type || product.attributes?.Type) && (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Type:</Typography>
                  <Typography variant="body2" color="text.primary">{product.attributes?.type || product.attributes?.Type}</Typography>
                </>
              )}
            </Box>
          </Card>

          {product.category && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Browse more in{' '}
              <Link component={RouterLink} to={`/marketplace?category=${product.category.id}`} underline="hover" color="primary">
                {product.category.name}
              </Link>{' '}
              or explore related cables and adapters on TechTorio Marketplace.
            </Typography>
          )}

          {/* Stock status */}
          <Box sx={{ mb: 3 }}>
            {product.stockQuantity > 0 ? (
              <Chip
                label={`${product.stockQuantity} in stock`}
                color="success"
                variant="outlined"
                size="small"
              />
            ) : (
              <Chip
                label="Out of stock"
                color="error"
                variant="outlined"
                size="small"
              />
            )}
          </Box>

          {/* Add to cart section */}
          {!isSeller && (
            <Box sx={{ mb: 3 }}>
              {/* Variant selection UI */}
              {Array.isArray(product.variants) && product.variants.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  {/* Determine attribute keys dynamically (exclude price/stock/sku) */}
                  {Array.from(new Set((product.variants ?? []).flatMap(v => Object.keys(v))))
                    .filter(k => k !== 'price' && k !== 'stockQuantity' && k !== 'sku' && k !== 'id')
                    .map((attrKey) => {
                      const values = Array.from(new Set((product.variants ?? []).map(v => String(v[attrKey] ?? '')).filter(Boolean)));
                      if (values.length === 0) return null;
                      return (
                        <FormControl key={attrKey} fullWidth sx={{ mb: 1 }} size="small">
                          <InputLabel>{attrKey.charAt(0).toUpperCase() + attrKey.slice(1)}</InputLabel>
                          <Select
                            label={attrKey.charAt(0).toUpperCase() + attrKey.slice(1)}
                            value={selectedOptions[attrKey] ?? ''}
                            onChange={(e) => setSelectedOptions(prev => ({ ...prev, [attrKey]: String(e.target.value) }))}
                          >
                            <MenuItem value="">Select</MenuItem>
                            {values.map(val => (
                              <MenuItem key={val} value={val}>{val}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      );
                    })}

                  {/* Inform user to complete selection if not matched and show selected variant details */}
                  <Box sx={{ mt: 1 }}>
                    {selectedVariant === null ? (
                      <Typography variant="body2" color="text.secondary">Please select all options to choose a variant.</Typography>
                    ) : (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" color="text.secondary">Selected variant:</Typography>
                        <Typography variant="body2">{product.variants[selectedVariant].sku || (Object.values(product.variants[selectedVariant]).filter(v => v && typeof v === 'string').join(' / '))}</Typography>
                        {product.variants[selectedVariant].price != null && (
                          <Typography variant="body2" color="text.primary" sx={{ ml: 2 }}>
                            {new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(product.variants[selectedVariant].price)}
                          </Typography>
                        )}
                        {product.variants[selectedVariant].stockQuantity != null && (
                          <Chip label={`${product.variants[selectedVariant].stockQuantity} in stock`} size="small" />
                        )}
                      </Stack>
                    )}
                  </Box>
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  type="number"
                  label="Quantity"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value))}
                  InputProps={{
                    inputProps: {
                      min: product.minOrderQuantity || 1,
                      max: Math.min(product.maxOrderQuantity || 999999, product.stockQuantity)
                    }
                  }}
                  sx={{ width: 100 }}
                />
                <Button
                  variant="contained"
                  startIcon={<CartIcon />}
                  onClick={handleAddToCart}
                  disabled={addingToCart || product.stockQuantity === 0 || (Array.isArray(product.variants) && product.variants.length > 0 && selectedVariant === null)}
                  sx={{ flexGrow: 1 }}
                >
                  {addingToCart ? 'Adding...' : 'Add to Cart'}
                </Button>
              </Box>
              {(addedToCart || cartError) && (
                <Alert
                  severity={addedToCart ? "success" : "error"}
                  onClose={() => addedToCart ? setAddedToCart(false) : setCartError(null)}
                >
                  {addedToCart ? "Added to cart successfully!" : cartError}
                </Alert>
              )}
            </Box>
          )}

          <Divider sx={{ my: 3 }} />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
            <Card variant="outlined" sx={{ flex: 1, p: 2, display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
              <LocalShippingIcon color="primary" />
              <Box>
                <Typography variant="subtitle2">Nationwide Delivery</Typography>
                <Typography variant="body2" color="text.secondary">
                  Dispatched from Karachi with 2–5 working day delivery across Pakistan. Same-day dispatch on paid orders before 2PM.
                </Typography>
              </Box>
            </Card>
            <Card variant="outlined" sx={{ flex: 1, p: 2, display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
              <SecurityIcon color="primary" />
              <Box>
                <Typography variant="subtitle2">Escrow Buyer Protection</Typography>
                <Typography variant="body2" color="text.secondary">
                  Pay with confidence. Funds stay protected in escrow until you confirm your HDMI cable is genuine and working.
                </Typography>
              </Box>
            </Card>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
            <Card variant="outlined" sx={{ flex: 1, p: 2, display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
              <BoltIcon color="primary" />
              <Box>
                <Typography variant="subtitle2">
                  {isHdmiProduct ? 'Optimised For 4K/120Hz' : 'Verified Quality Assurance'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {isHdmiProduct
                    ? 'Perfect for PS5, Xbox Series X, Apple TV 4K, and high refresh rate gaming monitors with VRR and ALLM support.'
                    : 'Each order is QC-checked before dispatch to guarantee you receive an authentic, brand-new product as advertised.'}
                </Typography>
              </Box>
            </Card>
            <Card variant="outlined" sx={{ flex: 1, p: 2, display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
              <SupportAgentIcon color="primary" />
              <Box>
                <Typography variant="subtitle2">Local Warranty Support</Typography>
                <Typography variant="body2" color="text.secondary">
                  Need help? Reach our Pakistan-based support team or request a hassle-free replacement within 7 days.
                </Typography>
              </Box>
            </Card>
          </Stack>

          
        </Box>
      </Box>

      {/* FAQ Section */}
      {faqItems.length > 0 && (
        <Box sx={{ width: '100%', maxWidth: { xs: '100%', sm: 680, md: 900 }, mt: 4 }}>
          <Typography variant="h5" sx={{ mb: 1 }}>
            Frequently Asked Questions
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Get answers to common questions about {product.name}.
          </Typography>
          {faqItems.map((item, index) => (
            <Accordion key={index} defaultExpanded={index === 0}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">{item.question}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">{item.answer}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      {/* All Product Data (Advanced/Debug)
      <Accordion sx={{ width: '100%', maxWidth: { xs: '100%', sm: 680, md: 900 }, mt: 4 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">All Product Data (Advanced)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <tbody>
                {Object.entries(product).map(([key, value]) => (
                  <tr key={key} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ fontWeight: 500, color: '#555', padding: '4px 8px', verticalAlign: 'top', width: 180 }}>{key}</td>
                    <td style={{ padding: '4px 8px', color: '#222', wordBreak: 'break-word' }}>
                      {Array.isArray(value) ? (
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace', background: '#fafafa', borderRadius: 4, padding: 4, maxHeight: 200, overflow: 'auto' }}>{JSON.stringify(value, null, 2)}</pre>
                      ) : value && typeof value === 'object' ? (
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace', background: '#fafafa', borderRadius: 4, padding: 4, maxHeight: 200, overflow: 'auto' }}>{JSON.stringify(value, null, 2)}</pre>
                      ) : (value === null || value === undefined ? <span style={{ color: '#aaa' }}>null</span> : value.name || value.toString())}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              This section displays all raw product data received from the backend for transparency and debugging.
            </Typography>
          </Box>
        </AccordionDetails>
      </Accordion> */}

      {/* Image Modal */}
      <ProductImageModal
        open={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        imageUrl={normalizeImageUrl(product.images?.[selectedImageIndex]?.imageUrl || product.images?.[selectedImageIndex]?.ImageUrl) || placeholderDataUri(1200)}
        altText={product.name}
        zoom={modalImageZoom}
        position={modalImagePosition}
        onZoomIn={() => setModalImageZoom(z => Math.min(3, z + 0.5))}
        onZoomOut={() => setModalImageZoom(z => Math.max(1, z - 0.5))}
        onSetZoom={(z) => setModalImageZoom(Math.max(1, Math.min(3, z)))}
        onImageClick={handleModalImageClick}
        onMouseMove={handleMouseMove}
      />

      {/* Floating Cart Button */}
      {!isSeller && cartCount > 0 && (
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}
          onClick={() => navigate('/cart')}
          aria-label={`View cart (${cartCount} items)`}
        >
          <Badge badgeContent={cartCount} color="error">
            <CartIcon />
          </Badge>
        </Fab>
      )}
    </Box>
  );
};

export default ProductDetailPage;