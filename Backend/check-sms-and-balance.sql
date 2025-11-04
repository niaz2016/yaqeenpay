-- Check most recent BankSmsPayments
SELECT 
    "Id",
    SUBSTRING("RawText", 1, 80) as "SMS_Preview",
    "Amount",
    "TransactionId",
    "Processed",
    "ProcessingResult",
    "WalletId",
    "CreatedAt"
FROM "BankSmsPayments"
ORDER BY "CreatedAt" DESC
LIMIT 5;

-- Check if wallet balance was updated
SELECT 
    w."Id",
    w."UserId",
    w."Balance",
    w."Currency",
    w."LastModifiedAt"
FROM "Wallets" w
WHERE w."UserId" = '2af9b167-0c81-46a4-8114-712fceade0fb';

-- Check wallet transactions
SELECT 
    "Id",
    "WalletId",
    "Type",
    "Amount",
    "Currency",
    "ReferenceId",
    "CreatedAt"
FROM "WalletTransactions"
ORDER BY "CreatedAt" DESC
LIMIT 5;
