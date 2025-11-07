import { useState, useEffect } from 'react';
import type { ProductDetail } from '../types/product';
import productService from '../services/productService';

const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes
const RECENTLY_VIEWED_MAX = 10;

interface CachedProduct extends ProductDetail {
  timestamp: number;
}

interface ProductCache {
  [key: string]: CachedProduct;
}

const cache: ProductCache = {};
let recentlyViewed: string[] = [];

const updateRecentlyViewed = (id: string) => {
  recentlyViewed = [
    id,
    ...recentlyViewed.filter(existingId => existingId !== id)
  ].slice(0, RECENTLY_VIEWED_MAX);
};

export const useProductCache = (productId: string | undefined) => {
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check cache first
        const cached = cache[productId];
        if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
          setProduct(cached);
          setLoading(false);
          updateRecentlyViewed(productId);
          return;
        }

        // Fetch via productService which handles ApiResponse unwrapping and auth
        const fetchedProduct = await productService.getProduct(productId);

        // Normalize and cache
        const productWithTimestamp: CachedProduct = { ...fetchedProduct, timestamp: Date.now() };
        cache[productId] = productWithTimestamp;
        updateRecentlyViewed(productId);
        setProduct(fetchedProduct);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch product');
        console.error('Error fetching product:', err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  return { product, loading, error };
};

export const getRecentlyViewed = (): string[] => [...recentlyViewed];

export const clearProductCache = (): void => {
  Object.keys(cache).forEach(key => delete cache[key]);
  recentlyViewed = [];
};

export const invalidateProductCache = (productId: string): void => {
  delete cache[productId];
};

export const invalidateAllProductCache = (): void => {
  Object.keys(cache).forEach(key => delete cache[key]);
};