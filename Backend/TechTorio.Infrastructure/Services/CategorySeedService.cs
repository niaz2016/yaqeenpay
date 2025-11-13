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
        // Non-destructive idempotent seeding
        var created = new List<Category>();

        // Top-level categories
        var electronicDevices = await GetOrCreateCategoryAsync("Electronic Devices", "Smartphones, laptops, tablets, and other electronic devices", null, created);
        var electronicAccessories = await GetOrCreateCategoryAsync("Electronic Accessories", "Chargers, cables, cases, and other electronic accessories", null, created);
        var homeAppliances = await GetOrCreateCategoryAsync("Home Appliances", "Air conditioners, washing machines, refrigerators, and other home appliances", null, created);
        var healthBeauty = await GetOrCreateCategoryAsync("Health & Beauty", "Skincare, makeup, fragrances, and personal care products", null, created);
        var motherBaby = await GetOrCreateCategoryAsync("Mother & Baby", "Baby care, feeding, diapers, and maternity products", null, created);
        var groceriesPets = await GetOrCreateCategoryAsync("Groceries & Pets", "Food, beverages, pet supplies, and household essentials", null, created);
        var homeLifestyle = await GetOrCreateCategoryAsync("Home & Lifestyle", "Furniture, home decor, kitchen, bedding, and bath products", null, created);
        var womensFashion = await GetOrCreateCategoryAsync("Women's Fashion", "Clothing, shoes, bags, and accessories for women", null, created);
        var mensFashion = await GetOrCreateCategoryAsync("Men's Fashion", "Clothing, shoes, bags, and accessories for men", null, created);
        var watchesBagsJewellery = await GetOrCreateCategoryAsync("Watches, Bags & Jewellery", "Watches, handbags, jewelry, and fashion accessories", null, created);
        var sportsOutdoor = await GetOrCreateCategoryAsync("Sports & Outdoor", "Exercise equipment, outdoor gear, and sports accessories", null, created);
        var automotiveMotorbike = await GetOrCreateCategoryAsync("Automotive & Motorbike", "Car and motorcycle parts, accessories, and maintenance products", null, created);

        // Level 2 subcategories
        var featurePhones = await GetOrCreateCategoryAsync("Feature Phones", "Basic mobile phones", electronicDevices.Id, created);
        var reallyLikeNew = await GetOrCreateCategoryAsync("Really Like New", "Refurbished and certified pre-owned devices", electronicDevices.Id, created);
        var securityCameras = await GetOrCreateCategoryAsync("Security Cameras", "CCTV and security camera systems", electronicDevices.Id, created);
        var gamingConsoles = await GetOrCreateCategoryAsync("Gaming Consoles", "PlayStation, Xbox, and gaming systems", electronicDevices.Id, created);
        var smartPhones = await GetOrCreateCategoryAsync("Smart Phones", "Android and iOS smartphones", electronicDevices.Id, created);
        var camerasDrones = await GetOrCreateCategoryAsync("Cameras & Drones", "Digital cameras, action cams, and drones", electronicDevices.Id, created);
        var smartWatches = await GetOrCreateCategoryAsync("Smart Watches", "Smartwatches and fitness trackers", electronicDevices.Id, created);
        var monitors = await GetOrCreateCategoryAsync("Monitors", "Computer monitors and displays", electronicDevices.Id, created);
        var landlinePhones = await GetOrCreateCategoryAsync("Landline Phones", "Home phones and cordless phones", electronicDevices.Id, created);
        var laptops = await GetOrCreateCategoryAsync("Laptops", "Laptops and notebooks", electronicDevices.Id, created);
        var desktops = await GetOrCreateCategoryAsync("Desktops", "Desktop computers and all-in-ones", electronicDevices.Id, created);

        // Electronic Accessories detailed categories
        await GetOrCreateCategoryAsync("Chargers & Cables", "Phone and laptop chargers, USB cables", electronicAccessories.Id, created);
        await GetOrCreateCategoryAsync("Cases & Covers", "Phone cases, laptop sleeves, screen protectors", electronicAccessories.Id, created);
        // Note: Power Banks are better as a mobile accessory; keep a Level-2 reference but don't duplicate if mobile PhoneAccessories has it
        await GetOrCreateCategoryAsync("Power Banks", "Portable chargers and power banks", electronicAccessories.Id, created);

        var computerLaptopAccessories = await GetOrCreateCategoryAsync("Computer & Laptop Accessories", "Accessories for computers and laptops such as bags, cooling pads, chargers and docks", electronicAccessories.Id, created);
        var mobilePhoneAccessories = await GetOrCreateCategoryAsync("Mobile Phone Accessories", "Phone cases, screen protectors, chargers, earphones, mounts and cables", electronicAccessories.Id, created);
        var cameraAccessories = await GetOrCreateCategoryAsync("Camera Accessories", "Camera bags, tripods, batteries, lenses, filters and lighting", electronicAccessories.Id, created);

        // Home Appliances - Level 2
        await GetOrCreateCategoryAsync("Air Conditioners", "Split and window AC units", homeAppliances.Id, created);
        await GetOrCreateCategoryAsync("Washing Machines", "Front load and top load washing machines", homeAppliances.Id, created);
        await GetOrCreateCategoryAsync("Refrigerators", "Single and double door refrigerators", homeAppliances.Id, created);
        await GetOrCreateCategoryAsync("Kitchen Appliances", "Microwaves, blenders, toasters", homeAppliances.Id, created);

        // Health & Beauty - Level 2
        await GetOrCreateCategoryAsync("Skincare", "Face wash, moisturizers, serums", healthBeauty.Id, created);
        await GetOrCreateCategoryAsync("Makeup", "Lipstick, foundation, eyeshadow", healthBeauty.Id, created);
        await GetOrCreateCategoryAsync("Fragrances", "Perfumes and body sprays", healthBeauty.Id, created);
        await GetOrCreateCategoryAsync("Personal Care", "Hair care, bath & body products", healthBeauty.Id, created);

        // Mother & Baby - Level 2
        await GetOrCreateCategoryAsync("Baby Care", "Baby shampoo, lotion, wipes", motherBaby.Id, created);
        await GetOrCreateCategoryAsync("Feeding", "Bottles, formula, baby food", motherBaby.Id, created);
        await GetOrCreateCategoryAsync("Diapers", "Disposable and cloth diapers", motherBaby.Id, created);
        await GetOrCreateCategoryAsync("Maternity", "Maternity clothing and accessories", motherBaby.Id, created);

        // Groceries & Pets - Level 2
        await GetOrCreateCategoryAsync("Food & Beverages", "Snacks, drinks, packaged foods", groceriesPets.Id, created);
        await GetOrCreateCategoryAsync("Pet Supplies", "Pet food, toys, accessories", groceriesPets.Id, created);
        await GetOrCreateCategoryAsync("Household Essentials", "Cleaning supplies, laundry detergent", groceriesPets.Id, created);

        // Home & Lifestyle - Level 2
        await GetOrCreateCategoryAsync("Furniture", "Sofas, tables, chairs, storage", homeLifestyle.Id, created);
        await GetOrCreateCategoryAsync("Home Decor", "Wall art, lighting, decorative items", homeLifestyle.Id, created);
        await GetOrCreateCategoryAsync("Kitchen & Dining", "Cookware, dinnerware, utensils", homeLifestyle.Id, created);
        await GetOrCreateCategoryAsync("Bedding & Bath", "Bed sheets, towels, bathroom accessories", homeLifestyle.Id, created);

        // Women's Fashion - Level 2
        await GetOrCreateCategoryAsync("Women's Clothing", "Dresses, tops, jeans, traditional wear", womensFashion.Id, created);
        await GetOrCreateCategoryAsync("Women's Shoes", "Heels, sandals, sneakers, flats", womensFashion.Id, created);
        await GetOrCreateCategoryAsync("Women's Bags", "Handbags, clutches, backpacks", womensFashion.Id, created);
        await GetOrCreateCategoryAsync("Women's Accessories", "Scarves, belts, sunglasses", womensFashion.Id, created);

        // Men's Fashion - Level 2
        await GetOrCreateCategoryAsync("Men's Clothing", "Shirts, pants, jeans, traditional wear", mensFashion.Id, created);
        await GetOrCreateCategoryAsync("Men's Shoes", "Formal shoes, sneakers, sandals", mensFashion.Id, created);
        await GetOrCreateCategoryAsync("Men's Bags", "Backpacks, messenger bags, wallets", mensFashion.Id, created);
        await GetOrCreateCategoryAsync("Men's Accessories", "Ties, belts, sunglasses", mensFashion.Id, created);

        // Watches, Bags & Jewellery - Level 2
        await GetOrCreateCategoryAsync("Watches", "Men's and women's watches", watchesBagsJewellery.Id, created);
        await GetOrCreateCategoryAsync("Bags & Travel", "Luggage, travel bags, organizers", watchesBagsJewellery.Id, created);
        await GetOrCreateCategoryAsync("Jewellery", "Necklaces, rings, bracelets, earrings", watchesBagsJewellery.Id, created);

        // Sports & Outdoor - Level 2
        await GetOrCreateCategoryAsync("Exercise & Fitness", "Gym equipment, yoga mats, weights", sportsOutdoor.Id, created);
        await GetOrCreateCategoryAsync("Outdoor Recreation", "Camping, hiking, fishing gear", sportsOutdoor.Id, created);
        await GetOrCreateCategoryAsync("Sports Accessories", "Balls, protective gear, sportswear", sportsOutdoor.Id, created);

        // Automotive & Motorbike - Level 2
        var carAccessories = await GetOrCreateCategoryAsync("Car Accessories", "Car covers, seat covers, organizers, and interior accessories", automotiveMotorbike.Id, created);
        var carParts = await GetOrCreateCategoryAsync("Car Parts", "Batteries, filters, spark plugs, and replacement parts", automotiveMotorbike.Id, created);
        var motorbikeAccessories = await GetOrCreateCategoryAsync("Motorbike Accessories", "Helmets, gloves, riding gear, and bike accessories", automotiveMotorbike.Id, created);
        var motorbikeParts = await GetOrCreateCategoryAsync("Motorbike Parts", "Engine parts, brakes, tires, and replacement parts", automotiveMotorbike.Id, created);
        var carElectronics = await GetOrCreateCategoryAsync("Car Electronics", "GPS, dashcams, audio systems, and car tech", automotiveMotorbike.Id, created);
        var carCare = await GetOrCreateCategoryAsync("Car Care & Maintenance", "Cleaning products, tools, and maintenance items", automotiveMotorbike.Id, created);
        var tiresWheels = await GetOrCreateCategoryAsync("Tires & Wheels", "Car and bike tires, rims, and wheel accessories", automotiveMotorbike.Id, created);
        var oilsFluids = await GetOrCreateCategoryAsync("Oils & Fluids", "Engine oil, brake fluid, coolants, and lubricants", automotiveMotorbike.Id, created);

        // Add generic "Other" Level-2 category for each top-level category (idempotent)
        await GetOrCreateCategoryAsync("Other Electronic Devices", "Other electronic devices not listed above", electronicDevices.Id, created);
        await GetOrCreateCategoryAsync("Other Electronic Accessories", "Other electronic accessories not listed above", electronicAccessories.Id, created);
        await GetOrCreateCategoryAsync("Other Home Appliances", "Other home appliances not listed above", homeAppliances.Id, created);
        await GetOrCreateCategoryAsync("Other Health & Beauty", "Other health & beauty products not listed above", healthBeauty.Id, created);
        await GetOrCreateCategoryAsync("Other Mother & Baby", "Other mother & baby products not listed above", motherBaby.Id, created);
        await GetOrCreateCategoryAsync("Other Groceries & Pets", "Other groceries & pet products not listed above", groceriesPets.Id, created);
        await GetOrCreateCategoryAsync("Other Home & Lifestyle", "Other home & lifestyle products not listed above", homeLifestyle.Id, created);
        await GetOrCreateCategoryAsync("Other Women's Fashion", "Other women's fashion items not listed above", womensFashion.Id, created);
        await GetOrCreateCategoryAsync("Other Men's Fashion", "Other men's fashion items not listed above", mensFashion.Id, created);
        await GetOrCreateCategoryAsync("Other Watches, Bags & Jewellery", "Other watches, bags & jewellery items not listed above", watchesBagsJewellery.Id, created);
        await GetOrCreateCategoryAsync("Other Sports & Outdoor", "Other sports & outdoor items not listed above", sportsOutdoor.Id, created);
        await GetOrCreateCategoryAsync("Other Automotive & Motorbike", "Other automotive & motorbike items not listed above", automotiveMotorbike.Id, created);

        // Level 3 brand / type categories (Electronic Devices + accessories + automotive)
        // Smart Phones - Level 3 (Brands)
        await GetOrCreateCategoryAsync("Nokia Mobiles", "Nokia feature phones and smartphones", smartPhones.Id, created);
        await GetOrCreateCategoryAsync("Honor Mobiles", "Honor smartphones", smartPhones.Id, created);
        await GetOrCreateCategoryAsync("Infinix Mobiles", "Infinix smartphones", smartPhones.Id, created);
        await GetOrCreateCategoryAsync("Realme Mobiles", "Realme smartphones", smartPhones.Id, created);
        await GetOrCreateCategoryAsync("Redmi Mobiles", "Xiaomi Redmi smartphones", smartPhones.Id, created);
        await GetOrCreateCategoryAsync("Oneplus Mobiles", "OnePlus smartphones", smartPhones.Id, created);
        await GetOrCreateCategoryAsync("Oppo Mobile Phones", "Oppo smartphones", smartPhones.Id, created);
        await GetOrCreateCategoryAsync("Apple iPhones", "iPhone smartphones", smartPhones.Id, created);
        await GetOrCreateCategoryAsync("Tecno Mobiles", "Tecno smartphones", smartPhones.Id, created);
        await GetOrCreateCategoryAsync("Samsung Mobile Phones", "Samsung Galaxy smartphones", smartPhones.Id, created);
        await GetOrCreateCategoryAsync("Vivo Mobiles", "Vivo smartphones", smartPhones.Id, created);

        // Laptops - Level 3 (Brands)
        await GetOrCreateCategoryAsync("HP", "HP laptops and notebooks", laptops.Id, created);
        await GetOrCreateCategoryAsync("Dell", "Dell laptops and notebooks", laptops.Id, created);
        await GetOrCreateCategoryAsync("Lenovo", "Lenovo laptops and ThinkPad", laptops.Id, created);
        await GetOrCreateCategoryAsync("Asus", "Asus laptops and gaming laptops", laptops.Id, created);
        await GetOrCreateCategoryAsync("Acer", "Acer laptops and notebooks", laptops.Id, created);
        await GetOrCreateCategoryAsync("Apple MacBook", "MacBook Air and MacBook Pro", laptops.Id, created);
        await GetOrCreateCategoryAsync("MSI", "MSI gaming laptops", laptops.Id, created);

        // Desktops - Level 3 (Brands)
        await GetOrCreateCategoryAsync("HP Desktops", "HP desktop computers and all-in-ones", desktops.Id, created);
        await GetOrCreateCategoryAsync("Dell Desktops", "Dell desktop computers and workstations", desktops.Id, created);
        await GetOrCreateCategoryAsync("Lenovo Desktops", "Lenovo desktop computers", desktops.Id, created);
        await GetOrCreateCategoryAsync("Asus Desktops", "Asus desktop computers", desktops.Id, created);
        await GetOrCreateCategoryAsync("Acer Desktops", "Acer desktop computers", desktops.Id, created);
        await GetOrCreateCategoryAsync("Apple iMac", "iMac and Mac Mini", desktops.Id, created);
        await GetOrCreateCategoryAsync("Custom Built PCs", "Custom built desktop computers", desktops.Id, created);

        // Gaming Consoles - Level 3
        await GetOrCreateCategoryAsync("PlayStation", "Sony PlayStation consoles and games", gamingConsoles.Id, created);
        await GetOrCreateCategoryAsync("Xbox", "Microsoft Xbox consoles and games", gamingConsoles.Id, created);
        await GetOrCreateCategoryAsync("Nintendo Switch", "Nintendo Switch consoles and games", gamingConsoles.Id, created);
        await GetOrCreateCategoryAsync("Gaming Accessories", "Controllers, headsets, and gaming peripherals", gamingConsoles.Id, created);

        // Cameras & Drones - Level 3
        await GetOrCreateCategoryAsync("DSLR Cameras", "Canon, Nikon DSLR cameras", camerasDrones.Id, created);
        await GetOrCreateCategoryAsync("Mirrorless Cameras", "Sony, Fujifilm mirrorless cameras", camerasDrones.Id, created);
        await GetOrCreateCategoryAsync("Action Cameras", "GoPro and action cameras", camerasDrones.Id, created);
        await GetOrCreateCategoryAsync("Instant Cameras", "Polaroid and instant cameras", camerasDrones.Id, created);
        await GetOrCreateCategoryAsync("Drones", "DJI and other drones", camerasDrones.Id, created);
        await GetOrCreateCategoryAsync("Camcorders", "Video cameras and camcorders", camerasDrones.Id, created);

        // Smart Watches - Level 3
        await GetOrCreateCategoryAsync("Apple Watch", "Apple Watch and bands", smartWatches.Id, created);
        await GetOrCreateCategoryAsync("Samsung Galaxy Watch", "Samsung smartwatches", smartWatches.Id, created);
        await GetOrCreateCategoryAsync("Fitbit", "Fitbit fitness trackers", smartWatches.Id, created);
        await GetOrCreateCategoryAsync("Garmin", "Garmin smartwatches and fitness trackers", smartWatches.Id, created);
        await GetOrCreateCategoryAsync("Amazfit", "Amazfit smartwatches", smartWatches.Id, created);
        await GetOrCreateCategoryAsync("Huawei Watch", "Huawei smartwatches", smartWatches.Id, created);

        // Monitors - Level 3
        await GetOrCreateCategoryAsync("Gaming Monitors", "High refresh rate gaming monitors", monitors.Id, created);
        await GetOrCreateCategoryAsync("4K Monitors", "4K UHD monitors", monitors.Id, created);
        await GetOrCreateCategoryAsync("Ultrawide Monitors", "Ultrawide curved monitors", monitors.Id, created);
        await GetOrCreateCategoryAsync("Portable Monitors", "USB-C portable monitors", monitors.Id, created);

        // Security Cameras - Level 3
        await GetOrCreateCategoryAsync("IP Cameras", "Network IP security cameras", securityCameras.Id, created);
        await GetOrCreateCategoryAsync("CCTV Systems", "Complete CCTV camera systems", securityCameras.Id, created);
        await GetOrCreateCategoryAsync("Smart Doorbells", "Video doorbell cameras", securityCameras.Id, created);
        await GetOrCreateCategoryAsync("Baby Monitors", "Baby monitor cameras", securityCameras.Id, created);

        // Feature Phones - Level 3
        await GetOrCreateCategoryAsync("Nokia Feature Phones", "Nokia basic phones", featurePhones.Id, created);
        await GetOrCreateCategoryAsync("Samsung Feature Phones", "Samsung basic phones", featurePhones.Id, created);
        await GetOrCreateCategoryAsync("Other Feature Phones", "Other basic phone brands", featurePhones.Id, created);

        // Computer & Laptop Accessories - Level 3
        await GetOrCreateCategoryAsync("Laptop Bags & Sleeves", "Backpacks, sleeves and protective bags for laptops", computerLaptopAccessories.Id, created);
        await GetOrCreateCategoryAsync("Laptop Chargers", "Chargers and power adapters for laptops", computerLaptopAccessories.Id, created);
        await GetOrCreateCategoryAsync("Cooling Pads", "Laptop cooling pads and external fans", computerLaptopAccessories.Id, created);
        await GetOrCreateCategoryAsync("Docking Stations & Hubs", "Docks, USB-C hubs and docking stations", computerLaptopAccessories.Id, created);
        await GetOrCreateCategoryAsync("Keyboards & Mice", "External keyboards, mice and combos", computerLaptopAccessories.Id, created);
        await GetOrCreateCategoryAsync("Laptop Stands & Risers", "Adjustable laptop stands and risers", computerLaptopAccessories.Id, created);
        await GetOrCreateCategoryAsync("Internal SSDs & HDDs", "Internal storage: SSDs and HDDs", computerLaptopAccessories.Id, created);
        await GetOrCreateCategoryAsync("External Storage", "External HDDs, SSDs and enclosures", computerLaptopAccessories.Id, created);

        // Mobile Phone Accessories - Level 3
        await GetOrCreateCategoryAsync("Phone Cases", "Protective phone cases and covers", mobilePhoneAccessories.Id, created);
        await GetOrCreateCategoryAsync("Screen Protectors", "Tempered glass and film protectors", mobilePhoneAccessories.Id, created);
        await GetOrCreateCategoryAsync("Phone Chargers & Cables", "Wall chargers, car chargers and charging cables", mobilePhoneAccessories.Id, created);
        await GetOrCreateCategoryAsync("Earphones & Headphones", "Wired and wireless earphones and headphones", mobilePhoneAccessories.Id, created);
        await GetOrCreateCategoryAsync("Power Banks", "Portable chargers and power banks", mobilePhoneAccessories.Id, created);
        await GetOrCreateCategoryAsync("Memory Cards", "SD cards, microSD and USB storage for phones", mobilePhoneAccessories.Id, created);
        await GetOrCreateCategoryAsync("Car Mounts & Holders", "Phone holders, magnetic mounts and tripods", mobilePhoneAccessories.Id, created);
        await GetOrCreateCategoryAsync("Selfie Sticks & Mini Tripods", "Selfie sticks and small tripods for phones", mobilePhoneAccessories.Id, created);

        // Camera Accessories - Level 3
        await GetOrCreateCategoryAsync("Camera Bags & Cases", "Camera bags, shoulder bags and protective cases", cameraAccessories.Id, created);
        await GetOrCreateCategoryAsync("Tripods & Monopods", "Tripods, monopods and flexible tripods", cameraAccessories.Id, created);
        await GetOrCreateCategoryAsync("Camera Batteries & Chargers", "Spare batteries and chargers", cameraAccessories.Id, created);
        await GetOrCreateCategoryAsync("Camera Lenses & Mounts", "Prime and zoom lenses, lens mounts and adapters", cameraAccessories.Id, created);
        await GetOrCreateCategoryAsync("Memory Cards (Camera)", "SD cards, microSD and CF for cameras", cameraAccessories.Id, created);
        await GetOrCreateCategoryAsync("Flashes & Lighting", "External flashes, studio lighting and LED panels", cameraAccessories.Id, created);
        await GetOrCreateCategoryAsync("Filters & Lens Accessories", "Filters, hoods and lens caps", cameraAccessories.Id, created);
        await GetOrCreateCategoryAsync("Gimbals & Stabilizers", "Gimbals and stabilizers for video shooting", cameraAccessories.Id, created);

        // Car Accessories - Level 3
        await GetOrCreateCategoryAsync("Seat Covers & Cushions", "Seat covers, cushions and seat organizers", carAccessories.Id, created);
        await GetOrCreateCategoryAsync("Car Covers & Tarps", "Outdoor and indoor car covers", carAccessories.Id, created);
        await GetOrCreateCategoryAsync("Interior Accessories", "Dashboard accessories, steering wheel covers, floor mats", carAccessories.Id, created);
        await GetOrCreateCategoryAsync("Organizers & Storage", "Trunk organizers, backseat organizers, cup holders", carAccessories.Id, created);
        await GetOrCreateCategoryAsync("Sun Shades & Visors", "Windshield sun shades and window visors", carAccessories.Id, created);
        await GetOrCreateCategoryAsync("Air Fresheners", "Car air fresheners and deodorizers", carAccessories.Id, created);

        // Car Parts - Level 3
        await GetOrCreateCategoryAsync("Batteries & Accessories", "Car batteries, jump starters, battery chargers", carParts.Id, created);
        await GetOrCreateCategoryAsync("Filters", "Air filters, oil filters, fuel filters, cabin filters", carParts.Id, created);
        await GetOrCreateCategoryAsync("Spark Plugs & Ignition", "Spark plugs, ignition coils, wires", carParts.Id, created);
        await GetOrCreateCategoryAsync("Brake Parts", "Brake pads, rotors, brake fluid, calipers", carParts.Id, created);
        await GetOrCreateCategoryAsync("Engine Parts", "Belts, hoses, gaskets, engine components", carParts.Id, created);
        await GetOrCreateCategoryAsync("Lighting", "Headlights, tail lights, LED lights, bulbs", carParts.Id, created);
        await GetOrCreateCategoryAsync("Wiper Blades", "Windshield wiper blades and refills", carParts.Id, created);
        await GetOrCreateCategoryAsync("Suspension Parts", "Shocks, struts, springs, bushings", carParts.Id, created);

        // Motorbike Accessories - Level 3
        await GetOrCreateCategoryAsync("Helmets", "Full-face, half-face, modular helmets", motorbikeAccessories.Id, created);
        await GetOrCreateCategoryAsync("Riding Gear", "Jackets, pants, gloves, boots, riding suits", motorbikeAccessories.Id, created);
        await GetOrCreateCategoryAsync("Protective Gear", "Knee pads, elbow pads, chest protectors, back protectors", motorbikeAccessories.Id, created);
        await GetOrCreateCategoryAsync("Bike Covers", "Motorcycle covers and bike protection", motorbikeAccessories.Id, created);
        await GetOrCreateCategoryAsync("Luggage & Bags", "Saddlebags, tank bags, tail bags, backpacks", motorbikeAccessories.Id, created);
        await GetOrCreateCategoryAsync("Mirrors & Accessories", "Side mirrors, handlebar accessories, grips", motorbikeAccessories.Id, created);

        // Motorbike Parts - Level 3
        await GetOrCreateCategoryAsync("Bike Batteries", "Motorcycle batteries and charging systems", motorbikeParts.Id, created);
        await GetOrCreateCategoryAsync("Bike Filters & Oil", "Air filters, oil filters, engine oil", motorbikeParts.Id, created);
        await GetOrCreateCategoryAsync("Brake Parts (Bike)", "Brake pads, discs, brake fluid for bikes", motorbikeParts.Id, created);
        await GetOrCreateCategoryAsync("Chain & Sprockets", "Drive chains, sprockets, chain lubricants", motorbikeParts.Id, created);
        await GetOrCreateCategoryAsync("Exhaust Systems", "Exhaust pipes, mufflers, silencers", motorbikeParts.Id, created);
        await GetOrCreateCategoryAsync("Bike Lighting", "Headlights, indicators, LED lights for bikes", motorbikeParts.Id, created);

        // Car Electronics - Level 3
        await GetOrCreateCategoryAsync("GPS & Navigation", "GPS devices, car navigation systems", carElectronics.Id, created);
        await GetOrCreateCategoryAsync("Dash Cams", "Dashboard cameras and recording systems", carElectronics.Id, created);
        await GetOrCreateCategoryAsync("Car Audio Systems", "Car stereos, speakers, amplifiers, subwoofers", carElectronics.Id, created);
        await GetOrCreateCategoryAsync("Bluetooth & Adapters", "Bluetooth adapters, FM transmitters, aux cables", carElectronics.Id, created);
        await GetOrCreateCategoryAsync("Parking Sensors & Cameras", "Reverse cameras, parking sensors, 360 cameras", carElectronics.Id, created);
        await GetOrCreateCategoryAsync("Car Alarms & Security", "Alarm systems, GPS trackers, immobilizers", carElectronics.Id, created);

        // Car Care & Maintenance - Level 3
        await GetOrCreateCategoryAsync("Car Wash & Cleaning", "Car shampoo, wax, detailing products", carCare.Id, created);
        await GetOrCreateCategoryAsync("Polishing & Wax", "Car polish, wax, scratch removers", carCare.Id, created);
        await GetOrCreateCategoryAsync("Interior Cleaners", "Dashboard cleaners, leather cleaners, fabric cleaners", carCare.Id, created);
        await GetOrCreateCategoryAsync("Tools & Equipment", "Jacks, wrenches, tool kits, air compressors", carCare.Id, created);
        await GetOrCreateCategoryAsync("Microfiber Cloths", "Cleaning cloths, drying towels, applicators", carCare.Id, created);

        // Tires & Wheels - Level 3
        await GetOrCreateCategoryAsync("Car Tires", "All-season, summer, winter car tires", tiresWheels.Id, created);
        await GetOrCreateCategoryAsync("Motorbike Tires", "Sport, touring, off-road bike tires", tiresWheels.Id, created);
        await GetOrCreateCategoryAsync("Alloy Wheels & Rims", "Alloy wheels, steel rims, wheel covers", tiresWheels.Id, created);
        await GetOrCreateCategoryAsync("Tire Accessories", "Tire pressure gauges, inflators, valve caps", tiresWheels.Id, created);

        // Oils & Fluids - Level 3
        await GetOrCreateCategoryAsync("Engine Oil", "Synthetic, semi-synthetic, mineral engine oil", oilsFluids.Id, created);
        await GetOrCreateCategoryAsync("Brake Fluid", "DOT 3, DOT 4, DOT 5.1 brake fluids", oilsFluids.Id, created);
        await GetOrCreateCategoryAsync("Coolants & Antifreeze", "Engine coolants and antifreeze", oilsFluids.Id, created);
        await GetOrCreateCategoryAsync("Transmission Fluid", "Automatic and manual transmission fluids", oilsFluids.Id, created);
        await GetOrCreateCategoryAsync("Lubricants & Greases", "General lubricants, chassis grease, penetrating oil", oilsFluids.Id, created);

        // Log summary so it's easy to confirm seeding in container logs
        try
        {
            var total = created.Count;
            _logger.LogInformation("Category seeding complete. Inserted {Total} categories (levels 1-3) (idempotent). Top-level categories: {Tops}", total, string.Join(", ", new[] { electronicDevices.Name, electronicAccessories.Name, homeAppliances.Name, healthBeauty.Name, motherBaby.Name, groceriesPets.Name, homeLifestyle.Name, womensFashion.Name, mensFashion.Name, watchesBagsJewellery.Name, sportsOutdoor.Name, automotiveMotorbike.Name }));
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

    private async Task<Category> GetOrCreateCategoryAsync(string name, string description, Guid? parentId, List<Category> created)
    {
        // Try to find existing category by name and parent
        var existing = await _context.Categories.FirstOrDefaultAsync(c => c.Name == name && c.ParentCategoryId == parentId);
        if (existing != null)
        {
            try
            {
                // If it exists but is not active, activate it
                var prop = existing.GetType().GetProperty("IsActive");
                if (prop != null && prop.PropertyType == typeof(bool) && !(bool)prop.GetValue(existing)!)
                {
                    existing.Activate();
                    _context.Categories.Update(existing);
                    await _context.SaveChangesAsync(CancellationToken.None);
                }
            }
            catch
            {
                // ignore activation failures
            }
            return existing;
        }

        var category = new Category(name, description, null, parentId);
        category.Activate();
        _context.Categories.Add(category);
        await _context.SaveChangesAsync(CancellationToken.None);
        created.Add(category);
        return category;
    }
}