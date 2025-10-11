using YaqeenPay.Domain.Common;
using YaqeenPay.Domain.Entities.Identity;
using YaqeenPay.Domain.Enums;

namespace YaqeenPay.Domain.Entities;

public class Notification : AuditableEntity
{
    public required Guid UserId { get; set; }
    public NotificationType Type { get; set; }
    public required string Title { get; set; }
    public required string Message { get; set; }
    public NotificationPriority Priority { get; set; } = NotificationPriority.Medium;
    public NotificationStatus Status { get; set; } = NotificationStatus.Unread;
    public DateTime? ReadAt { get; set; }
    public string? Metadata { get; set; } // JSON string for additional data
    public string? Actions { get; set; } // JSON string for notification actions
    
    // Navigation properties
    public virtual ApplicationUser User { get; set; } = null!;
}