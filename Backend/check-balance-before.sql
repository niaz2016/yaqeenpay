-- Check current wallet balance BEFORE test
SELECT 
    w."Id",
    w."UserId",
    w."Balance",
    w."Currency"
FROM "Wallets" w
WHERE w."UserId" = '2af9b167-0c81-46a4-8114-712fceade0fb';

-- Count transactions BEFORE test
SELECT COUNT(*) as transaction_count 
FROM "WalletTransactions" wt
WHERE wt."WalletId" IN (
    SELECT "Id" FROM "Wallets" WHERE "UserId" = '2af9b167-0c81-46a4-8114-712fceade0fb'
);
