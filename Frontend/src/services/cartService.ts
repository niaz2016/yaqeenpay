// Cart service for managing shopping cart functionality
// Uses localStorage until backend cart API is implemented

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  price: number;
  currency: string;
  quantity: number;
  maxQuantity: number;
  sku: string;
  sellerId?: string;
  sellerName?: string;
  sellerPhoneNumber?: string;
  addedAt: string;
}

export interface CartSummary {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  currency: string;
}

class CartService {
  private readonly CART_KEY = 'yaqeenpay_cart';

  // Get all cart items
  getCartItems(): CartItem[] {
    try {
      const cartData = localStorage.getItem(this.CART_KEY);
      if (!cartData) return [];
      
      const items = JSON.parse(cartData) as CartItem[];
      return items;
    } catch (error) {
      return [];
    }
  }

  // Add item to cart
  addToCart(product: {
    id: string;
    name: string;
    price: number;
    currency: string;
    stockQuantity: number;
    sku: string;
    images?: Array<{ imageUrl?: string; ImageUrl?: string; isPrimary?: boolean; IsPrimary?: boolean }>;
    seller?: { id: string; businessName: string; phoneNumber?: string };
  }, quantity: number = 1): boolean {
    try {
      const items = this.getCartItems();
      
      // Check if item already exists in cart
      const existingItemIndex = items.findIndex(item => item.productId === product.id);
      
      if (existingItemIndex >= 0) {
        // Update quantity for existing item
        const existingItem = items[existingItemIndex];
        const newQuantity = existingItem.quantity + quantity;
        
        // Check if new quantity exceeds stock
        if (newQuantity > product.stockQuantity) {
          console.warn('[CartService] Cannot add more items - exceeds stock quantity');
          return false;
        }
        
        items[existingItemIndex].quantity = newQuantity;
      } else {
        // Add new item to cart
        const primaryImage = product.images?.find(img => img.isPrimary || img.IsPrimary);
        const imageUrl = primaryImage?.imageUrl || primaryImage?.ImageUrl || product.images?.[0]?.imageUrl || product.images?.[0]?.ImageUrl;
        const cartItem: CartItem = {
          id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          productId: product.id,
          productName: product.name,
          productImage: imageUrl,
          price: product.price,
          currency: product.currency,
          quantity: quantity,
          maxQuantity: product.stockQuantity,
          sku: product.sku,
          sellerId: product.seller?.id,
          sellerName: product.seller?.businessName,
          sellerPhoneNumber: product.seller?.phoneNumber,
          addedAt: new Date().toISOString()
        };
        
        items.push(cartItem);
      }
      
      // Save updated cart
      localStorage.setItem(this.CART_KEY, JSON.stringify(items));
      
      // Dispatch cart update event for UI components to listen
      window.dispatchEvent(new CustomEvent('cartUpdated', { 
        detail: { totalItems: this.getTotalItems() } 
      }));
      
      return true;
    } catch (error) {
      console.error('[CartService] Error adding to cart:', error);
      return false;
    }
  }

  // Remove item from cart
  removeFromCart(cartItemId: string): boolean {
    try {
      const items = this.getCartItems();
      const updatedItems = items.filter(item => item.id !== cartItemId);
      
      localStorage.setItem(this.CART_KEY, JSON.stringify(updatedItems));
      
      // Dispatch cart update event
      window.dispatchEvent(new CustomEvent('cartUpdated', { 
        detail: { totalItems: this.getTotalItems() } 
      }));
      
      return true;
    } catch (error) {
      console.error('[CartService] Error removing from cart:', error);
      return false;
    }
  }

  // Update item quantity
  updateQuantity(cartItemId: string, newQuantity: number): boolean {
    try {
      if (newQuantity <= 0) {
        return this.removeFromCart(cartItemId);
      }
      
      const items = this.getCartItems();
      const itemIndex = items.findIndex(item => item.id === cartItemId);
      
      if (itemIndex >= 0) {
        // Check if new quantity exceeds max quantity
        if (newQuantity > items[itemIndex].maxQuantity) {
          console.warn('[CartService] Cannot update quantity - exceeds max quantity');
          return false;
        }
        
        items[itemIndex].quantity = newQuantity;
        localStorage.setItem(this.CART_KEY, JSON.stringify(items));
        
        // Dispatch cart update event
        window.dispatchEvent(new CustomEvent('cartUpdated', { 
          detail: { totalItems: this.getTotalItems() } 
        }));
        return true;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }

  // Clear entire cart
  clearCart(): void {
    try {
      localStorage.removeItem(this.CART_KEY);
      
      // Dispatch cart update event
      window.dispatchEvent(new CustomEvent('cartUpdated', { 
        detail: { totalItems: 0 } 
      }));
      
    } catch (error) {
      console.error('[CartService] Error clearing cart:', error);
    }
  }

  // Get cart summary
  getCartSummary(): CartSummary {
    const items = this.getCartItems();
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Everyone uses PKR - single currency system
    const currency = 'PKR';
    
    return {
      items,
      totalItems,
      totalAmount,
      currency
    };
  }

  // Get total number of items in cart
  getTotalItems(): number {
    const items = this.getCartItems();
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }

  // Check if product is in cart
  isInCart(productId: string): boolean {
    const items = this.getCartItems();
    return items.some(item => item.productId === productId);
  }

  // Get quantity of specific product in cart
  getProductQuantity(productId: string): number {
    const items = this.getCartItems();
    const item = items.find(item => item.productId === productId);
    return item ? item.quantity : 0;
  }
}

// Export singleton instance
const cartService = new CartService();
export default cartService;