-- TechTorio Wallet Topup Diagnostic Script
-- Run this to check the state of your topup system

-- 1. Check recent topup locks
SELECT 
    'TOPUP LOCKS' as "Table",
    "Id",
    "UserId",
    "Amount_Amount" as "Amount",
    "Amount_Currency" as "Currency",
    "TransactionReference",
    "Status",
    "LockedAt",
    "ExpiresAt",
    CASE 
        WHEN "Status" = 0 AND "ExpiresAt" > NOW() THEN 'ACTIVE (Locked)'
        WHEN "Status" = 0 AND "ExpiresAt" <= NOW() THEN 'EXPIRED'
        WHEN "Status" = 1 THEN 'COMPLETED'
        WHEN "Status" = 2 THEN 'CANCELLED'
        ELSE 'UNKNOWN'
    END as "LockState"
FROM "WalletTopupLocks"
ORDER BY "LockedAt" DESC
LIMIT 10;

-- 2. Check recent bank SMS payments
SELECT 
    'BANK SMS' as "Table",
    "Id",
    "UserId",
    "WalletId",
    "WalletTopupLockId",
    "Amount",
    "Currency",
    "TransactionId",
    "SenderName",
    "Processed",
    "ProcessingResult",
    "CreatedAt",
    SUBSTRING("RawText", 1, 100) as "SMS_Preview"
FROM "BankSmsPayments"
ORDER BY "CreatedAt" DESC
LIMIT 10;

-- 3. Check wallet balances for recent users
SELECT 
    'WALLETS' as "Table",
    w."Id" as "WalletId",
    u."Email",
    w."Balance_Amount" as "Balance",
    w."Balance_Currency" as "Currency",
    w."CreatedAt",
    w."LastUpdated"
FROM "Wallets" w
JOIN "AspNetUsers" u ON w."UserId" = u."Id"
ORDER BY w."LastUpdated" DESC
LIMIT 10;

-- 4. Check recent wallet transactions
SELECT 
    'TRANSACTIONS' as "Table",
    wt."Id",
    wt."WalletId",
    wt."Type",
    wt."Amount_Amount" as "Amount",
    wt."Amount_Currency" as "Currency",
    wt."Description",
    wt."TransactionDate",
    wt."BalanceAfter_Amount" as "BalanceAfter"
FROM "WalletTransactions" wt
ORDER BY wt."TransactionDate" DESC
LIMIT 10;

-- 5. Find orphaned locks (no matching SMS)
SELECT 
    'ORPHANED LOCKS' as "Issue",
    wtl."Id",
    wtl."TransactionReference",
    wtl."Amount_Amount" as "Amount",
    wtl."Status",
    wtl."LockedAt",
    wtl."ExpiresAt"
FROM "WalletTopupLocks" wtl
WHERE wtl."Status" = 0 -- Locked
  AND wtl."ExpiresAt" > NOW() -- Not expired
  AND NOT EXISTS (
      SELECT 1 FROM "BankSmsPayments" bsp 
      WHERE bsp."WalletTopupLockId" = wtl."Id"
  )
ORDER BY wtl."LockedAt" DESC;

-- 6. Find unprocessed SMS (no matching lock)
SELECT 
    'UNPROCESSED SMS' as "Issue",
    bsp."Id",
    bsp."Amount",
    bsp."TransactionId",
    bsp."SenderName",
    bsp."Processed",
    bsp."ProcessingResult",
    bsp."CreatedAt",
    SUBSTRING(bsp."RawText", 1, 150) as "SMS_Text"
FROM "BankSmsPayments" bsp
WHERE bsp."Processed" = false
ORDER BY bsp."CreatedAt" DESC;

-- 7. Check for amount mismatches
SELECT 
    'AMOUNT MISMATCH' as "Issue",
    bsp."Id" as "SMS_Id",
    bsp."Amount" as "SMS_Amount",
    wtl."Amount_Amount" as "Lock_Amount",
    bsp."ProcessingResult",
    bsp."CreatedAt"
FROM "BankSmsPayments" bsp
LEFT JOIN "WalletTopupLocks" wtl ON bsp."WalletTopupLockId" = wtl."Id"
WHERE bsp."Processed" = false
  AND bsp."ProcessingResult" LIKE '%mismatch%'
ORDER BY bsp."CreatedAt" DESC;

-- 8. Get summary statistics
SELECT 
    'SUMMARY' as "Report",
    (SELECT COUNT(*) FROM "WalletTopupLocks" WHERE "Status" = 0 AND "ExpiresAt" > NOW()) as "Active_Locks",
    (SELECT COUNT(*) FROM "WalletTopupLocks" WHERE "Status" = 1) as "Completed_Locks",
    (SELECT COUNT(*) FROM "BankSmsPayments" WHERE "Processed" = true) as "Processed_SMS",
    (SELECT COUNT(*) FROM "BankSmsPayments" WHERE "Processed" = false) as "Unprocessed_SMS",
    (SELECT SUM("Balance_Amount") FROM "Wallets") as "Total_Wallet_Balance",
    (SELECT COUNT(*) FROM "WalletTransactions" WHERE "Type" = 0) as "Total_Credit_Txns",
    (SELECT COUNT(*) FROM "WalletTransactions" WHERE "Type" = 1) as "Total_Debit_Txns";
