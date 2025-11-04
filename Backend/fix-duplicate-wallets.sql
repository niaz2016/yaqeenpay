-- Find and remove duplicate wallets, keeping only the oldest one for each user

-- Step 1: Show duplicates before deletion
SELECT w."Id", w."UserId", u."Email", w."Balance_Amount", w."CreatedAt", w."IsActive"
FROM "Wallets" w
JOIN "AspNetUsers" u ON w."UserId" = u."Id"
WHERE w."UserId" IN (
    SELECT "UserId"
    FROM "Wallets"
    GROUP BY "UserId"
    HAVING COUNT(*) > 1
)
ORDER BY w."UserId", w."CreatedAt";

-- Step 2: Delete duplicate wallets, keeping only the first one (oldest) for each user
DELETE FROM "Wallets"
WHERE "Id" IN (
    SELECT w."Id"
    FROM (
        SELECT "Id", "UserId",
               ROW_NUMBER() OVER (PARTITION BY "UserId" ORDER BY "CreatedAt") as rn
        FROM "Wallets"
    ) w
    WHERE w.rn > 1
);

-- Step 3: Verify no duplicates remain
SELECT "UserId", COUNT(*) as wallet_count
FROM "Wallets"
GROUP BY "UserId"
HAVING COUNT(*) > 1;

-- Step 4: Show final state
SELECT COUNT(*) as total_wallets, COUNT(DISTINCT "UserId") as unique_users
FROM "Wallets";
