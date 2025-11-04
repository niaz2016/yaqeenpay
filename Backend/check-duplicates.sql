SELECT "UserId", COUNT(*) as count 
FROM "Wallets" 
GROUP BY "UserId" 
HAVING COUNT(*) > 1;
