using TechTorio.Domain.Common;

namespace TechTorio.Domain.Entities;

public class ProductImage : AuditableEntity
{
    public Guid ProductId { get; private set; }
    public string ImageUrl { get; private set; } = string.Empty;
    public string? AltText { get; private set; }
    public int SortOrder { get; private set; } = 0;
    public bool IsPrimary { get; private set; } = false;
    public long FileSize { get; private set; } = 0;
    public string? FileName { get; private set; }
    public string? ContentType { get; private set; }

    // Navigation properties
    public virtual Product Product { get; set; } = null!;

    private ProductImage() { } // For EF Core

    public ProductImage(Guid productId, string imageUrl, string? altText = null, int sortOrder = 0)
    {
        ProductId = productId;
        ImageUrl = imageUrl;
        AltText = altText;
        SortOrder = sortOrder;
    }

    public void UpdateImageInfo(string imageUrl, string? altText = null)
    {
        ImageUrl = imageUrl;
        AltText = altText;
    }

    public void SetSortOrder(int sortOrder)
    {
        SortOrder = sortOrder;
    }

    public void SetAsPrimary()
    {
        IsPrimary = true;
    }

    public void UnsetAsPrimary()
    {
        IsPrimary = false;
    }

    public void SetFileDetails(long fileSize, string? fileName = null, string? contentType = null)
    {
        FileSize = fileSize;
        FileName = fileName;
        ContentType = contentType;
    }
}