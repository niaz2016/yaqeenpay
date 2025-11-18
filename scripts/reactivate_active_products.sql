-- Reactivate products that are intended to be visible in marketplace
-- Only flip IsActive to TRUE for products that are logically Active
UPDATE "Products"
SET "IsActive" = TRUE,
    "LastModifiedAt" = NOW()
WHERE "IsActive" = FALSE
  AND "Status" = 1; -- ProductStatus.Active

-- Optional: ensure categories referenced by products are active (rarely needed)
-- UPDATE "Categories" c
-- SET "IsActive" = TRUE
-- WHERE EXISTS (
--   SELECT 1 FROM "Products" p WHERE p."CategoryId" = c."Id"
-- ) AND c."IsActive" = FALSE;
