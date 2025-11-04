-- Check for any recent topup locks
SELECT 
    "Id",
    "UserId",
    "Amount",
    "Currency",
    "TransactionReference",
    "Status",
    "ExpiresAt"
FROM "WalletTopupLocks"
WHERE "UserId" = '2af9b167-0c81-46a4-8114-712fceade0fb'
  AND "Status" = 0 -- Locked
  AND "ExpiresAt" > NOW()
ORDER BY "LockedAt" DESC
LIMIT 5;
