using TechTorio.Domain.Common;
using TechTorio.Domain.Entities.Identity;

namespace TechTorio.Domain.Entities;

public class NotificationPreference : AuditableEntity
{
    public required Guid UserId { get; set; }
    public bool EmailNotifications { get; set; } = true;
    public bool PushNotifications { get; set; } = true;
    public bool SmsNotifications { get; set; } = false;
    
    // Notification type preferences (JSON string)
    public string TypePreferences { get; set; } = "{}";
    
    // Quiet hours settings (JSON string)
    public string QuietHoursSettings { get; set; } = "{}";
    
    // Navigation properties
    public virtual ApplicationUser User { get; set; } = null!;
}