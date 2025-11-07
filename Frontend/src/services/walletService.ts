// src/services/walletService.ts
import apiService from './api';
import notificationTrigger from './notificationTrigger';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
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

// Convert a File to a base64 data URL for persistent storage in localStorage
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string | ArrayBuffer | null;
      if (typeof result === 'string') resolve(result);
      else reject(new Error('Failed to read file as data URL'));
    };
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
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
      currency: 'PKR',
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
    
    const amt = Number((t as any).amount ?? t.amount);
    const fixedAmt = Number.isFinite(amt) ? amt : 0;

    // Normalize common legacy/variant field names
    const currency = (t as any).currency ?? (t as any).curr ?? (t as any).currCode ?? '';
    const transactionReference = (t as any).transactionReference ?? (t as any).reference ?? (t as any).ref ?? (t as any).externalReference ?? (t as any).receiptId ?? '';
    // Proof can be posted as proofUrl, attachment, fileUrl or as attachments array
    const proofUrl = (t as any).proofUrl ?? (t as any).fileUrl ?? (t as any).proof?.url ?? (Array.isArray((t as any).attachments) && (t as any).attachments[0]?.url) ?? '';

    // Ensure id exists
    const id = t.id || (t as any).transactionId || (t as any).txId || uuidv4?.() || (`tx_${Math.random().toString(36).slice(2, 9)}`);

    // Return transaction with proper structure
    return {
      ...t,
      id,
      date: dateStr,
      createdAt: dateStr, // Ensure createdAt exists
      amount: fixedAmt,
      status: t.status || 'Completed', // Default status
      type: t.type || 'Credit', // Default type
      currency,
      transactionReference,
      proofUrl,
    } as WalletTransaction;
  });
}

class WalletService {

  /**
   * Uploads proof of payment for a wallet top-up.
   * @param topUpId The ID of the top-up (from TopUpDto.id)
   * @param file The proof image file
   * @param notes Optional notes
   */
  async uploadTopUpProof(topUpId: string, file: File, notes: string): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('notes', notes || '');
    if (this.mockMode) {
      // In mock mode, persist the file as a base64 data URL in localStorage so it survives reloads
      try {
        const key = getUserTransactionsKey();
        const txs = readLS<WalletTransaction[]>(key, []);
        const idx = txs.findIndex((t) => t.id === topUpId);
        const dataUrl = await fileToDataUrl(file as any);
        if (idx >= 0) {
          const t = { ...txs[idx] } as any;
          t.proofUrl = dataUrl;
          t.proofFilename = file.name;
          t.attachments = [{ url: dataUrl, name: file.name }];
          txs[idx] = t;
          writeLS(key, txs);
        } else {
          // If not found, create a pending proof record as a transaction-like entry
          const now = new Date().toISOString();
          const newTx: any = {
            id: topUpId || (`tx_${Math.random().toString(36).slice(2, 9)}`),
            date: now,
            createdAt: now,
            type: 'Credit',
            amount: 0,
            status: 'Pending',
            description: notes || 'Top-up proof (mock)',
            proofUrl: dataUrl,
            proofFilename: file.name,
            attachments: [{ url: dataUrl, name: file.name }]
          };
          txs.unshift(newTx as WalletTransaction);
          writeLS(key, txs);
        }
      } catch (e) {
        logger.warn('Mock uploadTopUpProof failed to attach proof to local tx:', e);
      }
      return;
    }

    await apiService.post(`/wallets/top-up/${topUpId}/proof`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }
  private mockMode: boolean;
  
  constructor() {
    const env: any = (import.meta as any).env || {};
    const fromFlag = (env.VITE_WALLET_USE_MOCK ?? '').toString().toLowerCase();
    
    // Force database-only mode in production
    // Only allow mock mode if explicitly enabled and in development
    const isProduction = env.PROD || env.NODE_ENV === 'production';
    if (isProduction) {
      this.mockMode = false;
    } else {
      this.mockMode = fromFlag === 'true';
    }
  }

