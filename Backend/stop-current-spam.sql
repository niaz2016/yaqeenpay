-- Stop the 2 pending SMS messages
UPDATE "OutboxMessages"
SET "Processed" = true,
    "ProcessedOn" = NOW(),
    "Error" = 'Stopped manually - infinite loop (missing retry limit in deployed code)'
WHERE "Id" IN (
    'e8f5f0d6-2a42-41dd-857d-8bb61d7afc35',
    '4b828bb6-d85f-4d70-b052-10d1355c0441'
);

SELECT 'Stopped ' || COUNT(*) || ' messages' as result
FROM "OutboxMessages"
WHERE "Error" = 'Stopped manually - infinite loop (missing retry limit in deployed code)';
