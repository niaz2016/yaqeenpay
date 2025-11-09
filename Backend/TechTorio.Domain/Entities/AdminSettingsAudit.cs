using TechTorio.Domain.Common;
using TechTorio.Domain.Entities.Identity;
using TechTorio.Domain.Enums;

namespace TechTorio.Domain.Entities;

/// <summary>
/// Audit trail for admin system settings changes
/// </summary>
public class AdminSettingsAudit : BaseEntity
{
    /// <summary>
    /// The setting key that was changed
    /// </summary>
    public required string SettingKey { get; set; }
    
    /// <summary>
    /// Category of the setting
    /// </summary>
    public required AdminSettingsCategory Category { get; set; }
    
    /// <summary>
    /// Previous value before the change
    /// </summary>
    public string? OldValue { get; set; }
    
    /// <summary>
    /// New value after the change
    /// </summary>
    public string? NewValue { get; set; }
    
    /// <summary>
    /// Type of change (Created, Updated, Deleted, Activated, Deactivated)
    /// </summary>
    public required string ChangeType { get; set; }
    
    /// <summary>
    /// When the change occurred
    /// </summary>
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Admin user who made the change
    /// </summary>
    public required Guid ChangedByUserId { get; set; }
    
    /// <summary>
    /// IP address from which the change was made
    /// </summary>
    public string? IpAddress { get; set; }
    
    /// <summary>
    /// User agent of the browser/client
    /// </summary>
    public string? UserAgent { get; set; }
    
    /// <summary>
    /// Additional notes or reason for the change
    /// </summary>
    public string? Notes { get; set; }
    
    // Navigation properties
    public virtual ApplicationUser ChangedByUser { get; set; } = null!;
    public Guid? UpdatedBy { get; set; }
}