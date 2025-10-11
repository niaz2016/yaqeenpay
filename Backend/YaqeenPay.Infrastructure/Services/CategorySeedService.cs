using Microsoft.EntityFrameworkCore;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Domain.Entities;

namespace YaqeenPay.Infrastructure.Services;

public class CategorySeedService
{
    private readonly IApplicationDbContext _context;

    public CategorySeedService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task SeedDefaultCategoriesAsync()
    {
        // Check if categories already exist
        var existingCategories = await _context.Categories.CountAsync();
        if (existingCategories > 0)
        {
            return; // Categories already seeded
        }

        var categories = new List<Category>
        {
            new Category("Electronics", "Smartphones, laptops, computers, cameras, and video games"),
            new Category("Fashion", "Clothing, shoes, jewelry, and accessories like handbags and watches"),
            new Category("Home and Kitchen", "Furniture, decor, kitchen appliances, and home security items"),
            new Category("Beauty and Personal Care", "Cosmetics, skincare, and personal care appliances"),
            new Category("Food and Beverage", "Packaged foods, beverages, and gourmet items"),
            new Category("Sports and Outdoors", "Exercise equipment, outdoor gear, and sports accessories"),
            new Category("Books and Media", "Physical and digital books, magazines, and educational materials"),
            new Category("Toys and Games", "Children's toys, board games, and educational games"),
            new Category("Automotive", "Car accessories, parts, and maintenance products"),
            new Category("Health and Wellness", "Vitamins, medical supplies, and health monitoring devices"),
            new Category("Pet Supplies", "Pet food, toys, accessories, and healthcare products"),
            new Category("Office Supplies", "Stationery, office equipment, and organizational tools")
        };

        foreach (var category in categories)
        {
            category.Activate(); // Make sure they're active
        }

        await _context.Categories.AddRangeAsync(categories, CancellationToken.None);
        await _context.SaveChangesAsync(CancellationToken.None);
    }
}