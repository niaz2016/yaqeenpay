// src/types/wallet.ts
export type WalletStatus = 'Active' | 'Suspended' | 'Pending';

export interface WalletSummary {
  balance: number;
  currency: string; // e.g., USD, SAR
  status: WalletStatus;
  updatedAt: string; // ISO
}

export type TransactionType = 'TopUp' | 'Payment' | 'Refund' | 'Withdrawal' | 'Adjustment';

export interface WalletTransaction {
  date: any;
  id: string;
  type: 'Credit' | 'Debit';
  amount: number;
  status: 'Completed' | 'Pending' | 'Failed';
  description?: string;
  createdAt: string;
  transactionReference?: string;
}

export interface TransactionQuery {
  page?: number;
  pageSize?: number;
  sortBy?: keyof WalletTransaction;
  sortDir?: 'asc' | 'desc';
  type?: TransactionType | 'All';
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TopUpRequest {
  amount: number;
  currency?: string;
  channel: 'JazzCash' | 'Easypaisa' | 'BankTransfer' | 'ManualAdjustment';
  // Legacy field for compatibility
  method?: 'Card' | 'BankTransfer' | 'ApplePay' | 'GooglePay' | 'Cash';
}

export interface TopUpResponse {
  success: boolean;
  receiptId: string;
  newBalance: number;
  message?: string;
}

export interface TopUpDto {
  id: string;
  userId: string;
  walletId: string;
  amount: number;
  currency: string;
  channel: string;
  status: string;
  externalReference?: string;
  requestedAt: string;
  confirmedAt?: string;
  failedAt?: string;
  failureReason?: string;
}

export interface WalletAnalyticsPoint {
  date: string; // ISO day
  balance: number;
  credits: number;
  debits: number;
}

export interface WalletAnalytics {
  series: WalletAnalyticsPoint[];
  totals: {
    credits30d: number;
    debits30d: number;
  };
}
