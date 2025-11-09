using TechTorio.Domain.Common;
using TechTorio.Domain.Entities.Identity;

namespace TechTorio.Domain.Entities;

public class SettingsAudit : BaseEntity
{
    public required Guid UserId { get; set; }
    public required string Category { get; set; }
    public required string SettingKey { get; set; }
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
    public required Guid ChangedBy { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    
    // Navigation properties
    public virtual ApplicationUser User { get; set; } = null!;
    public virtual ApplicationUser ChangedByUser { get; set; } = null!;
}