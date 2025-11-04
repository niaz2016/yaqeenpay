-- Check recent Wallets and their balances  
SELECT 
    w."Id",
    w."UserId",
    w."Balance",
    w."Currency",
    w."LastModifiedAt"
FROM "Wallets" w
ORDER BY w."LastModifiedAt" DESC
LIMIT 10;

-- Check WalletTransactions for recent credits
SELECT 
    "Id",
    "WalletId",
    "Type",
    "Amount",
    "Currency",
    "ReferenceId",
    "Description",
    "CreatedAt"
FROM "WalletTransactions"
WHERE "Type" = 0 -- Credit
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
    "ExpiresAt"
FROM "WalletTopupLocks"
ORDER BY "LockedAt" DESC
LIMIT 10;
