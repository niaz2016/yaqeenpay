// src/services/ordersService.ts
import api from './api';
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

const ordersService = {
  async list(query: OrdersQuery = {}): Promise<PagedResult<Order>> {
    const params = new URLSearchParams();
    if (query.status) params.set('status', query.status);
    if (query.page != null) params.set('page', String(query.page));
    if (query.pageSize != null) params.set('pageSize', String(query.pageSize));
    if (query.search) params.set('search', query.search);
    return api.get(`${base}?${params.toString()}`);
  },

  async getById(orderId: string): Promise<Order> {
    return api.get(`${base}/${orderId}`);
  },

  async create(payload: CreateOrderPayload): Promise<Order> {
    return api.post(base, payload);
  },

  async confirmDelivery(orderId: string): Promise<Order> {
    return api.post(`${base}/${orderId}/confirm-delivery`, {});
  },

  async rejectDelivery(payload: AcceptRejectPayload): Promise<Order> {
    const { orderId, rejectionReason, evidenceUrls } = payload;
    return api.post(`${base}/${orderId}/reject-delivery`, { rejectionReason, evidenceUrls });
  },

  async getTracking(orderId: string): Promise<{ timeline: Array<{ status: string; at: string; note?: string }>}> {
    return api.get(`${base}/${orderId}/tracking`);
  },
};

export default ordersService;
