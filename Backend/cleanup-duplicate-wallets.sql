-- Fix: Delete duplicate wallets and keep only one per user
-- First, identify duplicates
WITH RankedWallets AS (
    SELECT 
        "Id",
        "UserId",
        "Balance",
        ROW_NUMBER() OVER (PARTITION BY "UserId" ORDER BY "CreatedAt" DESC) as rn
    FROM "Wallets"
)
-- Delete all but the most recent wallet for each user
DELETE FROM "Wallets"
WHERE "Id" IN (
    SELECT "Id" FROM RankedWallets WHERE rn > 1
);

-- Show remaining wallets
SELECT "Id", "UserId", "Balance", "Currency" FROM "Wallets";
