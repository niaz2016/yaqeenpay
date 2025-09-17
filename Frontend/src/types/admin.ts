export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  roles: string[];
  kycStatus: string;
  isActive: boolean;
  registrationDate: string;
  lastLoginDate?: string;
  profileCompleteness: number;
}

export interface UserFilter {
  search?: string;
  role?: string;
  kycStatus?: string;
  isActive?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

export interface KycDocument {
  id: string;
  userId: string;
  documentType: string;
  documentNumber: string;
  documentUrl: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  submissionDate: string;
  reviewDate?: string;
  reviewerId?: string;
  rejectionReason?: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface BusinessProfile {
  id: string;
  userId: string;
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
  taxId: string;
  verificationStatus: 'Pending' | 'Approved' | 'Rejected';
  submissionDate: string;
  reviewDate?: string;
  reviewerId?: string;
  rejectionReason?: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  buyer: {
    firstName: string;
    lastName: string;
    email: string;
  };
  seller: {
    firstName: string;
    lastName: string;
    email: string;
  };
  isPriority: boolean;
  daysInCurrentStatus: number;
}

export interface Dispute {
  id: string;
  orderId: string;
  order: {
    orderNumber: string;
    amount: number;
  };
  initiatedBy: string;
  reason: string;
  status: 'Open' | 'UnderReview' | 'Resolved';
  priority: 'Low' | 'Medium' | 'High';
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  description: string;
  evidenceCount: number;
}

export interface SystemConfig {
  transactionFeePercentage: number;
  withdrawalFeeFlat: number;
  minimumOrderAmount: number;
  maximumOrderAmount: number;
  orderTimeoutDays: number;
  emailNotificationsEnabled: boolean;
  smsNotificationsEnabled: boolean;
  maintenanceMode: boolean;
  sellerAutoApproval: boolean;
  kycAutoApproval: boolean;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  pendingKycDocuments: number;
  pendingSellers: number;
  activeOrders: number;
  openDisputes: number;
  totalTransactionVolume: number;
  monthlyGrowthRate: number;
  // Added fields for dashboard cards
  pendingTopUps?: number;
  totalWithdrawals?: number;
  pendingWithdrawals?: number;
}

export interface KycReviewRequest {
  documentId: string;
  status: 'Approved' | 'Rejected';
  rejectionReason?: string;
}

export interface SellerApprovalRequest {
  businessProfileId: string;
  status: 'Approved' | 'Rejected';
  rejectionReason?: string;
}

export interface DisputeResolution {
  disputeId: string;
  resolution: string;
  refundAmount?: number;
  refundToBuyer: boolean;
  notes: string;
}

export interface UserActionRequest {
  userId: string;
  action: 'activate' | 'deactivate' | 'changeRole';
  newRole?: string;
  reason: string;
}