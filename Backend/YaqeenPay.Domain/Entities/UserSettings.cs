using YaqeenPay.Domain.Common;
using YaqeenPay.Domain.Entities.Identity;
using YaqeenPay.Domain.Enums;

namespace YaqeenPay.Domain.Entities;

public class UserSettings : AuditableEntity
{
    public required Guid UserId { get; set; }
    public required SettingsCategory Category { get; set; }
    
    /// <summary>
    /// JSON data containing the settings for the specific category
    /// </summary>
    public required string SettingsData { get; set; } = "{}";
    
    // Navigation properties
    public virtual ApplicationUser User { get; set; } = null!;
}