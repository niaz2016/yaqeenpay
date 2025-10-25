UPDATE "AspNetUsers" 
SET "LockoutEnd" = NULL, 
    "AccessFailedCount" = 0 
WHERE "Email" = 'admin@yaqeenpay.com';

SELECT "Email", "LockoutEnd", "AccessFailedCount" 
FROM "AspNetUsers" 
WHERE "Email" = 'admin@yaqeenpay.com';
