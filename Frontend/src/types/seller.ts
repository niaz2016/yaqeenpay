// src/types/seller.ts
export interface BusinessProfile {
  id: string;
  businessName: string;
  businessType: string;
  businessCategory: string;
  description: string;
  website?: string;
  phoneNumber: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  taxId?: string;
  verificationStatus: SellerVerificationStatus;
  verifiedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface CreateBusinessProfileRequest {
  businessName: string;
  businessType: string;
  businessCategory: string;
  description: string;
  website?: string;
  phoneNumber: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  taxId?: string;
}

export interface SellerRegistrationRequest {
  businessProfile: CreateBusinessProfileRequest;
  kycDocuments: KycDocumentUpload[];
}

export interface KycDocumentUpload {
  documentType: KycDocumentType;
  file: File;
}

export interface KycDocument {
  id: string;
  documentType: KycDocumentType;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  status: KycDocumentStatus;
  rejectionReason?: string;
  downloadUrl?: string;
}

export const SellerVerificationStatus = {
  Pending: 'Pending',
  Verified: 'Verified',
  Rejected: 'Rejected'
} as const;

export type SellerVerificationStatus = typeof SellerVerificationStatus[keyof typeof SellerVerificationStatus];

export const KycDocumentType = {
  CNIC: 'CNIC',
  BusinessRegistration: 'BusinessRegistration',
  TaxCertificate: 'TaxCertificate',
  UtilityBill: 'UtilityBill',
  BankStatement: 'BankStatement',
  AddressProof: 'AddressProof',
  IdentityPhoto: 'IdentityPhoto',
  Other: 'Other'
} as const;

export type KycDocumentType = typeof KycDocumentType[keyof typeof KycDocumentType];

export const KycDocumentStatus = {
  Pending: 'Pending',
  Approved: 'Approved',
  Rejected: 'Rejected'
} as const;

export type KycDocumentStatus = typeof KycDocumentStatus[keyof typeof KycDocumentStatus];

export interface SellerRegistrationResponse {
  Success: boolean;
  Message: string;
  BusinessProfileId?: string;
  UserId?: string;
  Status?: SellerVerificationStatus;
  Roles?: string[];
}

export interface SellerOrder {
  id: string;
  orderNumber: string;
  amount: number;
  currency: string;
  description: string;
  status: string;
  buyerName: string;
  buyerEmail: string;
  createdAt: string;
  updatedAt: string;
  shippedDate?: string;
  deliveredDate?: string;
  trackingNumber?: string;
  shippingAddress?: string;
  canShip: boolean;
  canMarkDelivered: boolean;
  canUpdateShipping: boolean;
  canDispute: boolean;
}

export interface ShippingInfo {
  trackingNumber: string;
  carrier: string;
  shippingMethod: string;
  estimatedDelivery?: string;
  notes?: string;
}

export interface SellerAnalytics {
  totalSales: number;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  averageOrderValue: number;
  completionRate: number;
  revenue: number;
  thisMonthSales: number;
  lastMonthSales: number;
  topSellingCategories: Array<{
    category: string;
    count: number;
    revenue: number;
  }>;
  // Aggregated product view metrics (optional) — populated for sellers
  productViews?: number;
  productUniqueVisitors?: number;
}

export interface WithdrawalRequest {
  amount: number;
  paymentMethod: string;
  bankDetails?: {
    accountNumber: string;
    routingNumber: string;
    bankName: string;
    accountHolderName: string;
  };
  notes?: string;
}

export interface Withdrawal {
  id: string;
  sellerId: string;
  sellerName?: string;
  amount: number;
  currency: string;
  channel: 'JazzCash' | 'Easypaisa' | 'BankTransfer';
  channelReference?: string;
  reference: string; // User-friendly reference like WDR-xxxxx
  // Allow common status strings including Pending/Completed for easier frontend mapping
  status: 'Initiated' | 'PendingProvider' | 'Settled' | 'Failed' | 'Reversed' | 'Pending' | 'Completed' | 'Rejected';
  requestedAt: string;
  settledAt?: string;
  failedAt?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
  // Legacy properties for compatibility
  paymentMethod?: string;
  processedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  transactionId?: string;
  // optional proof/attachments/notes that seller may attach when requesting withdrawal
  proofUrl?: string;
  attachments?: { url: string; name?: string }[];
  notes?: string;
  description?: string;
}

export const WithdrawalStatus = {
  Pending: 'Pending',
  Processing: 'Processing',
  Completed: 'Completed',
  Rejected: 'Rejected'
} as const;

export type WithdrawalStatus = typeof WithdrawalStatus[keyof typeof WithdrawalStatus];

export interface SellerOrdersFilters {
  status?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface PaginatedSellerOrders {
  items: SellerOrder[];
  totalCount: number;
  pageIndex: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}