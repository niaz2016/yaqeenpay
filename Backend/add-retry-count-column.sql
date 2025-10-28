-- Add RetryCount column to OutboxMessages table
-- This prevents infinite OTP spam by limiting retry attempts

ALTER TABLE "OutboxMessages" 
ADD COLUMN IF NOT EXISTS "RetryCount" INTEGER NOT NULL DEFAULT 0;

-- Update existing failed messages to have retry count = 3 to stop them from retrying
UPDATE "OutboxMessages"
SET "RetryCount" = 3
WHERE "Processed" = false 
  AND "Error" IS NOT NULL;

-- Show status
SELECT 
    "Type",
    "Processed",
    COUNT(*) as "Count",
    AVG("RetryCount") as "AvgRetries"
FROM "OutboxMessages"
GROUP BY "Type", "Processed"
ORDER BY "Type", "Processed";
