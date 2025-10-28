-- Check for pending SMS messages
SELECT 
    "Id",
    "OccurredOn",
    "Type",
    "Processed",
    "RetryCount",
    "Error",
    LEFT("Payload", 100) as "PayloadPreview"
FROM "OutboxMessages" 
WHERE "Processed" = false AND "Type" = 'sms' 
ORDER BY "OccurredOn" DESC 
LIMIT 10;

-- Mark all pending SMS as processed to stop the spam immediately
UPDATE "OutboxMessages"
SET "Processed" = true,
    "ProcessedOn" = NOW(),
    "Error" = 'Stopped manually - infinite loop fix'
WHERE "Processed" = false 
  AND "Type" = 'sms';

-- Show result
SELECT 'SMS messages stopped:' as "Status", COUNT(*) as "Count"
FROM "OutboxMessages"
WHERE "Type" = 'sms' AND "Error" = 'Stopped manually - infinite loop fix';
