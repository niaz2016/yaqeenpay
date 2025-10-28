-- Check for pending SMS messages
SELECT "Id", "OccurredOn", "Type", "Processed", "RetryCount", "Error", 
       LEFT("Payload", 100) as "PayloadPreview"
FROM "OutboxMessages" 
WHERE "Processed" = false AND "Type" = 'sms' 
ORDER BY "OccurredOn" DESC 
LIMIT 10;

-- Check retry counts
SELECT "Processed", "RetryCount", COUNT(*) as "Count"
FROM "OutboxMessages"
WHERE "Type" = 'sms'
GROUP BY "Processed", "RetryCount"
ORDER BY "Processed", "RetryCount";
