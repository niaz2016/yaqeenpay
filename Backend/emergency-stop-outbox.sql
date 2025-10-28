-- EMERGENCY: Stop all pending SMS messages immediately
UPDATE "OutboxMessages"
SET "Processed" = true,
    "ProcessedOn" = NOW(),
    "Error" = 'Stopped manually - emergency fix for interval change'
WHERE "Processed" = false AND "Type" = 'sms';

-- Show count of stopped messages
SELECT COUNT(*) as "Stopped SMS Messages" 
FROM "OutboxMessages" 
WHERE "Error" = 'Stopped manually - emergency fix for interval change';
