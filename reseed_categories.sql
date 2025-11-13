BEGIN;
-- Null product category references so FK doesn't block truncation
UPDATE "Products" SET "CategoryId" = NULL;
-- Truncate categories and reset identity
TRUNCATE TABLE "Categories" RESTART IDENTITY CASCADE;
COMMIT;
