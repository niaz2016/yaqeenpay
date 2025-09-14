// src/services/mockSellerService.ts
import type {
  SellerAnalytics,
  Withdrawal,
  WithdrawalRequest,
  SellerOrder,
  PaginatedSellerOrders,
  SellerOrdersFilters
} from '../types/seller';

// Mock delay to simulate API call
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class MockSellerService {
  private static instance: MockSellerService;

  public static getInstance(): MockSellerService {
    if (!MockSellerService.instance) {
      MockSellerService.instance = new MockSellerService();
    }
    return MockSellerService.instance;
  }

  // Mock Analytics Data
  async getSellerAnalytics(): Promise<SellerAnalytics> {
    await delay(500);
    
    return {
      totalSales: 18500.00,
      totalOrders: 127,
      pendingOrders: 5,
      completedOrders: 115,
      averageOrderValue: 145.67,
      completionRate: 90.6,
      revenue: 18500.00,
      thisMonthSales: 3200.00,
      lastMonthSales: 2800.00,
      topSellingCategories: [
        { category: 'Electronics', count: 45, revenue: 6750.00 },
        { category: 'Accessories', count: 89, revenue: 4450.00 },
        { category: 'Home & Garden', count: 23, revenue: 2300.00 },
        { category: 'Sports', count: 34, revenue: 1700.00 },
        { category: 'Books', count: 56, revenue: 1120.00 }
      ]
    };
  }

  async requestWithdrawal(data: WithdrawalRequest): Promise<Withdrawal> {
    await delay(500);
    
    const newWithdrawal: Withdrawal = {
      id: `WD-${Date.now()}`,
      amount: data.amount,
      currency: 'USD',
      status: 'PendingProvider',
      paymentMethod: data.paymentMethod,
      requestedAt: new Date().toISOString(),
      sellerId: '',
      channel: 'JazzCash',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return newWithdrawal;
  }

  async cancelWithdrawal(withdrawalId: string): Promise<void> {
    await delay(300);
    
    // In a real implementation, this would update the withdrawal status
    console.log(`Cancelling withdrawal ${withdrawalId}`);
  }

  // Mock seller orders for analytics
  async getSellerOrders(filters?: SellerOrdersFilters): Promise<PaginatedSellerOrders> {
    await delay(400);
    
    const mockOrders: SellerOrder[] = [
      {
        id: '1',
        orderNumber: 'ORD-2024-001',
        amount: 159.99,
        currency: 'USD',
        description: 'Wireless Headphones',
        status: 'Shipped',
        buyerName: 'John Doe',
        buyerEmail: 'john@example.com',
        createdAt: '2024-03-10T10:00:00Z',
        updatedAt: '2024-03-11T14:30:00Z',
        shippingAddress: '123 Main St, Anytown, CA 12345, USA',
        trackingNumber: 'TRK123456789',
        canShip: false,
        canMarkDelivered: true,
        canUpdateShipping: true,
        canDispute: false
      },
      {
        id: '2',
        orderNumber: 'ORD-2024-002',
        amount: 59.98,
        currency: 'USD',
        description: 'Smartphone Case (2x)',
        status: 'Processing',
        buyerName: 'Jane Smith',
        buyerEmail: 'jane@example.com',
        createdAt: '2024-03-09T15:30:00Z',
        updatedAt: '2024-03-09T15:30:00Z',
        shippingAddress: '456 Oak Ave, Other City, NY 54321, USA',
        canShip: true,
        canMarkDelivered: false,
        canUpdateShipping: true,
        canDispute: false
      }
    ];

    return {
      items: mockOrders,
      totalCount: mockOrders.length,
      pageIndex: filters?.page || 1,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false
    };
  }

  // Mock Wallet Analytics Data
  async getWalletAnalytics() {
    await delay(500);
    
    return {
      totalBalance: 1500.00,
      pendingBalance: 200.00,
      availableBalance: 1300.00,
      totalEarnings: 5000.00
    };
  }

  // Mock Wallet Transactions Data
  async getWalletTransactions(_filters?: any) {
    await delay(500);
    
    return {
      transactions: [
        {
          id: '1',
          type: 'credit',
          amount: 100.00,
          description: 'Order payment',
          date: new Date().toISOString()
        }
      ],
      total: 1
    };
  }

  // Mock Wallet Summary Data
  async getWalletSummary() {
    await delay(500);
    
    return {
      currentBalance: 1300.00,
      monthlyEarnings: 500.00,
      pendingPayouts: 200.00
    };
  }
}

export const mockSellerService = MockSellerService.getInstance();