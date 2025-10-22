# Bank SMS Processing Analysis

## Problem Description
SMS received is successfully posted to `/webhooks/bank-sms` endpoint and added to database, but the user doesn't get updated balance.

## Current Flow Analysis

### 1. SMS Processing Flow (BankSmsProcessingService)
```csharp
1. Validates webhook secret
2. Parses SMS text for:
   - Amount (PKR pattern matching)
   - Transaction ID
   - Date/Time
   - Sender details
3. Saves raw BankSmsPayment record to database
4. Looks for matching WalletTopupLock by:
   - Amount matching
   - Transaction reference containing WTU prefix
   - Active/non-expired lock
5. If match found:
   - Credits wallet via wallet.Credit()
   - Marks topup lock as completed
   - Updates BankSmsPayment record with processed=true
6. Returns success/failure response
```

### 2. Frontend Balance Refresh
```typescript
// WalletService.getSummary() calls /api/wallets/summary
// Which queries the wallet balance from database
// Frontend shows this balance to user
```

### 3. Potential Issues

#### Issue 1: No WalletTopupLock Match
If SMS doesn't match any active topup lock:
- BankSmsPayment is saved with Processed=false
- No wallet credit occurs
- ProcessingResult shows "No matching active lock found"

#### Issue 2: Frontend Not Refreshing
Even if wallet is credited successfully:
- Frontend may not automatically refresh balance
- User needs to manually refresh or reload page

#### Issue 3: Amount/Reference Mismatch
- SMS amount doesn't match lock amount
- Transaction reference doesn't contain expected WTU format

## Debugging Steps

### Step 1: Check Recent BankSmsPayment Records
```sql
SELECT * FROM BankSmsPayments 
ORDER BY CreatedAt DESC 
LIMIT 10;
```

### Step 2: Check WalletTopupLock Status
```sql
SELECT * FROM WalletTopupLocks 
WHERE Status = 0 -- Locked status
AND ExpiresAt > NOW()
ORDER BY CreatedAt DESC;
```

### Step 3: Check Wallet Balance Changes
```sql
SELECT w.*, wt.* FROM Wallets w
LEFT JOIN WalletTransactions wt ON w.Id = wt.WalletId
WHERE w.UserId = 'USER_ID_HERE'
ORDER BY wt.CreatedAt DESC;
```

## Potential Solutions

### Solution 1: Add Real-time Balance Updates
- Implement SignalR for real-time balance notifications
- Send balance update to connected clients after wallet credit

### Solution 2: Improve SMS Matching Logic
- Better transaction reference extraction
- Fallback matching by amount + time window
- Handle multiple SMS formats

### Solution 3: Frontend Auto-refresh
- Auto-refresh wallet balance every 30 seconds when on wallet page
- Refresh after topup operations

### Solution 4: Admin Dashboard for SMS Monitoring
- View all BankSmsPayment records
- Manually process failed SMS
- Monitor processing success rate

## Testing Plan

1. Create test topup lock
2. Send test SMS webhook
3. Verify wallet credit
4. Check frontend balance update