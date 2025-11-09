using TechTorio.Domain.Common;

namespace TechTorio.Domain.Entities;

public class PageView : BaseEntity
{
    public string PageUrl { get; set; } = string.Empty;
    public string PageType { get; set; } = string.Empty; // "Landing", "Gateway", "Product", etc.
    public Guid? ProductId { get; set; }
    public Guid? SellerId { get; set; }
    public string VisitorId { get; set; } = string.Empty; // Browser fingerprint or session ID
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? Referrer { get; set; }
    public string? DeviceType { get; set; } // "Desktop", "Mobile", "Tablet"
    public string? Browser { get; set; } // "Chrome", "Firefox", "Safari", etc.
    public string? OperatingSystem { get; set; } // "Windows", "macOS", "Android", "iOS", etc.
    public DateTime ViewedAt { get; set; }
    
    // Navigation properties
    public Product? Product { get; set; }
}
