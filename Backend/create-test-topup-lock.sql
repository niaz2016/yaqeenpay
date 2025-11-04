-- Create a test topup lock for user 2af9b167-0c81-46a4-8114-712fceade0fb
-- Amount: 1000 PKR
INSERT INTO "WalletTopupLocks" ("Id", "UserId", "Amount", "Currency", "TransactionReference", "Status", "LockedAt", "ExpiresAt", "IsActive", "CreatedAt", "LastModifiedAt")
VALUES (
    gen_random_uuid(),
    '2af9b167-0c81-46a4-8114-712fceade0fb',
    1000.00,
    'PKR',
    'WTU' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS') || FLOOR(1000 + RANDOM() * 8999)::TEXT,
    0, -- Locked
    NOW(),
    NOW() + INTERVAL '2 minutes',
    TRUE,
    NOW(),
    NOW()
)
RETURNING "Id", "TransactionReference", "Amount", "ExpiresAt";
