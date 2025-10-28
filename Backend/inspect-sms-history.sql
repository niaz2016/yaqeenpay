SELECT "Id", "OccurredOn", "Processed", "RetryCount", "Error"
FROM "OutboxMessages"
WHERE "Type" = 'sms'
ORDER BY "OccurredOn" DESC
LIMIT 20;
