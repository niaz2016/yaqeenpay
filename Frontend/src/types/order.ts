// src/types/order.ts
export type OrderStatus =
  | 'Created'
  | 'PaymentPending'
  | 'PaymentConfirmed'
  | 'AwaitingShipment'
  | 'Confirmed'
  | 'Shipped'
  | 'Delivered'
  | 'DeliveredPendingDecision'
  | 'Completed'
  | 'Cancelled'
  | 'Rejected'
  | 'Disputed'
  | 'DisputeResolved'
  // Legacy frontend status names for backwards compatibility
  | 'created'
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
  images?: File[]; // For file uploads during creation
  imageUrls?: string[]; // For displaying uploaded images
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
  sellerBusinessName?: string; // Business name for display
  sellerPhone?: string; // Seller's phone number
  buyerId: string;
  buyerName?: string; // Buyer's name
  buyerPhone?: string; // Buyer's phone number
  amount: number;
  currency: string;
  description?: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt?: string;
  items?: OrderItem[];
  shipment?: ShipmentInfo;
  imageUrls?: string[];
  // Payment-related fields
  paymentDate?: string;
  frozenAmount?: number;
  isAmountFrozen?: boolean;
  // New fields for mobile-based user identification
  targetUserMobile?: string; // Mobile number of the user this order is created for
  creatorRole?: 'buyer' | 'seller'; // Role of the user who created this order
}

export interface CreateOrderPayload {
  sellerId?: string; // Made optional since we might identify by mobile instead
  targetUserMobile: string; // Mobile number of the target user (required)
  amount: number;
  currency: string;
  description?: string;
  items?: OrderItem[];
  // optional shipping
  shipment?: Partial<ShipmentInfo>;
  // New fields for mobile-based targeting
  creatorRole?: 'buyer' | 'seller'; // Role of the user creating the order
}

export interface AcceptRejectPayload {
  orderId: string;
  decision: 'accept' | 'reject';
  rejectionReason?: string;
  evidenceUrls?: string[]; // future file upload integration
}
