// src/services/walletService.ts
import apiService from './api';
import { v4 as uuidv4 } from 'uuid';
import type {
  WalletSummary,
  WalletTransaction,
  TransactionQuery,
  TransactionType,
  PagedResult,
  TopUpRequest,
  TopUpResponse,
  TopUpDto,
  WalletAnalytics,
} from '../types/wallet';

// Function to get current user ID for user-specific storage
function getCurrentUserId(): string {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id || user.email || 'anonymous';
  } catch {
    return 'anonymous';
  }
}

// User-specific local storage keys
function getUserWalletKey(): string {
  const userId = getCurrentUserId();
  return `wallet:summary:${userId}`;
}

function getUserTransactionsKey(): string {
  const userId = getCurrentUserId();
  return `wallet:transactions:${userId}`;
}

function nowIso() {
  return new Date().toISOString();
}

function readLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeLS<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function seedMock() {
  const seeded = readLS<WalletSummary | null>(getUserWalletKey(), null);
  if (!seeded) {
    const summary: WalletSummary = {
      balance: 0,
      currency: 'USD',
      status: 'Active',
      updatedAt: nowIso(),
    };
    const tx: WalletTransaction[] = [];
    writeLS(getUserWalletKey(), summary);
    writeLS(getUserTransactionsKey(), tx);
  }
}

seedMock();

function sanitizeTransactions(items: WalletTransaction[]): WalletTransaction[] {
  return items.map((t) => {
    // Fix date property - use createdAt if date doesn't exist
    let dateStr = (t as any).date || t.createdAt;
    const d = new Date(dateStr);
    if (!dateStr || isNaN(d.getTime())) {
      dateStr = new Date().toISOString();
    } else if (typeof dateStr !== 'string') {
      dateStr = new Date(dateStr).toISOString();
    }
    
    const amt = Number(t.amount);
    const fixedAmt = Number.isFinite(amt) ? amt : 0;
    
    // Return transaction with proper structure
    return { 
      ...t, 
      date: dateStr,
      createdAt: dateStr, // Ensure createdAt exists
      amount: fixedAmt,
      status: t.status || 'Completed', // Default status
      type: t.type || 'Credit' // Default type
    };
  });
}

class WalletService {
  private mockMode: boolean;
  
  constructor() {
    const env: any = (import.meta as any).env || {};
    const fromFlag = (env.VITE_WALLET_USE_MOCK ?? '').toString().toLowerCase();
    
    // Force database-only mode in production
    // Only allow mock mode if explicitly enabled and in development
    const isProduction = env.PROD || env.NODE_ENV === 'production';
    if (isProduction) {
      this.mockMode = false;
      console.log('WalletService: Production mode - using database only');
    } else {
      this.mockMode = fromFlag === 'true';
      console.log(`WalletService: Development mode - mockMode: ${this.mockMode}`);
    }
  }

  private async tryGet<T>(url: string, fallback: () => T | Promise<T>): Promise<T> {
    if (this.mockMode) return await fallback();
    try {
      const result = await apiService.get<T>(url);
      console.log(`WalletService: Successfully fetched from database: ${url}`);
      return result;
    } catch (e) {
      console.error(`WalletService: Database call failed for ${url}:`, e);
      if (this.mockMode) {
        console.warn(`WalletService: Falling back to mock for ${url}`);
        return await fallback();
      }
      // In database-only mode, throw the error instead of falling back
      throw new Error(`Database connection failed for ${url}. Please ensure the backend server is running.`);
    }
  }

  async getSummary(): Promise<WalletSummary> {
    return this.tryGet<WalletSummary>('/wallets/summary', async () => {
      return readLS<WalletSummary>(getUserWalletKey(), {
        balance: 0,
        currency: 'USD',
        status: 'Active',
        updatedAt: nowIso(),
      });
    });
  }

  async getTransactions(query: TransactionQuery = {}): Promise<PagedResult<WalletTransaction>> {
    const params = new URLSearchParams();
    if (query.page) params.append('page', String(query.page));
    if (query.pageSize) params.append('pageSize', String(query.pageSize));
    if (query.sortBy) params.append('sortBy', String(query.sortBy));
    if (query.sortDir) params.append('sortDir', query.sortDir);
    if (query.type && query.type !== 'All') params.append('type', query.type);

    return this.tryGet<PagedResult<WalletTransaction>>(`/wallets/transactions?${params.toString()}`, async () => {
      let all = readLS<WalletTransaction[]>(getUserTransactionsKey(), []);
      const sanitized = sanitizeTransactions(all);
      if (sanitized !== all) {
        all = sanitized;
        writeLS(getUserTransactionsKey(), all);
      }
      // simple client-side sort/paginate
      let items = [...all];
      // Filter by transaction type - map from query types to Credit/Debit
      if (query.type && query.type !== 'All') {
        // Map TransactionType to Credit/Debit based on business logic
        const creditTypes: TransactionType[] = ['TopUp', 'Refund', 'Adjustment'];
        const debitTypes: TransactionType[] = ['Payment', 'Withdrawal'];
        
        if (creditTypes.includes(query.type)) {
          items = items.filter(t => t.type === 'Credit');
        } else if (debitTypes.includes(query.type)) {
          items = items.filter(t => t.type === 'Debit');
        }
      }
      if (query.sortBy) {
        items.sort((a, b) => {
          const dir = query.sortDir === 'desc' ? -1 : 1;
          const k = query.sortBy as keyof WalletTransaction;
          const av = a[k] as any;
          const bv = b[k] as any;
          if (av < bv) return -1 * dir;
          if (av > bv) return 1 * dir;
          return 0;
        });
      } else {
        // default newest first
        items.sort((a, b) => b.date.localeCompare(a.date));
      }
      const page = query.page ?? 1;
      const pageSize = query.pageSize ?? 10;
      const start = (page - 1) * pageSize;
      const paged = items.slice(start, start + pageSize);
      return { items: paged, total: items.length, page, pageSize };
    });
  }

