-- Mark all unprocessed SMS messages as processed to stop the infinite loop
UPDATE "OutboxMessages" 
SET "Processed" = true, 
    "ProcessedOn" = NOW(), 
    "Error" = 'Marked as processed to stop infinite loop - cleanup on 2025-10-25'
WHERE "Type" = 'sms' 
  AND "Processed" = false;

-- Show count of affected messages
SELECT COUNT(*) as cleaned_sms_messages 
FROM "OutboxMessages" 
WHERE "Type" = 'sms' 
  AND "Error" LIKE '%infinite loop%';
