import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ProductDetail } from '../types/product';

interface WishlistContextType {
  items: ProductDetail[];
  addToWishlist: (product: ProductDetail) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const WISHLIST_STORAGE_KEY = 'techtorio_wishlist';

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<ProductDetail[]>([]);

  // Load wishlist from localStorage on mount
  useEffect(() => {
    const savedWishlist = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (savedWishlist) {
      try {
        setItems(JSON.parse(savedWishlist));
      } catch (error) {
        console.error('Failed to parse wishlist:', error);
        localStorage.removeItem(WISHLIST_STORAGE_KEY);
      }
    }
  }, []);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToWishlist = useCallback((product: ProductDetail) => {
    setItems(currentItems => {
      if (!currentItems.some(item => item.id === product.id)) {
        return [...currentItems, product];
      }
      return currentItems;
    });
  }, []);

  const removeFromWishlist = useCallback((productId: string) => {
    setItems(currentItems => currentItems.filter(item => item.id !== productId));
  }, []);

  const isInWishlist = useCallback((productId: string) => {
    return items.some(item => item.id === productId);
  }, [items]);

  const clearWishlist = useCallback(() => {
    setItems([]);
  }, []);

  const value = {
    items,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    clearWishlist,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export default WishlistContext;