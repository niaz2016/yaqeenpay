-- Backfill ViewCount for all products based on existing PageViews
-- This script updates the ViewCount column in Products table to match the actual number of PageViews

WITH PageViewCounts AS (
    SELECT 
        "ProductId",
        COUNT(*) as view_count
    FROM "PageViews"
    WHERE "ProductId" IS NOT NULL
      AND "PageType" = 'Product'
    GROUP BY "ProductId"
)
UPDATE "Products" p
SET "ViewCount" = COALESCE(pvc.view_count, 0)
FROM PageViewCounts pvc
WHERE p."Id" = pvc."ProductId";

-- Show updated counts
SELECT 
    p."Id",
    p."Name",
    p."ViewCount",
    COALESCE(pv_count.actual_views, 0) as actual_pageviews
FROM "Products" p
LEFT JOIN (
    SELECT "ProductId", COUNT(*) as actual_views
    FROM "PageViews"
    WHERE "ProductId" IS NOT NULL
      AND "PageType" = 'Product'
    GROUP BY "ProductId"
) pv_count ON p."Id" = pv_count."ProductId"
WHERE p."ViewCount" > 0 OR pv_count.actual_views > 0
ORDER BY p."ViewCount" DESC;
