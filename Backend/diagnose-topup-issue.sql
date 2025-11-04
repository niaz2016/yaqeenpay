-- Check recent BankSmsPayments records
SELECT 
    "Id",
    "RawText",
    "Amount",
    "TransactionId",
    "SenderName",
    "Processed",
    "ProcessingResult",
    "UserId",
    "WalletTopupLockId",
    "CreatedAt"
FROM "BankSmsPayments"
ORDER BY "CreatedAt" DESC
LIMIT 10;

-- Check active WalletTopupLocks
SELECT 
    "Id",
    "UserId",
    "Amount",
    "TransactionReference",
    "Status",
    "LockedAt",
    "ExpiresAt",
    "CompletedAt"
FROM "WalletTopupLocks"
WHERE "Status" = 0 -- Locked
  AND "ExpiresAt" > NOW()
ORDER BY "LockedAt" DESC
LIMIT 10;

-- Check recent Wallets and their balances
SELECT 
    w."Id",
    w."UserId",
    u."FirstName" || ' ' || u."LastName" as "UserName",
    u."Email",
    w."Balance",
    w."Currency",
    w."LastModifiedAt"
FROM "Wallets" w
JOIN "Users" u ON w."UserId" = u."Id"
ORDER BY w."LastModifiedAt" DESC
LIMIT 10;

-- Check WalletTransactions for recent credits
SELECT 
    "Id",
    "WalletId",
    "Type",
    "Amount",
    "Currency",
    "Reference",
    "Description",
    "CreatedAt"
FROM "WalletTransactions"
WHERE "Type" = 0 -- Credit
ORDER BY "CreatedAt" DESC
LIMIT 10;