  private async tryGet<T>(url: string, fallback: () => T | Promise<T>): Promise<T> {
    if (this.mockMode) return await fallback();
    try {
      const result = await apiService.get<T>(url);
      
      // Debug logging for transactions
      if (url.includes('/wallets/transactions')) {
        const typedResult = result as any;
        if (typedResult.items && typedResult.items.length > 0) {
        }
      }
      
      return result;
    } catch (e) {
      logger.error(`WalletService: Database call failed for ${url}:`, e);
      if (this.mockMode) {
        logger.warn(`WalletService: Falling back to mock for ${url}`);
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
        currency: 'PKR',
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
    // Transform frontend request to backend command format - PKR is implicit
    const backendRequest = {
      amount: request.amount,
      channel: request.channel
    };
    
    if (this.mockMode) {
      // Mock mode - return TopUpResponse format
      if (request.amount <= 0) {
        return { success: false, receiptId: '', newBalance: readLS<WalletSummary>(getUserWalletKey(), { balance: 0, currency: 'PKR', status: 'Active', updatedAt: nowIso() }).balance, message: 'Amount must be positive' };
      }
      const summary = readLS<WalletSummary>(getUserWalletKey(), {
        balance: 0,
        currency: 'PKR',
        status: 'Active',
        updatedAt: nowIso(),
      });
      let txs = readLS<WalletTransaction[]>(getUserTransactionsKey(), []);
      txs = sanitizeTransactions(txs);
  const newBalance = summary.balance + request.amount;
      const now = new Date().toISOString();
      const txId = uuidv4();
      const tx: any = {
        id: txId,
        date: now,
        createdAt: now,
        type: 'Credit',
        amount: Number(request.amount),
        status: 'Completed',
        description: `${request.channel} top-up`,
        currency: 'PKR'
      };
      const newSummary: WalletSummary = { ...summary, balance: newBalance, updatedAt: nowIso() };
      writeLS(getUserWalletKey(), newSummary);
      writeLS(getUserTransactionsKey(), [tx as WalletTransaction, ...txs]);
      // Return TopUpDto-like object so caller can upload proof against returned id in mock mode
      const topUpDto: TopUpDto = {
        id: txId,
        userId: 'mock-user',
        walletId: 'mock-wallet',
        amount: request.amount,
        currency: 'PKR',
        channel: request.channel,
        status: 'Completed',
        requestedAt: now,
      } as TopUpDto;
      return topUpDto;
    }

    try {
      // Backend mode - return TopUpDto format
      const result = await apiService.post<TopUpDto>('/wallets/top-up', backendRequest);
      
      // Trigger notification for successful top-up
      if (result.status === 'Completed' || result.status === 'PendingConfirmation') {
        try {
          await notificationTrigger.onWalletTopUp({
            amount: result.amount,
            currency: 'PKR',
            method: result.channel,
            transactionId: result.id,
            newBalance: result.amount // Will need to get actual new balance
          }, result.userId);
        } catch (error) {
          logger.warn('Failed to trigger wallet top-up notification:', error);
        }
      }
      
      return result;
    } catch (e) {
      logger.error(`WalletService: Database call failed for /wallets/top-up:`, e);
      
      // Trigger notification for failed top-up
      try {
        await notificationTrigger.onWalletTopUpFailed({
          amount: request.amount,
          currency: 'PKR',
          method: request.channel
        }, 'Database connection failed');
        } catch (error) {
        logger.warn('Failed to trigger wallet top-up failed notification:', error);
      }
      
      // In database-only mode, throw the error instead of falling back
      throw new Error(`Database connection failed for /wallets/top-up. Please ensure the backend server is running.`);
    }
  }

  async getAnalytics(days: number = 30): Promise<WalletAnalytics> {
    return this.tryGet<WalletAnalytics>(`/wallets/analytics?days=${days}`, async () => {
      // Generate a 30d mock series from transactions
  let txs = readLS<WalletTransaction[]>(getUserTransactionsKey(), []);
  txs = sanitizeTransactions(txs);
      const summary = readLS<WalletSummary>(getUserWalletKey(), { balance: 0, currency: 'PKR', status: 'Active', updatedAt: nowIso() });
      const today = new Date();
      const series = [] as WalletAnalytics['series'];
      let running = 0;
      const pastTx = txs
        .filter(t => new Date(t.date) <= today)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // For 1 day (24 hours), generate hourly points instead of daily
      if (days === 1) {
        const startTime = new Date(today);
        startTime.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < 24; i++) {
          const hourStart = new Date(startTime);
          hourStart.setHours(i);
          const hourEnd = new Date(hourStart);
          hourEnd.setHours(i + 1);
          
          const hourTx = pastTx.filter(t => {
            const txDate = new Date(t.date);
            return txDate >= hourStart && txDate < hourEnd;
          });
          
          let credits = 0, debits = 0;
          for (const t of hourTx) {
            if ((t as any).type === 'Debit') {
              debits += t.amount;
              running -= t.amount;
            } else {
              credits += t.amount;
              running += t.amount;
            }
          }
          
          // Use ISO format with time for hourly data
          const hourStr = hourStart.toISOString();
          series.push({ date: hourStr, balance: running, credits, debits });
        }
      } else {
        // Daily aggregation for periods > 1 day
        for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dayStr = d.toISOString().slice(0, 10);
        const dayStart = new Date(dayStr + 'T00:00:00.000Z');
        const dayEnd = new Date(dayStr + 'T23:59:59.999Z');
        const dayTx = pastTx.filter(t => new Date(t.date) >= dayStart && new Date(t.date) <= dayEnd);
        let credits = 0, debits = 0;
        for (const t of dayTx) {
          // Transactions use positive amounts; the 'type' indicates direction.
          // Treat Debit transactions as negative impact on running balance.
          if ((t as any).type === 'Debit') {
            debits += t.amount;
            running -= t.amount;
          } else {
            credits += t.amount;
            running += t.amount;
          }
        }
        series.push({ date: dayStr, balance: running, credits, debits });
      }
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

  /**
   * Submit a transaction ID/reference for a previously created top-up.
   * Backend endpoint: POST /wallets/top-up/{id}/reference { transactionId }
   */
  async submitTopUpReference(topUpId: string, transactionId: string): Promise<TopUpDto | void> {
    if (!topUpId) throw new Error('topUpId is required');
    if (!transactionId || !transactionId.trim()) throw new Error('transactionId is required');

    if (this.mockMode) {
      // Update local mock transaction to reflect pending admin approval and store reference
      const key = getUserTransactionsKey();
      const txs = readLS<WalletTransaction[]>(key, []);
      const idx = txs.findIndex(t => t.id === topUpId);
      if (idx >= 0) {
        const t = { ...txs[idx] } as any;
        t.status = 'Pending';
        t.transactionReference = transactionId.trim();
        txs[idx] = t as WalletTransaction;
        writeLS(key, txs);
      }
      return;
    }

    try {
      const result = await apiService.post<TopUpDto>(`/wallets/top-up/${topUpId}/reference`, { transactionId: transactionId.trim() });
      return result;
    } catch (e) {
      logger.error('WalletService: Failed to submit top-up reference:', e);
      throw new Error('Failed to submit transaction ID. Please try again.');
    }
  }

  /**
   * Fetch top-ups with optional server-side filters (admin use).
   * Filters: pageNumber, pageSize, status, dateFrom, dateTo
   */
  async getTopUps(filters?: { pageNumber?: number; pageSize?: number; status?: string; dateFrom?: string; dateTo?: string }): Promise<any> {
    if (this.mockMode) {
      // Fallback to mock: return all transactions that look like top-ups
      const txs = readLS<WalletTransaction[]>(getUserTransactionsKey(), []);
      const topups = txs.filter(t => (t.type || '').toLowerCase() === 'credit');
      return { items: topups, total: topups.length };
    }

    const params = new URLSearchParams();
    if (filters?.pageNumber) params.append('pageNumber', String(filters.pageNumber));
    if (filters?.pageSize) params.append('pageSize', String(filters.pageSize));
    if (filters?.status) params.append('status', filters.status);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);

    return this.tryGet<any>(`/wallets/top-ups?${params.toString()}`, async () => {
      // fallback simple shape
      const txs = readLS<WalletTransaction[]>(getUserTransactionsKey(), []);
      return { items: txs, total: txs.length };
    });
  }

  // Remove getSellerWalletSummary - use getSummary() for all users
}

const walletService = new WalletService();
export default walletService;
