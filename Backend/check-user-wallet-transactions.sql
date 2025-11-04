-- Check wallet transactions for user 2af9b167-0c81-46a4-8114-712fceade0fb
SELECT 
    w."Id" as "WalletId",
    w."UserId",
    w."Balance",
    w."Currency",
    COUNT(wt."Id") as transaction_count
FROM "Wallets" w
LEFT JOIN "WalletTransactions" wt ON w."Id" = wt."WalletId"
WHERE w."UserId" = '2af9b167-0c81-46a4-8114-712fceade0fb'
GROUP BY w."Id", w."UserId", w."Balance", w."Currency";

-- Check actual wallet transactions
SELECT 
    "Id",
    "WalletId",
    "Type",
    "Amount",
    "Currency",
    "CreatedAt"
FROM "WalletTransactions"
WHERE "WalletId" IN (
    SELECT "Id" FROM "Wallets" WHERE "UserId" = '2af9b167-0c81-46a4-8114-712fceade0fb'
)
ORDER BY "CreatedAt" DESC
LIMIT 20;
