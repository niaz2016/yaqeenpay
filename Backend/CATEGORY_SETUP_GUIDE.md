# Testing the New Hierarchical Categories

## Step 1: Delete Old Database and Create New One

If using Docker/PostgreSQL, run:
```powershell
# Stop the backend container
docker-compose down

# Remove the volume (this deletes the database)
docker volume rm yaqeenpay_postgres_data

# Start fresh
docker-compose up -d
```

OR if using local PostgreSQL:
```sql
-- Connect to PostgreSQL and drop the database
DROP DATABASE IF EXISTS yaqeenpay;
CREATE DATABASE yaqeenpay;
```

## Step 2: Build and Run the Backend

```powershell
cd Backend
dotnet build
dotnet run --project YaqeenPay.API/YaqeenPay.API.csproj
```

The CategorySeedService will automatically run on startup and create:
- **12 Main Categories** (Level 1)
- **70+ Subcategories** (Level 2)
- **18 Brand Categories** (Level 3) under Electronic Devices

## Step 3: Verify Categories

### Test API Endpoint:
```powershell
curl http://localhost:5000/categories
```

Or open in browser:
```
http://localhost:5000/categories
```

### Check Database:
```sql
-- See all categories with hierarchy
SELECT 
    c1."Name" as "Main Category",
    c2."Name" as "Subcategory",
    c3."Name" as "Brand/Third Level"
FROM "Categories" c1
LEFT JOIN "Categories" c2 ON c2."ParentCategoryId" = c1."Id"
LEFT JOIN "Categories" c3 ON c3."ParentCategoryId" = c2."Id"
WHERE c1."ParentCategoryId" IS NULL
ORDER BY c1."Name", c2."Name", c3."Name";

-- Count categories by level
SELECT 
    CASE 
        WHEN "ParentCategoryId" IS NULL THEN 'Level 1 (Main)'
        WHEN "Id" IN (SELECT DISTINCT "ParentCategoryId" FROM "Categories" WHERE "ParentCategoryId" IS NOT NULL) THEN 'Level 2 (Subcategory)'
        ELSE 'Level 3 (Brand)'
    END as "Level",
    COUNT(*) as "Count"
FROM "Categories"
GROUP BY 
    CASE 
        WHEN "ParentCategoryId" IS NULL THEN 'Level 1 (Main)'
        WHEN "Id" IN (SELECT DISTINCT "ParentCategoryId" FROM "Categories" WHERE "ParentCategoryId" IS NOT NULL) THEN 'Level 2 (Subcategory)'
        ELSE 'Level 3 (Brand)'
    END;
```

## Category Structure Created:

### Electronic Devices (3 levels)
```
Electronic Devices
├── Feature Phones
├── Really Like New
├── Security Cameras
├── Gaming Consoles
├── Smart Phones
│   ├── Nokia Mobiles
│   ├── Honor Mobiles
│   ├── Infinix Mobiles
│   ├── Realme Mobiles
│   ├── Redmi Mobiles
│   ├── Oneplus Mobiles
│   ├── Oppo Mobile Phones
│   ├── Apple iPhones
│   ├── Tecno Mobiles
│   ├── Samsung Mobile Phones
│   └── Vivo Mobiles
├── Cameras & Drones
├── Smart Watches
├── Monitors
├── Landline Phones
├── Laptops
│   ├── HP
│   ├── Dell
│   ├── Lenovo
│   ├── Asus
│   ├── Acer
│   ├── Apple MacBook
│   └── MSI
└── Desktops
```

### Other Categories (2 levels - you'll add subcategories yourself)
- Electronic Accessories
- Home Appliances
- Health & Beauty
- Mother & Baby
- Groceries & Pets
- Home & Lifestyle
- Women's Fashion
- Men's Fashion
- Watches, Bags & Jewellery
- Sports & Outdoor
- Automotive & Motorbike

## Next Steps:

1. **Add more subcategories** to the other 11 main categories by:
   - Editing `CategorySeedService.cs` and adding more items to the `subcategories` list
   - OR using the database directly with INSERT statements
   - OR creating an admin API/UI to manage categories

2. **Frontend**: The category service and UI components already support hierarchical categories through the `subCategories` property.

3. **Products**: When creating products, select from the deepest level category (e.g., "Samsung Mobile Phones" instead of "Smart Phones" or "Electronic Devices").
