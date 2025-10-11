using YaqeenPay.Domain.Common;
using YaqeenPay.Domain.ValueObjects;

namespace YaqeenPay.Domain.Entities;

public class Category : AuditableEntity
{
    public string Name { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public string? ImageUrl { get; private set; }
    public Guid? ParentCategoryId { get; private set; }
    public int SortOrder { get; private set; } = 0;
    
    // Navigation properties
    public virtual Category? ParentCategory { get; private set; }
    public virtual ICollection<Category> SubCategories { get; private set; } = new List<Category>();
    public virtual ICollection<Product> Products { get; private set; } = new List<Product>();

    private Category() { } // For EF Core

    public Category(string name, string description, string? imageUrl = null, Guid? parentCategoryId = null)
    {
        Name = name;
        Description = description;
        ImageUrl = imageUrl;
        ParentCategoryId = parentCategoryId;
    }

    public void UpdateDetails(string name, string description, string? imageUrl = null)
    {
        Name = name;
        Description = description;
        ImageUrl = imageUrl;
    }

    public void SetParentCategory(Guid? parentCategoryId)
    {
        ParentCategoryId = parentCategoryId;
    }

    public void SetSortOrder(int sortOrder)
    {
        SortOrder = sortOrder;
    }

    public void Activate()
    {
        IsActive = true;
    }

    public void Deactivate()
    {
        IsActive = false;
    }
}