  async topUp(request: TopUpRequest): Promise<TopUpResponse | TopUpDto> {
    // Transform frontend request to backend command format
    const backendRequest = {
      amount: request.amount,
      currency: request.currency || 'PKR',
      channel: request.channel
    };
    
    if (this.mockMode) {
      // Mock mode - return TopUpResponse format
      if (request.amount <= 0) {
        return { success: false, receiptId: '', newBalance: readLS<WalletSummary>(getUserWalletKey(), { balance: 0, currency: 'USD', status: 'Active', updatedAt: nowIso() }).balance, message: 'Amount must be positive' };
      }
      const summary = readLS<WalletSummary>(getUserWalletKey(), {
        balance: 0,
        currency: 'USD',
        status: 'Active',
        updatedAt: nowIso(),
      });
      let txs = readLS<WalletTransaction[]>(getUserTransactionsKey(), []);
      txs = sanitizeTransactions(txs);
      const receiptId = uuidv4();
      const newBalance = summary.balance + request.amount;
      const now = new Date().toISOString();
      const tx: WalletTransaction = {
        id: uuidv4(),
        date: now,
        createdAt: now,
        type: 'Credit',
        amount: Number(request.amount),
        status: 'Completed',
        description: `${request.channel} top-up`
      };
      const newSummary: WalletSummary = { ...summary, balance: newBalance, updatedAt: nowIso() };
      writeLS(getUserWalletKey(), newSummary);
      writeLS(getUserTransactionsKey(), [tx, ...txs]);
      return { success: true, receiptId, newBalance };
    }

    try {
      // Backend mode - return TopUpDto format
      const result = await apiService.post<TopUpDto>('/wallets/top-up', backendRequest);
      console.log(`WalletService: Successfully posted to database: /wallets/top-up`);
      return result;
    } catch (e) {
      console.error(`WalletService: Database call failed for /wallets/top-up:`, e);
      // In database-only mode, throw the error instead of falling back
      throw new Error(`Database connection failed for /wallets/top-up. Please ensure the backend server is running.`);
    }
  }

  async getAnalytics(): Promise<WalletAnalytics> {
    return this.tryGet<WalletAnalytics>('/wallets/analytics', async () => {
      // Generate a 30d mock series from transactions
  let txs = readLS<WalletTransaction[]>(getUserTransactionsKey(), []);
  txs = sanitizeTransactions(txs);
      const summary = readLS<WalletSummary>(getUserWalletKey(), { balance: 0, currency: 'USD', status: 'Active', updatedAt: nowIso() });
      const today = new Date();
      const series = [] as WalletAnalytics['series'];
      let running = 0;
      const pastTx = txs
        .filter(t => new Date(t.date) <= today)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      // compute running balances historically assuming starting at 0
      for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dayStr = d.toISOString().slice(0, 10);
        const dayStart = new Date(dayStr + 'T00:00:00.000Z');
        const dayEnd = new Date(dayStr + 'T23:59:59.999Z');
        const dayTx = pastTx.filter(t => new Date(t.date) >= dayStart && new Date(t.date) <= dayEnd);
        let credits = 0, debits = 0;
        for (const t of dayTx) {
          if (t.amount >= 0) credits += t.amount; else debits += Math.abs(t.amount);
          running += t.amount;
        }
        series.push({ date: dayStr, balance: running, credits, debits });
      }
      // adjust last point to match current balance to avoid drift
      if (series.length) {
        const diff = summary.balance - series[series.length - 1].balance;
        series[series.length - 1].balance += diff;
      }
      const totals = series.reduce((acc, p) => ({
        credits30d: acc.credits30d + p.credits,
        debits30d: acc.debits30d + p.debits,
      }), { credits30d: 0, debits30d: 0 });
      return { series, totals };
    });
  }

  // Remove getSellerWalletSummary - use getSummary() for all users
}

const walletService = new WalletService();
export default walletService;
