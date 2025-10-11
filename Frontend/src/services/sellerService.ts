// src/services/sellerService.ts
import apiService from './api';
import notificationTrigger from './notificationTrigger';
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
} from '../types/user';

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
    return apiService.post<BusinessProfile>('/BusinessProfile', data);
  }

  async getBusinessProfile(): Promise<BusinessProfile> {
    return apiService.get<BusinessProfile>('/BusinessProfile');
  }

  async updateBusinessProfile(data: Partial<CreateBusinessProfileRequest>): Promise<BusinessProfile> {
    return apiService.put<BusinessProfile>('/BusinessProfile', data);
  }

  // Seller Registration
  async applyForSellerRole(data: SellerRegistrationRequest): Promise<SellerRegistrationResponse> {
    
    // Helper function to convert file to Base64
    const fileToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const result = reader.result as string;
          // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = error => reject(error);
      });
    };

    try {
      // Validate inputs
      if (!data.businessProfile) {
        throw new Error('Business profile is required');
      }
      
      if (!data.kycDocuments || data.kycDocuments.length === 0) {
        throw new Error('At least one KYC document is required');
      }

      // Convert all documents to Base64 first
      const documentsWithBase64 = await Promise.all(
        data.kycDocuments.map(async (doc) => {
          if (!doc.file) {
            throw new Error(`File is required for document type: ${doc.documentType}`);
          }
          
          return {
            documentType: doc.documentType,
            documentNumber: '', // Default empty string since frontend doesn't collect this
            documentBase64: await fileToBase64(doc.file),
            fileName: doc.file.name
          };
        })
      );

      // Create the request payload that matches the backend DTO structure
      const requestPayload = {
        // Business profile fields
        businessName: data.businessProfile.businessName || '',
        businessType: data.businessProfile.businessType || '',
        businessCategory: data.businessProfile.businessCategory || '',
        description: data.businessProfile.description || '',
        website: data.businessProfile.website || '',
        phoneNumber: data.businessProfile.phoneNumber || '',
        address: data.businessProfile.address || '',
        city: data.businessProfile.city || '',
        state: data.businessProfile.state || '',
        country: data.businessProfile.country || '',
        postalCode: data.businessProfile.postalCode || '',
        taxId: data.businessProfile.taxId || '',
        
        // KYC documents
        documents: documentsWithBase64
      };

      console.log('Applying for seller role with payload structure:', {
        businessName: requestPayload.businessName,
        documentCount: requestPayload.documents.length,
        documentTypes: requestPayload.documents.map(d => d.documentType)
      });
      
      const response = await apiService.post<SellerRegistrationResponse>('/SellerRegistration/apply', requestPayload);
      return response;
    } catch (error) {
      console.error('Seller registration error:', error);
      
      // Provide more specific error messages
      if (error instanceof Error && error.message.includes('Failed to execute \'readAsDataURL\'')) {
        throw new Error('Failed to process uploaded files. Please try again with different files.');
      }
      
      if (error instanceof Error && error.message.includes('415')) {
        throw new Error('File format not supported. Please ensure files are properly formatted images or PDFs.');
      }
      
      throw error;
    }
  }

  // KYC Document Management
  async uploadKycDocument(documentType: string, file: File): Promise<KycDocument> {
    const formData = new FormData();
    formData.append('documentType', documentType);
    formData.append('file', file);

    try {
      const result = await apiService.post<KycDocument>('/SellerRegistration/kyc-document', formData);
      
      // Trigger notification for successful document upload
      await notificationTrigger.onKycDocumentUploaded({
        type: documentType,
        name: file.name,
        size: file.size
      });
      
      return result;
    } catch (error) {
      console.error('Error uploading KYC document:', error);
      throw error;
    }
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
    if (filters?.page) params.append('pageNumber', filters.page.toString());
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
    const order = await apiService.post<SellerOrder>(`/Orders/${orderId}/ship`, { trackingNumber });
    // Fire notification so buyer is informed (defensive in case other path not hit)
    try {
      await notificationTrigger.onOrderShipped(order, { trackingNumber });
    } catch (err) {
      console.warn('Failed to trigger onOrderShipped notification (sellerService):', err);
    }
    return order;
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
    // Transform frontend data to match backend RequestWithdrawalCommand structure
    // Build notes to include bank account and account title when available, since backend RequestWithdrawalCommand accepts Notes
    const bankDetails = (data as any).bankDetails;
    let notes: string | undefined = data.notes;
    if (!notes && bankDetails) {
      const parts: string[] = [];
      if (bankDetails.accountNumber) parts.push(`Account: ${bankDetails.accountNumber}`);
      if (bankDetails.accountHolderName) parts.push(`Account Title: ${bankDetails.accountHolderName}`);
      if (bankDetails.bankName) parts.push(`Bank: ${bankDetails.bankName}`);
      if (parts.length > 0) notes = parts.join(' | ');
    }

    const backendRequest = {
      Amount: data.amount,
      Currency: 'PKR',
      PaymentMethod: data.paymentMethod || (data as any).method || (data as any).PaymentMethod,
      Notes: notes
    };
    
    return apiService.post<Withdrawal>('/withdrawals', backendRequest);
  }

  async approveWithdrawal(withdrawalId: string): Promise<Withdrawal> {
    // Call backend endpoint to approve a withdrawal (admin action)
    return apiService.post<Withdrawal>(`/withdrawals/${withdrawalId}/approve`, {});
  }

  async getWithdrawals(options?: { page?: number; pageSize?: number; status?: string; sellerId?: string; reference?: string }): Promise<Withdrawal[]> {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.pageSize) params.append('pageSize', options.pageSize.toString());
    if (options?.status) params.append('status', options.status);
    if (options?.sellerId) params.append('sellerId', options.sellerId);
    if (options?.reference) params.append('reference', options.reference);

    const queryString = params.toString();
    const url = queryString ? `/withdrawals?${queryString}` : '/withdrawals';
    return apiService.get<Withdrawal[]>(url);
  }

  async getWithdrawalById(withdrawalId: string): Promise<Withdrawal> {
    return apiService.get<Withdrawal>(`/withdrawals/${withdrawalId}`);
  }

  async cancelWithdrawal(withdrawalId: string): Promise<void> {
    return apiService.delete(`/withdrawals/${withdrawalId}`);
  }
}

export const sellerService = SellerService.getInstance();