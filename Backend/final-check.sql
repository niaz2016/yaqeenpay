-- Check most recent BankSmsPayments after the fix
SELECT 
    "Id",
    SUBSTRING("RawText", 1, 60) as "SMS",
    "Amount",
    "Processed",
    "ProcessingResult",
    "WalletId",
    "CreatedAt"
FROM "BankSmsPayments"
ORDER BY "CreatedAt" DESC
LIMIT 3;

-- Check wallet balance NOW
SELECT "Id", "UserId", "Balance", "Currency" 
FROM "Wallets" 
WHERE "UserId" = '2af9b167-0c81-46a4-8114-712fceade0fb';

-- Check wallet transactions NOW
SELECT "Id", "WalletId", "Type", "Amount", "Currency", "CreatedAt"
FROM "WalletTransactions"
ORDER BY "CreatedAt" DESC
LIMIT 3;
