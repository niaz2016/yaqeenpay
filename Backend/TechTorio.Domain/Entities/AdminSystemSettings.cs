using TechTorio.Domain.Common;
using TechTorio.Domain.Entities.Identity;
using TechTorio.Domain.Enums;

namespace TechTorio.Domain.Entities;

/// <summary>
/// Admin-configurable system settings that override appsettings.json
/// These settings can only be modified by administrators and take effect without server restart
/// </summary>
public class AdminSystemSettings : AuditableEntity
{
    /// <summary>
    /// Unique setting key (e.g., "JwtSettings:ExpiryInMinutes", "JazzCash:MerchantId")
    /// </summary>
    public required string SettingKey { get; set; }
    
    /// <summary>
    /// Setting value stored as string (will be parsed as needed)
    /// </summary>
    public required string SettingValue { get; set; }
    
    /// <summary>
    /// Data type of the setting for proper parsing (string, int, bool, decimal, etc.)
    /// </summary>
    public required string DataType { get; set; } = "string";
    
    /// <summary>
    /// Category this setting belongs to
    /// </summary>
    public required AdminSettingsCategory Category { get; set; }
    
    /// <summary>
    /// Human-friendly description of what this setting controls
    /// </summary>
    public string? Description { get; set; }
    
    /// <summary>
    /// Whether this setting is currently active/enabled
    /// </summary>
    public new bool IsActive { get; set; } = true;
    
    /// <summary>
    /// Whether this setting is encrypted in the database
    /// </summary>
    public bool IsEncrypted { get; set; } = false;
    
    /// <summary>
    /// Whether this setting is sensitive and should be masked in UI
    /// </summary>
    public bool IsSensitive { get; set; } = false;
    
    /// <summary>
    /// Default value for this setting (fallback if no custom value set)
    /// </summary>
    public string? DefaultValue { get; set; }
    
    /// <summary>
    /// Validation rules as JSON (min/max values, regex patterns, etc.)
    /// </summary>
    public string? ValidationRules { get; set; }
    
    /// <summary>
    /// Admin user who last modified this setting
    /// </summary>
    public Guid? ModifiedByUserId { get; set; }
    
    // Navigation properties
    public virtual ApplicationUser? ModifiedByUser { get; set; }
}