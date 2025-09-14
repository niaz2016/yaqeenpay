// src/services/sellerService.ts
import apiService from './api';
import type {
  BusinessProfile,
  CreateBusinessProfileRequest,
  SellerRegistrationRequest,
  SellerRegistrationResponse,
  KycDocument,
  SellerOrder,
  SellerOrdersFilters,
  PaginatedSellerOrders,
  SellerAnalytics,
  WithdrawalRequest,
  Withdrawal,
  ShippingInfo
} from '../types/seller';

export class SellerService {
  private static instance: SellerService;

  public static getInstance(): SellerService {
    if (!SellerService.instance) {
      SellerService.instance = new SellerService();
    }
    return SellerService.instance;
  }

  // Business Profile Management
  async createBusinessProfile(data: CreateBusinessProfileRequest): Promise<BusinessProfile> {
    return apiService.post<BusinessProfile>('/SellerRegistration/business-profile', data);
  }

  async getBusinessProfile(): Promise<BusinessProfile> {
    return apiService.get<BusinessProfile>('/SellerRegistration/business-profile');
  }

  async updateBusinessProfile(data: Partial<CreateBusinessProfileRequest>): Promise<BusinessProfile> {
    return apiService.put<BusinessProfile>('/SellerRegistration/business-profile', data);
  }

  // Seller Registration
  async applyForSellerRole(data: SellerRegistrationRequest): Promise<SellerRegistrationResponse> {
    console.log('Applying for seller role with data:', {
      businessProfile: data.businessProfile,
      kycDocumentsCount: data.kycDocuments.length
    });

    const formData = new FormData();
    
    // Add business profile data
    Object.entries(data.businessProfile).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
        console.log(`Added business profile field: ${key} = ${value}`);
      }
    });

    // Add KYC documents
    data.kycDocuments.forEach((doc, index) => {
      console.log(`Adding KYC document ${index}:`, {
        documentType: doc.documentType,
        fileName: doc.file.name,
        fileSize: doc.file.size,
        fileType: doc.file.type
      });
      
      formData.append(`kycDocuments[${index}].documentType`, doc.documentType);
      formData.append(`kycDocuments[${index}].file`, doc.file);
    });

    // Log all FormData entries
    console.log('FormData entries:');
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
      } else {
        console.log(`${key}: ${value}`);
      }
    }

    try {
      const response = await apiService.post<SellerRegistrationResponse>('/SellerRegistration/apply', formData);
      console.log('Seller registration response:', response);
      return response;
    } catch (error) {
      console.error('Seller registration error:', error);
      throw error;
    }
  }

  // KYC Document Management
  async uploadKycDocument(documentType: string, file: File): Promise<KycDocument> {
    const formData = new FormData();
    formData.append('documentType', documentType);
    formData.append('file', file);

    return apiService.post<KycDocument>('/SellerRegistration/kyc-document', formData);
  }

  async getKycDocuments(): Promise<KycDocument[]> {
    return apiService.get<KycDocument[]>('/SellerRegistration/kyc-documents');
  }

  async deleteKycDocument(documentId: string): Promise<void> {
    return apiService.delete(`/SellerRegistration/kyc-document/${documentId}`);
  }

  // Order Management for Sellers
  async getSellerOrders(filters?: SellerOrdersFilters): Promise<PaginatedSellerOrders> {
    const params = new URLSearchParams();
    
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortDirection) params.append('sortDirection', filters.sortDirection);

    const queryString = params.toString();
    const url = queryString ? `/Orders/seller?${queryString}` : '/Orders/seller';
    
    return apiService.get<PaginatedSellerOrders>(url);
  }

  async getSellerOrderById(orderId: string): Promise<SellerOrder> {
    return apiService.get<SellerOrder>(`/Orders/seller/${orderId}`);
  }

  async updateShippingInfo(orderId: string, shippingInfo: ShippingInfo): Promise<SellerOrder> {
    return apiService.put<SellerOrder>(`/Orders/${orderId}/shipping`, shippingInfo);
  }

  async markOrderAsShipped(orderId: string, trackingNumber: string): Promise<SellerOrder> {
    return apiService.post<SellerOrder>(`/Orders/${orderId}/ship`, { trackingNumber });
  }

  async uploadShipmentProof(orderId: string, file: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);

    return apiService.post(`/Orders/${orderId}/shipment-proof`, formData);
  }

  // Analytics
  async getSellerAnalytics(): Promise<SellerAnalytics> {
    return apiService.get<SellerAnalytics>('/SellerRegistration/analytics');
  }

  // Wallet Analytics
  async getWalletAnalytics(): Promise<any> {
    return apiService.get('/wallets/seller/analytics');
  }

  // Wallet Transactions
  async getWalletTransactions(filters?: any): Promise<any> {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortDir) params.append('sortDir', filters.sortDir);
    
    const queryString = params.toString();
    const url = queryString ? `/wallets/seller/transactions?${queryString}` : '/wallets/seller/transactions';
    return apiService.get(url);
  }

  // Wallet Summary
  async getWalletSummary(): Promise<any> {
    return apiService.get('/wallets/seller/summary');
  }

  // Withdrawal Management
  async requestWithdrawal(data: WithdrawalRequest): Promise<Withdrawal> {
    return apiService.post<Withdrawal>('/withdrawals', data);
  }

  async getWithdrawals(): Promise<Withdrawal[]> {
    return apiService.get<Withdrawal[]>('/withdrawals');
  }

  async getWithdrawalById(withdrawalId: string): Promise<Withdrawal> {
    return apiService.get<Withdrawal>(`/withdrawals/${withdrawalId}`);
  }

  async cancelWithdrawal(withdrawalId: string): Promise<void> {
    return apiService.delete(`/withdrawals/${withdrawalId}`);
  }
}

export const sellerService = SellerService.getInstance();