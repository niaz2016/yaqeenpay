using YaqeenPay.Domain.Common;
using YaqeenPay.Domain.ValueObjects;
using YaqeenPay.Domain.Enums;

namespace YaqeenPay.Domain.Entities;
public class ProductVariant
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string? Size { get; set; }
    public string? Color { get; set; }
    public decimal? Price { get; set; }
    public int? StockQuantity { get; set; }
    public string? Sku { get; set; }
}

public class Product : AuditableEntity
{
    public Guid SellerId { get; private set; }
    public Guid CategoryId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public string? ShortDescription { get; private set; }
    public Money Price { get; private set; } = null!;
    public Money? DiscountPrice { get; private set; }
    public string Sku { get; private set; } = string.Empty;
    public int StockQuantity { get; private set; } = 0;
    public int MinOrderQuantity { get; private set; } = 1;
    public int MaxOrderQuantity { get; private set; } = 999999;
    public decimal Weight { get; private set; } = 0;
    public string? WeightUnit { get; private set; } = "kg";
    public string? Dimensions { get; private set; }
    public string? Brand { get; private set; }
    public string? Model { get; private set; }
    public string? Color { get; private set; }
    public string? Size { get; private set; }
    public string? Material { get; private set; }
    public ProductStatus Status { get; private set; } = ProductStatus.Draft;
    public bool IsFeatured { get; private set; } = false;
    public bool AllowBackorders { get; private set; } = false;
    public int ViewCount { get; private set; } = 0;
    public decimal AverageRating { get; private set; } = 0;
    public int ReviewCount { get; private set; } = 0;
    public DateTime? FeaturedUntil { get; private set; }
    public List<string> Tags { get; private set; } = new List<string>();
    public Dictionary<string, string> Attributes { get; private set; } = new Dictionary<string, string>();

    // Navigation properties
    public virtual Identity.ApplicationUser Seller { get; set; } = null!;
    public virtual Category Category { get; set; } = null!;
    public virtual ICollection<ProductImage> ProductImages { get; private set; } = new List<ProductImage>();
    public virtual ICollection<CartItem> CartItems { get; private set; } = new List<CartItem>();
    public virtual ICollection<OrderItem> OrderItems { get; private set; } = new List<OrderItem>();
    public virtual ICollection<ProductVariant> Variants { get; set; } = new List<ProductVariant>();

    private Product() { } // For EF Core

    public Product(
        Guid sellerId,
        Guid categoryId,
        string name,
        string description,
        Money price,
        string sku,
        int stockQuantity = 0)
    {
        SellerId = sellerId;
        CategoryId = categoryId;
        Name = name;
        Description = description;
        Price = price;
        Sku = sku;
        StockQuantity = stockQuantity;
    }

    public void UpdateBasicInfo(string name, string description, string? shortDescription = null)
    {
        Name = name;
        Description = description;
        ShortDescription = shortDescription;
    }

    public void UpdatePricing(Money price, Money? discountPrice = null)
    {
        Price = price;
        DiscountPrice = discountPrice;
    }

    public void UpdateInventory(int stockQuantity, bool allowBackorders = false)
    {
        StockQuantity = stockQuantity;
        AllowBackorders = allowBackorders;
    }

    public void UpdateCategory(Guid categoryId)
    {
        CategoryId = categoryId;
    }

    public void UpdateSku(string sku)
    {
        Sku = sku;
    }

    public void UpdateOrderLimits(int minOrderQuantity, int maxOrderQuantity)
    {
        MinOrderQuantity = minOrderQuantity;
        MaxOrderQuantity = maxOrderQuantity;
    }

    public void UpdatePhysicalProperties(decimal weight, string weightUnit, string? dimensions = null)
    {
        Weight = weight;
        WeightUnit = weightUnit;
        Dimensions = dimensions;
    }

    public void UpdateProductDetails(string? brand = null, string? model = null, string? color = null, 
        string? size = null, string? material = null)
    {
        Brand = brand;
        Model = model;
        Color = color;
        Size = size;
        Material = material;
    }

    public void UpdateStatus(ProductStatus status)
    {
        Status = status;
    }

    public void SetFeatured(DateTime? featuredUntil = null)
    {
        IsFeatured = true;
        FeaturedUntil = featuredUntil;
    }

    public void RemoveFeatured()
    {
        IsFeatured = false;
        FeaturedUntil = null;
    }

    public void IncrementViewCount()
    {
        ViewCount++;
    }

    public void UpdateRating(decimal averageRating, int reviewCount)
    {
        AverageRating = averageRating;
        ReviewCount = reviewCount;
    }

    public void UpdateTags(List<string> tags)
    {
        Tags = tags != null ? new List<string>(tags) : new List<string>();
    }

    public void UpdateAttributes(Dictionary<string, string> attributes)
    {
        Attributes = attributes != null ? new Dictionary<string, string>(attributes) : new Dictionary<string, string>();
    }

    public bool IsInStock()
    {
        return StockQuantity > 0 || AllowBackorders;
    }

    public bool CanOrderQuantity(int quantity)
    {
        return quantity >= MinOrderQuantity && 
               quantity <= MaxOrderQuantity && 
               (StockQuantity >= quantity || AllowBackorders);
    }

    public Money GetEffectivePrice()
    {
        return DiscountPrice ?? Price;
    }

    public bool IsOnSale()
    {
        return DiscountPrice != null;
    }

    public decimal GetDiscountPercentage()
    {
        if (DiscountPrice == null) return 0;
        return ((Price.Amount - DiscountPrice.Amount) / Price.Amount) * 100;
    }
}