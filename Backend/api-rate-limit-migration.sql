CREATE TABLE IF NOT EXISTS "ApiRateLimits" (
    "Id" uuid PRIMARY KEY,
    "Identifier" text NOT NULL,
    "Endpoint" text NOT NULL,
    "RequestCount" integer NOT NULL,
    "WindowStart" timestamp with time zone NOT NULL,
    "BlockedUntil" timestamp with time zone NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL
);

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20251025161500_AddApiRateLimitAndCaptcha', '8.0.10')
ON CONFLICT DO NOTHING;
