INSERT INTO "OutboxMessages" ("Id", "OccurredOn", "Type", "Payload", "Processed", "ProcessedOn", "Error", "RetryCount")
VALUES ('9a5c4c02-13f4-4f9a-8e19-9e9ba1085b82', NOW(), 'sms', '{"to":"03121562949","template":"PHONE_VERIFY","code":"999111"}', false, NULL, NULL, 0);
