CREATE TABLE IF NOT EXISTS "SmsRateLimits" (
    "Id" uuid PRIMARY KEY,
    "DeviceIdentifier" text NOT NULL,
    "PhoneNumber" text NOT NULL,
    "AttemptCount" integer NOT NULL,
    "FirstAttemptAt" timestamp with time zone NOT NULL,
    "BlockedUntil" timestamp with time zone NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL
);

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20251025160013_AddSmsRateLimit', '8.0.10');
