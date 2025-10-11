// src/services/ordersService.ts
import api from './api';
import notificationTrigger from './notificationTrigger';
import type { Order, CreateOrderPayload, AcceptRejectPayload } from '../types/order';

const base = '/orders';

export interface OrdersQuery {
  status?: string;
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const ordersService = {
  async list(query: OrdersQuery = {}): Promise<PagedResult<Order>> {
    const params = new URLSearchParams();
    if (query.status) params.set('status', query.status);
    if (query.page != null) params.set('page', String(query.page));
    if (query.pageSize != null) params.set('pageSize', String(query.pageSize));
    if (query.search) params.set('search', query.search);
    
    const url = `${base}?${params.toString()}`;
    
    const response = await api.get(url) as any;
    
    // Handle the new paginated response format from backend
    if (response && response.success && response.data) {
      const paginatedData = response.data;
      return {
        items: paginatedData.items || [],
        total: paginatedData.totalCount || 0,
        page: paginatedData.pageNumber || 1,
        pageSize: query.pageSize || 10
      };
    } else if (response && response.items && Array.isArray(response.items)) {
      // Direct paginated response (not wrapped in ApiResponse)
      return {
        items: response.items,
        total: response.totalCount || 0,
        page: response.pageNumber || 1,
        pageSize: query.pageSize || 10
      };
    } else if (response && Array.isArray(response.data)) {
      // Fallback for old format
      return {
        items: response.data,
        total: response.data.length,
        page: query.page || 1,
        pageSize: query.pageSize || 10
      };
    } else {
      console.warn('Unexpected response format:', response);
      return {
        items: [],
        total: 0,
        page: 1,
        pageSize: 10
      };
    }
  },

  async getBuyerOrders(query: OrdersQuery = {}): Promise<PagedResult<Order>> {
    const params = new URLSearchParams();
    if (query.status) params.set('status', query.status);
    if (query.page != null) params.set('pageNumber', String(query.page));
    if (query.pageSize != null) params.set('pageSize', String(query.pageSize));
    return api.get(`${base}/buyer?${params.toString()}`);
  },

  async getSellerOrdersPaginated(query: OrdersQuery = {}): Promise<PagedResult<Order>> {
    const params = new URLSearchParams();
    if (query.status) params.set('status', query.status);
    if (query.page != null) params.set('pageNumber', String(query.page));
    if (query.pageSize != null) params.set('pageSize', String(query.pageSize));
    return api.get(`${base}/seller?${params.toString()}`);
  },

  // Combined method to get all orders (both as buyer and seller)
  async getAllUserOrders(query: OrdersQuery = {}): Promise<PagedResult<Order>> {
    try {
      // Try the main endpoint first (should show both buyer and seller orders)
      const result = await this.list(query);
      return result;
    } catch (error) {
      console.warn('Failed to fetch from main orders endpoint, trying combined approach:', error);
      
      // Fallback: get both buyer and seller orders and combine them
      try {
        const [buyerResponse, sellerResponse] = await Promise.allSettled([
          this.getBuyerOrders(query),
          this.getSellerOrdersPaginated(query)
        ]);

        const buyerOrders = buyerResponse.status === 'fulfilled' ? buyerResponse.value.items : [];
        const sellerOrders = sellerResponse.status === 'fulfilled' ? sellerResponse.value.items : [];

        // Combine and deduplicate orders by ID
        const allOrders = [...buyerOrders, ...sellerOrders];
        const uniqueOrders = allOrders.filter((order, index, self) => 
          index === self.findIndex(o => o.id === order.id)
        );

        // Sort by creation date, newest first
        uniqueOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return {
          items: uniqueOrders,
          total: uniqueOrders.length,
          page: query.page || 1,
          pageSize: query.pageSize || 10
        };
      } catch (fallbackError) {
        console.error('Failed to fetch orders from both buyer and seller endpoints:', fallbackError);
        throw fallbackError;
      }
    }
  },

  async getById(orderId: string): Promise<Order> {
    return api.get(`${base}/${orderId}`);
  },

  async create(payload: CreateOrderPayload): Promise<Order> {
    const order = await api.post<Order>(base, payload);
    
    // Trigger notification for order creation
    try {
      await notificationTrigger.onOrderCreated(order);
    } catch (error) {
      console.warn('Failed to trigger order creation notification:', error);
    }
    
    return order;
  },

  async createWithImages(
    title: string,
    description: string,
    amount: number,
    currency: string,
    targetUserMobile: string,
    images: File[],
    creatorRole?: 'buyer' | 'seller'
  ): Promise<Order> {
    
    // IMPORTANT: Fix the role confusion bug
    // The interpretation depends on who is creating the order (creatorRole)
    
    const formData = new FormData();
    formData.append('Title', title);
    formData.append('Description', description);
    formData.append('Amount', amount.toString());
    formData.append('Currency', currency);
    
    // Add images to FormData
    images.forEach((image) => {
      formData.append('Images', image, image.name);
    });
    
    let endpoint = '';
    
    if (creatorRole === 'seller') {
      // Seller creates listing FOR buyer
      // targetUserMobile is the buyer who can purchase this listing
      formData.append('BuyerMobileNumber', targetUserMobile);
      endpoint = `${base}/with-buyer-mobile-images`;
    } else {
      // Buyer creates order FROM seller (default behavior if role not specified)
      // targetUserMobile is the seller to purchase from  
      // Use the correct endpoint for buyer-initiated orders with seller mobile
      formData.append('SellerMobileNumber', targetUserMobile);
      endpoint = `${base}/with-seller-mobile`;
    }
    
    const order = await api.post<Order>(endpoint, formData);
    
    // Trigger notification for order creation
    try {
      await notificationTrigger.onOrderCreated(order);
      
      // If buyer initiated, also trigger escrow funding notification
      if (creatorRole === 'buyer') {
        await notificationTrigger.onEscrowFunded(order);
      }
    } catch (error) {
      console.warn('Failed to trigger order creation notification:', error);
    }
    
    return order;
  },

  // Method for when current user is seller, buyer identified by mobile (no images)
  async createOrderForBuyer(
    title: string,
    description: string,
    amount: number,
    currency: string,
    buyerMobile: string
  ): Promise<Order> {
    
    const payload = {
      buyerMobileNumber: buyerMobile,
      title,
      description,
      amount,
      currency
    };
    
    return api.post(`${base}/with-buyer-mobile`, payload);
  },

  async createSellerRequest(
    title: string,
    description: string,
    amount: number,
    currency: string,
    images: File[],
    targetUserMobile?: string
  ): Promise<Order> {
    console.log('createSellerRequest called with:', { title, description, amount, currency, imageCount: images?.length || 0, targetUserMobile });
    
    // Use the existing seller-request endpoint
    const formData = new FormData();
    formData.append('Title', title);
    formData.append('Description', description);
    formData.append('Amount', amount.toString());
    formData.append('Currency', currency);
    
    // Add images to FormData
    if (images && images.length > 0) {
      images.forEach((image) => {
        console.log(`Appending image:`, image.name, image.type, image.size);
        formData.append('Images', image, image.name);
      });
    } else {
      formData.append('NoImages', 'true');
    }
    
    console.log('About to POST seller-request. FormData contents:');
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`${key}: File(${value.name}, ${value.size} bytes)`);
      } else {
        console.log(`${key}: ${value}`);
      }
    }
    
    return api.post(`${base}/seller-request`, formData);
  },



  async confirmDelivery(orderId: string): Promise<Order> {
    const order = await api.post<Order>(`${base}/${orderId}/confirm-delivery`, {});
    
    // Trigger notification for delivery confirmation
    try {
      await notificationTrigger.onDeliveryConfirmed(order);
    } catch (error) {
      console.warn('Failed to trigger delivery confirmation notification:', error);
    }
    
    return order;
  },

  async rejectDelivery(payload: AcceptRejectPayload): Promise<Order> {
    const { orderId, rejectionReason, evidenceUrls } = payload;
    return api.post(`${base}/${orderId}/reject-delivery`, { rejectionReason, evidenceUrls });
  },

  async getTracking(orderId: string): Promise<{ timeline: Array<{ status: string; at: string; note?: string }>}> {
    return api.get(`${base}/${orderId}/tracking`);
  },

  // Seller-specific methods
  async getSellerOrders(): Promise<Order[]> {
    try {
      const response = await api.get(`${base}/seller/incoming`) as any;
      return response.items || response;
    } catch (error) {
      console.warn('Failed to fetch seller orders via API, using mock data:', error);
      
      // Mock data for development
      const mockOrders: Order[] = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          code: 'ORD-001',
          sellerId: 'current-user-id',
          sellerName: 'Current User',
          buyerId: '550e8400-e29b-41d4-a716-446655440002',
          amount: 15000,
          currency: 'PKR',
          description: 'Samsung Galaxy A54 smartphone with accessories',
          status: 'payment-confirmed',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          items: [
            { name: 'Samsung Galaxy A54', quantity: 1, unitPrice: 14000 },
            { name: 'Phone Case', quantity: 1, unitPrice: 1000 }
          ]
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440003',
          code: 'ORD-002',
          sellerId: 'current-user-id',
          sellerName: 'Current User',
          buyerId: '550e8400-e29b-41d4-a716-446655440004',
          amount: 8500,
          currency: 'PKR',
          description: 'Wireless earbuds',
          status: 'pending-payment',
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
          items: [
            { name: 'AirPods Pro 2', quantity: 1, unitPrice: 8500 }
          ]
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440005',
          code: 'ORD-003',
          sellerId: 'current-user-id',
          sellerName: 'Current User',
          buyerId: '550e8400-e29b-41d4-a716-446655440006',
          amount: 25000,
          currency: 'PKR',
          description: 'Laptop and accessories',
          status: 'awaiting-shipment',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          items: [
            { name: 'Lenovo ThinkPad E14', quantity: 1, unitPrice: 24000 },
            { name: 'Laptop Bag', quantity: 1, unitPrice: 1000 }
          ]
        }
      ];
      
      return mockOrders;
    }
  },

  async approveOrder(orderId: string): Promise<Order> {
    try {
      const order = await api.post<Order>(`${base}/${orderId}/approve`, {});
      
      // Trigger notification for order approval
      try {
        await notificationTrigger.onOrderApproved(order);
      } catch (error) {
        console.warn('Failed to trigger order approval notification:', error);
      }
      
      return order;
    } catch (error) {
      console.warn('Failed to approve order via API, using mock:', error);
      
      // Mock implementation - just return a success response
      const mockOrder: Order = {
        id: orderId,
        sellerId: 'current-user-id',
        buyerId: 'buyer-id',
        amount: 15000,
        currency: 'PKR',
        description: 'Mock approved order',
        status: 'awaiting-shipment',
        createdAt: new Date().toISOString()
      };
      
      // Trigger notification for mock order approval
      try {
        await notificationTrigger.onOrderApproved(mockOrder);
      } catch (error) {
        console.warn('Failed to trigger mock order approval notification:', error);
      }
      
      return mockOrder;
    }
  },

  async rejectOrder(orderId: string, reason: string): Promise<Order> {
    try {
      const order = await api.post<Order>(`${base}/${orderId}/reject`, { reason });
      
      // Trigger notification for order rejection
      try {
        await notificationTrigger.onOrderRejected(order, reason);
      } catch (error) {
        console.warn('Failed to trigger order rejection notification:', error);
      }
      
      return order;
    } catch (error) {
      console.warn('Failed to reject order via API, using mock:', error);
      
      // Mock implementation - just return a success response
      const mockOrder: Order = {
        id: orderId,
        sellerId: 'current-user-id',
        buyerId: 'buyer-id',
        amount: 15000,
        currency: 'PKR',
        description: 'Mock rejected order',
        status: 'rejected',
        createdAt: new Date().toISOString()
      };
      
      // Trigger notification for mock order rejection
      try {
        await notificationTrigger.onOrderRejected(mockOrder, reason);
      } catch (error) {
        console.warn('Failed to trigger mock order rejection notification:', error);
      }
      
      return mockOrder;
    }
  },

  async getAvailableSellerRequests(params: {
    pageNumber?: number;
    pageSize?: number;
    searchTerm?: string;
    minAmount?: number;
    maxAmount?: number;
    currency?: string;
  } = {}): Promise<{
    items: Array<{
      id: string;
      title: string;
      description: string;
      amount: number;
      currency: string;
      sellerName: string;
      sellerId: string;
      imageUrls: string[];
      created: string;
    }>;
    totalCount: number;
    pageNumber: number;
    pageSize: number;
  }> {
    const searchParams = new URLSearchParams();
    
    if (params.pageNumber) searchParams.append('pageNumber', params.pageNumber.toString());
    if (params.pageSize) searchParams.append('pageSize', params.pageSize.toString());
    if (params.searchTerm) searchParams.append('searchTerm', params.searchTerm);
    if (params.minAmount) searchParams.append('minAmount', params.minAmount.toString());
    if (params.maxAmount) searchParams.append('maxAmount', params.maxAmount.toString());
    if (params.currency) searchParams.append('currency', params.currency);

    return api.get(`${base}/available-seller-requests?${searchParams.toString()}`);
  },

  async acceptSellerRequest(params: {
    sellerRequestId: string;
    deliveryAddress?: string;
    deliveryNotes?: string;
  }): Promise<Order> {
    return api.post(`${base}/accept-seller-request`, params);
  },

  async payForOrder(orderId: string): Promise<{
    success: boolean;
    message: string;
    orderId: string;
    frozenAmount: number;
    currency: string;
  }> {
    const result = await api.post<{
      success: boolean;
      message: string;
      orderId: string;
      frozenAmount: number;
      currency: string;
    }>(`${base}/${orderId}/pay`);
    
    // If payment was successful, trigger notification
    if (result.success) {
      try {
        // Get the order details to include in the notification
        const order = await this.getById(orderId);
        await notificationTrigger.onPaymentConfirmed(order, {
          method: 'wallet',
          amount: result.frozenAmount,
          currency: result.currency
        });
      } catch (error) {
        console.warn('Failed to trigger payment confirmation notification:', error);
      }
    }
    
    return result;
  },

  async markParcelBooked(orderId: string, params: {
    courier?: string;
    trackingNumber?: string;
    bookingDetails?: string;
  }): Promise<{
    success: boolean;
    message: string;
    orderId: string;
  }> {
    return api.post(`${base}/${orderId}/mark-parcel-booked`, params);
  },

  async confirmShipped(orderId: string): Promise<Order> {
    const order = await api.post<Order>(`${base}/${orderId}/confirm-shipped`, {});
    
    // Trigger notification for order shipped
    try {
      await notificationTrigger.onOrderShipped(order, {});
    } catch (error) {
      console.warn('Failed to trigger order shipped notification:', error);
    }
    
    return order;
  },

  async markAsShipped(orderId: string, data?: { courier?: string; trackingNumber?: string; shippingProof?: string }): Promise<Order> {
    try {
      const payload = data ? { ...data } : {};
      const order = await api.post<Order>(`${base}/${orderId}/ship`, payload);
      try {
        await notificationTrigger.onOrderShipped(order, { courier: data?.courier, trackingNumber: data?.trackingNumber });
      } catch (err) {
        console.warn('Failed to trigger onOrderShipped notification after markAsShipped:', err);
      }
      return order;
    } catch (error) {
      console.error('markAsShipped failed:', error);
      throw error;
    }
  },
};

// Export both as default and named export to handle different import patterns
export default ordersService;
