-- Migration script to update existing categories to new hierarchical structure
-- Run this script if you already have categories in your database

-- IMPORTANT: Replace <ADMIN_USER_GUID> with an actual admin user GUID from your AspNetUsers table
-- Example: SELECT "Id" FROM "AspNetUsers" WHERE "Email" = 'admin@example.com' LIMIT 1;

-- Step 1: Backup existing categories (optional but recommended)
-- CREATE TABLE "Categories_Backup" AS SELECT * FROM "Categories";

-- Step 2: Clear existing categories and related data
-- WARNING: This will delete all existing categories and may affect products
-- Make sure to backup your data first!

-- Delete existing categories (cascade will handle subcategories)
DELETE FROM "Categories";

-- Step 3: Insert new main categories (Level 1)
-- You can run this manually or let the seed service handle it by clearing the table

-- Alternative: If you want to preserve existing products, you'll need to:
-- 1. Map old category IDs to new category IDs
-- 2. Update Products table with new CategoryIds
-- 3. Then delete old categories

-- For a fresh start (recommended if no products exist or data can be re-entered):
-- Just delete all categories and restart the application
-- The CategorySeedService will automatically populate the new structure

-- To delete all categories:
-- DELETE FROM "Categories";

-- To check current categories:
SELECT "Id", "Name", "ParentCategoryId", "IsActive" 
FROM "Categories" 
ORDER BY "ParentCategoryId" NULLS FIRST, "Name";

-- To find an admin user GUID for manual inserts:
-- SELECT "Id", "UserName", "Email" 
-- FROM "AspNetUsers" 
-- WHERE "Email" LIKE '%admin%' OR "UserName" LIKE '%admin%'
-- LIMIT 5;
