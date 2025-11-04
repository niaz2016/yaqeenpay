-- Check for duplicate wallets per user
SELECT "UserId", COUNT(*) as wallet_count
FROM "Wallets"
GROUP BY "UserId"
HAVING COUNT(*) > 1;

-- Show all wallets with their user emails for duplicates
SELECT w."Id", w."UserId", u."Email", w."Balance_Amount", w."IsActive"
FROM "Wallets" w
JOIN "AspNetUsers" u ON w."UserId" = u."Id"
WHERE w."UserId" IN (
    SELECT "UserId"
    FROM "Wallets"
    GROUP BY "UserId"
    HAVING COUNT(*) > 1
)
ORDER BY w."UserId", w."Id";
