// src/types/order.ts
export type OrderStatus =
  | 'pending-payment'
  | 'payment-confirmed'
  | 'awaiting-shipment'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'rejected'
  | 'disputed'
  | 'cancelled';

export interface OrderItem {
  id?: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number; // in minor units or decimal depending on backend; assume decimal for UI
}

export interface ShipmentInfo {
  courier?: string;
  trackingNumber?: string;
  shippedAt?: string; // ISO
  deliveredAt?: string; // ISO
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface Order {
  id: string;
  code?: string; // human-readable code
  sellerId: string;
  sellerName?: string;
  buyerId: string;
  amount: number;
  currency: string;
  description?: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt?: string;
  items?: OrderItem[];
  shipment?: ShipmentInfo;
}

export interface CreateOrderPayload {
  sellerId: string;
  amount: number;
  currency: string;
  description?: string;
  items?: OrderItem[];
  // optional shipping
  shipment?: Partial<ShipmentInfo>;
}

export interface AcceptRejectPayload {
  orderId: string;
  decision: 'accept' | 'reject';
  rejectionReason?: string;
  evidenceUrls?: string[]; // future file upload integration
}
