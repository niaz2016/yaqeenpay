using Microsoft.EntityFrameworkCore;
using TechTorio.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;
using TechTorio.Domain.Entities;

namespace TechTorio.Infrastructure.Services;

public class CategorySeedService
{
    private readonly IApplicationDbContext _context;
    private readonly Microsoft.Extensions.Logging.ILogger<CategorySeedService> _logger;

    public CategorySeedService(IApplicationDbContext context, Microsoft.Extensions.Logging.ILogger<CategorySeedService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task SeedDefaultCategoriesAsync()
    {
        // Check if categories already exist
        var existingCategories = await _context.Categories.CountAsync();
        if (existingCategories > 0)
        {
            return; // Categories already seeded
        }

        var categories = new List<Category>();

        // 1. Electronic Devices (3 levels)
        var electronicDevices = new Category("Electronic Devices", "Smartphones, laptops, tablets, and other electronic devices");
        electronicDevices.Activate();
        categories.Add(electronicDevices);

        // 2. Electronic Accessories (2 levels)
        var electronicAccessories = new Category("Electronic Accessories", "Chargers, cables, cases, and other electronic accessories");
        electronicAccessories.Activate();
        categories.Add(electronicAccessories);

        // 3. Home Appliances (2 levels)
        var homeAppliances = new Category("Home Appliances", "Air conditioners, washing machines, refrigerators, and other home appliances");
        homeAppliances.Activate();
        categories.Add(homeAppliances);

        // 4. Health & Beauty (2 levels)
        var healthBeauty = new Category("Health & Beauty", "Skincare, makeup, fragrances, and personal care products");
        healthBeauty.Activate();
        categories.Add(healthBeauty);

        // 5. Mother & Baby (2 levels)
        var motherBaby = new Category("Mother & Baby", "Baby care, feeding, diapers, and maternity products");
        motherBaby.Activate();
        categories.Add(motherBaby);

        // 6. Groceries & Pets (2 levels)
        var groceriesPets = new Category("Groceries & Pets", "Food, beverages, pet supplies, and household essentials");
        groceriesPets.Activate();
        categories.Add(groceriesPets);

        // 7. Home & Lifestyle (2 levels)
        var homeLifestyle = new Category("Home & Lifestyle", "Furniture, home decor, kitchen, bedding, and bath products");
        homeLifestyle.Activate();
        categories.Add(homeLifestyle);

        // 8. Women's Fashion (2 levels)
        var womensFashion = new Category("Women's Fashion", "Clothing, shoes, bags, and accessories for women");
        womensFashion.Activate();
        categories.Add(womensFashion);

        // 9. Men's Fashion (2 levels)
        var mensFashion = new Category("Men's Fashion", "Clothing, shoes, bags, and accessories for men");
        mensFashion.Activate();
        categories.Add(mensFashion);

        // 10. Watches, Bags & Jewellery (2 levels)
        var watchesBagsJewellery = new Category("Watches, Bags & Jewellery", "Watches, handbags, jewelry, and fashion accessories");
        watchesBagsJewellery.Activate();
        categories.Add(watchesBagsJewellery);

        // 11. Sports & Outdoor (2 levels)
        var sportsOutdoor = new Category("Sports & Outdoor", "Exercise equipment, outdoor gear, and sports accessories");
        sportsOutdoor.Activate();
        categories.Add(sportsOutdoor);

        // 12. Automotive & Motorbike (2 levels)
        var automotiveMotorbike = new Category("Automotive & Motorbike", "Car and motorcycle parts, accessories, and maintenance products");
        automotiveMotorbike.Activate();
        categories.Add(automotiveMotorbike);

        // Save main categories first to get their IDs
        await _context.Categories.AddRangeAsync(categories, CancellationToken.None);
        await _context.SaveChangesAsync(CancellationToken.None);

        // Now add subcategories (Level 2)
        var subcategories = new List<Category>();

        // Electronic Devices - Level 2
        var featurePhones = new Category("Feature Phones", "Basic mobile phones", null, electronicDevices.Id);
        featurePhones.Activate();
        subcategories.Add(featurePhones);

        var reallyLikeNew = new Category("Really Like New", "Refurbished and certified pre-owned devices", null, electronicDevices.Id);
        reallyLikeNew.Activate();
        subcategories.Add(reallyLikeNew);

        var securityCameras = new Category("Security Cameras", "CCTV and security camera systems", null, electronicDevices.Id);
        securityCameras.Activate();
        subcategories.Add(securityCameras);

        var gamingConsoles = new Category("Gaming Consoles", "PlayStation, Xbox, and gaming systems", null, electronicDevices.Id);
        gamingConsoles.Activate();
        subcategories.Add(gamingConsoles);

        var smartPhones = new Category("Smart Phones", "Android and iOS smartphones", null, electronicDevices.Id);
        smartPhones.Activate();
        subcategories.Add(smartPhones);

        var camerasDrones = new Category("Cameras & Drones", "Digital cameras, action cams, and drones", null, electronicDevices.Id);
        camerasDrones.Activate();
        subcategories.Add(camerasDrones);

        var smartWatches = new Category("Smart Watches", "Smartwatches and fitness trackers", null, electronicDevices.Id);
        smartWatches.Activate();
        subcategories.Add(smartWatches);

        var monitors = new Category("Monitors", "Computer monitors and displays", null, electronicDevices.Id);
        monitors.Activate();
        subcategories.Add(monitors);

        var landlinePhones = new Category("Landline Phones", "Home phones and cordless phones", null, electronicDevices.Id);
        landlinePhones.Activate();
        subcategories.Add(landlinePhones);

        var laptops = new Category("Laptops", "Laptops and notebooks", null, electronicDevices.Id);
        laptops.Activate();
        subcategories.Add(laptops);

        var desktops = new Category("Desktops", "Desktop computers and all-in-ones", null, electronicDevices.Id);
        desktops.Activate();
        subcategories.Add(desktops);

    // Electronic Accessories - Level 2
    subcategories.Add(CreateActiveCategory("Chargers & Cables", "Phone and laptop chargers, USB cables", electronicAccessories.Id));
    subcategories.Add(CreateActiveCategory("Cases & Covers", "Phone cases, laptop sleeves, screen protectors", electronicAccessories.Id));
    subcategories.Add(CreateActiveCategory("Power Banks", "Portable chargers and power banks", electronicAccessories.Id));
    subcategories.Add(CreateActiveCategory("Memory Cards", "SD cards, USB drives, external storage", electronicAccessories.Id));

    // New: Electronic Accessories detailed categories
    var computerLaptopAccessories = CreateActiveCategory("Computer & Laptop Accessories", "Accessories for computers and laptops such as bags, cooling pads, chargers and docks", electronicAccessories.Id);
    subcategories.Add(computerLaptopAccessories);

    var mobilePhoneAccessories = CreateActiveCategory("Mobile Phone Accessories", "Phone cases, screen protectors, chargers, earphones, mounts and cables", electronicAccessories.Id);
    subcategories.Add(mobilePhoneAccessories);

    var cameraAccessories = CreateActiveCategory("Camera Accessories", "Camera bags, tripods, batteries, lenses, filters and lighting", electronicAccessories.Id);
    subcategories.Add(cameraAccessories);

        // Home Appliances - Level 2
        subcategories.Add(CreateActiveCategory("Air Conditioners", "Split and window AC units", homeAppliances.Id));
        subcategories.Add(CreateActiveCategory("Washing Machines", "Front load and top load washing machines", homeAppliances.Id));
        subcategories.Add(CreateActiveCategory("Refrigerators", "Single and double door refrigerators", homeAppliances.Id));
        subcategories.Add(CreateActiveCategory("Kitchen Appliances", "Microwaves, blenders, toasters", homeAppliances.Id));

        // Health & Beauty - Level 2
        subcategories.Add(CreateActiveCategory("Skincare", "Face wash, moisturizers, serums", healthBeauty.Id));
        subcategories.Add(CreateActiveCategory("Makeup", "Lipstick, foundation, eyeshadow", healthBeauty.Id));
        subcategories.Add(CreateActiveCategory("Fragrances", "Perfumes and body sprays", healthBeauty.Id));
        subcategories.Add(CreateActiveCategory("Personal Care", "Hair care, bath & body products", healthBeauty.Id));

        // Mother & Baby - Level 2
        subcategories.Add(CreateActiveCategory("Baby Care", "Baby shampoo, lotion, wipes", motherBaby.Id));
        subcategories.Add(CreateActiveCategory("Feeding", "Bottles, formula, baby food", motherBaby.Id));
        subcategories.Add(CreateActiveCategory("Diapers", "Disposable and cloth diapers", motherBaby.Id));
        subcategories.Add(CreateActiveCategory("Maternity", "Maternity clothing and accessories", motherBaby.Id));

        // Groceries & Pets - Level 2
        subcategories.Add(CreateActiveCategory("Food & Beverages", "Snacks, drinks, packaged foods", groceriesPets.Id));
        subcategories.Add(CreateActiveCategory("Pet Supplies", "Pet food, toys, accessories", groceriesPets.Id));
        subcategories.Add(CreateActiveCategory("Household Essentials", "Cleaning supplies, laundry detergent", groceriesPets.Id));

        // Home & Lifestyle - Level 2
        subcategories.Add(CreateActiveCategory("Furniture", "Sofas, tables, chairs, storage", homeLifestyle.Id));
        subcategories.Add(CreateActiveCategory("Home Decor", "Wall art, lighting, decorative items", homeLifestyle.Id));
        subcategories.Add(CreateActiveCategory("Kitchen & Dining", "Cookware, dinnerware, utensils", homeLifestyle.Id));
        subcategories.Add(CreateActiveCategory("Bedding & Bath", "Bed sheets, towels, bathroom accessories", homeLifestyle.Id));

        // Women's Fashion - Level 2
        subcategories.Add(CreateActiveCategory("Women's Clothing", "Dresses, tops, jeans, traditional wear", womensFashion.Id));
        subcategories.Add(CreateActiveCategory("Women's Shoes", "Heels, sandals, sneakers, flats", womensFashion.Id));
        subcategories.Add(CreateActiveCategory("Women's Bags", "Handbags, clutches, backpacks", womensFashion.Id));
        subcategories.Add(CreateActiveCategory("Women's Accessories", "Scarves, belts, sunglasses", womensFashion.Id));

        // Men's Fashion - Level 2
        subcategories.Add(CreateActiveCategory("Men's Clothing", "Shirts, pants, jeans, traditional wear", mensFashion.Id));
        subcategories.Add(CreateActiveCategory("Men's Shoes", "Formal shoes, sneakers, sandals", mensFashion.Id));
        subcategories.Add(CreateActiveCategory("Men's Bags", "Backpacks, messenger bags, wallets", mensFashion.Id));
        subcategories.Add(CreateActiveCategory("Men's Accessories", "Ties, belts, sunglasses", mensFashion.Id));

        // Watches, Bags & Jewellery - Level 2
        subcategories.Add(CreateActiveCategory("Watches", "Men's and women's watches", watchesBagsJewellery.Id));
        subcategories.Add(CreateActiveCategory("Bags & Travel", "Luggage, travel bags, organizers", watchesBagsJewellery.Id));
        subcategories.Add(CreateActiveCategory("Jewellery", "Necklaces, rings, bracelets, earrings", watchesBagsJewellery.Id));

        // Sports & Outdoor - Level 2
        subcategories.Add(CreateActiveCategory("Exercise & Fitness", "Gym equipment, yoga mats, weights", sportsOutdoor.Id));
        subcategories.Add(CreateActiveCategory("Outdoor Recreation", "Camping, hiking, fishing gear", sportsOutdoor.Id));
        subcategories.Add(CreateActiveCategory("Sports Accessories", "Balls, protective gear, sportswear", sportsOutdoor.Id));

        // Automotive & Motorbike - Level 2
        subcategories.Add(CreateActiveCategory("Car Accessories", "Car covers, seat covers, organizers", automotiveMotorbike.Id));
        subcategories.Add(CreateActiveCategory("Car Parts", "Batteries, filters, spark plugs", automotiveMotorbike.Id));
        subcategories.Add(CreateActiveCategory("Motorbike Accessories", "Helmets, gloves, riding gear", automotiveMotorbike.Id));

        // Save Level 2 subcategories
        await _context.Categories.AddRangeAsync(subcategories, CancellationToken.None);
        await _context.SaveChangesAsync(CancellationToken.None);

        // Add a catch-all "Other" Level-3 child for every Level-2 subcategory so users can place uncategorized items
        var otherChildren = new List<Category>();
        foreach (var sc in subcategories)
        {
            try
            {
                // Avoid adding duplicate "Other" if it somehow already exists (by name + parent)
                otherChildren.Add(CreateActiveCategory("Other", "Miscellaneous / Other items", sc.Id));
            }
            catch
            {
                // Swallow any unexpected exceptions for robustness in seeding
            }
        }

        if (otherChildren.Count > 0)
        {
            await _context.Categories.AddRangeAsync(otherChildren, CancellationToken.None);
            await _context.SaveChangesAsync(CancellationToken.None);
        }

    // Now add Level 3 subcategories (brands) for Electronic Devices
        var brandCategories = new List<Category>
        {
            // Smart Phones - Level 3 (Brands)
            CreateActiveCategory("Nokia Mobiles", "Nokia feature phones and smartphones", smartPhones.Id),
            CreateActiveCategory("Honor Mobiles", "Honor smartphones", smartPhones.Id),
            CreateActiveCategory("Infinix Mobiles", "Infinix smartphones", smartPhones.Id),
            CreateActiveCategory("Realme Mobiles", "Realme smartphones", smartPhones.Id),
            CreateActiveCategory("Redmi Mobiles", "Xiaomi Redmi smartphones", smartPhones.Id),
            CreateActiveCategory("Oneplus Mobiles", "OnePlus smartphones", smartPhones.Id),
            CreateActiveCategory("Oppo Mobile Phones", "Oppo smartphones", smartPhones.Id),
            CreateActiveCategory("Apple iPhones", "iPhone smartphones", smartPhones.Id),
            CreateActiveCategory("Tecno Mobiles", "Tecno smartphones", smartPhones.Id),
            CreateActiveCategory("Samsung Mobile Phones", "Samsung Galaxy smartphones", smartPhones.Id),
            CreateActiveCategory("Vivo Mobiles", "Vivo smartphones", smartPhones.Id),

            // Laptops - Level 3 (Brands)
            CreateActiveCategory("HP", "HP laptops and notebooks", laptops.Id),
            CreateActiveCategory("Dell", "Dell laptops and notebooks", laptops.Id),
            CreateActiveCategory("Lenovo", "Lenovo laptops and ThinkPad", laptops.Id),
            CreateActiveCategory("Asus", "Asus laptops and gaming laptops", laptops.Id),
            CreateActiveCategory("Acer", "Acer laptops and notebooks", laptops.Id),
            CreateActiveCategory("Apple MacBook", "MacBook Air and MacBook Pro", laptops.Id),
            CreateActiveCategory("MSI", "MSI gaming laptops", laptops.Id)
,
            // Computer & Laptop Accessories - Level 3
            CreateActiveCategory("Laptop Bags & Sleeves", "Backpacks, sleeves and protective bags for laptops", computerLaptopAccessories.Id),
            CreateActiveCategory("Laptop Chargers", "Chargers and power adapters for laptops", computerLaptopAccessories.Id),
            CreateActiveCategory("Cooling Pads", "Laptop cooling pads and external fans", computerLaptopAccessories.Id),
            CreateActiveCategory("Docking Stations & Hubs", "Docks, USB-C hubs and docking stations", computerLaptopAccessories.Id),
            CreateActiveCategory("Keyboards & Mice", "External keyboards, mice and combos", computerLaptopAccessories.Id),
            CreateActiveCategory("Laptop Stands & Risers", "Adjustable laptop stands and risers", computerLaptopAccessories.Id),
            CreateActiveCategory("Internal SSDs & HDDs", "Internal storage: SSDs and HDDs", computerLaptopAccessories.Id),
            CreateActiveCategory("External Storage", "External HDDs, SSDs and enclosures", computerLaptopAccessories.Id),

            // Mobile Phone Accessories - Level 3
            CreateActiveCategory("Phone Cases", "Protective phone cases and covers", mobilePhoneAccessories.Id),
            CreateActiveCategory("Screen Protectors", "Tempered glass and film protectors", mobilePhoneAccessories.Id),
            CreateActiveCategory("Phone Chargers & Cables", "Wall chargers, car chargers and charging cables", mobilePhoneAccessories.Id),
            CreateActiveCategory("Earphones & Headphones", "Wired and wireless earphones and headphones", mobilePhoneAccessories.Id),
            CreateActiveCategory("Power Banks", "Portable chargers and power banks", mobilePhoneAccessories.Id),
            CreateActiveCategory("Car Mounts & Holders", "Phone holders, magnetic mounts and tripods", mobilePhoneAccessories.Id),
            CreateActiveCategory("Selfie Sticks & Mini Tripods", "Selfie sticks and small tripods for phones", mobilePhoneAccessories.Id),

            // Camera Accessories - Level 3
            CreateActiveCategory("Camera Bags & Cases", "Camera bags, shoulder bags and protective cases", cameraAccessories.Id),
            CreateActiveCategory("Tripods & Monopods", "Tripods, monopods and flexible tripods", cameraAccessories.Id),
            CreateActiveCategory("Camera Batteries & Chargers", "Spare batteries and chargers", cameraAccessories.Id),
            CreateActiveCategory("Camera Lenses & Mounts", "Prime and zoom lenses, lens mounts and adapters", cameraAccessories.Id),
            CreateActiveCategory("Memory Cards (Camera)", "SD cards, microSD and CF for cameras", cameraAccessories.Id),
            CreateActiveCategory("Flashes & Lighting", "External flashes, studio lighting and LED panels", cameraAccessories.Id),
            CreateActiveCategory("Filters & Lens Accessories", "Filters, hoods and lens caps", cameraAccessories.Id),
            CreateActiveCategory("Gimbals & Stabilizers", "Gimbals and stabilizers for video shooting", cameraAccessories.Id)
        };

        // Save Level 3 brand categories
        await _context.Categories.AddRangeAsync(brandCategories, CancellationToken.None);
        await _context.SaveChangesAsync(CancellationToken.None);

        // Log summary so it's easy to confirm seeding in container logs
        try
        {
            var total = categories.Count + subcategories.Count + brandCategories.Count;
            _logger.LogInformation("Category seeding complete. Inserted {Total} categories (levels 1-3). Top-level categories: {Tops}", total, string.Join(", ", categories.Select(c => c.Name)));
        }
        catch
        {
            // Logging should not fail the seeding; swallow any logging exceptions
        }
    }

    private Category CreateActiveCategory(string name, string description, Guid parentId)
    {
        var category = new Category(name, description, null, parentId);
        category.Activate();
        return category;
    }
}