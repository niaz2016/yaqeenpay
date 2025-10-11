using YaqeenPay.Domain.Enums;

namespace YaqeenPay.Application.Features.Notifications.Common;

public class NotificationDto
{
    public Guid Id { get; set; }
    public NotificationType Type { get; set; }
    public required string Title { get; set; }
    public required string Message { get; set; }
    public NotificationPriority Priority { get; set; }
    public NotificationStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ReadAt { get; set; }
    public Guid UserId { get; set; }
    public string? Metadata { get; set; }
    public List<NotificationActionDto>? Actions { get; set; }
}

public class NotificationActionDto
{
    public required string Id { get; set; }
    public required string Label { get; set; }
    public string? Url { get; set; }
    public string? Variant { get; set; }
    public string? Color { get; set; }
}

public class NotificationStatsDto
{
    public int Total { get; set; }
    public int Unread { get; set; }
    public Dictionary<string, int> ByType { get; set; } = new();
    public Dictionary<string, int> ByPriority { get; set; } = new();
}

public class NotificationListResponseDto
{
    public List<NotificationDto> Notifications { get; set; } = new();
    public NotificationStatsDto Stats { get; set; } = new();
    public PaginationDto Pagination { get; set; } = new();
}

public class PaginationDto
{
    public int Page { get; set; }
    public int Limit { get; set; }
    public int Total { get; set; }
    public bool HasNext { get; set; }
    public bool HasPrev { get; set; }
}

public class NotificationPreferencesDto
{
    public bool EmailNotifications { get; set; }
    public bool PushNotifications { get; set; }
    public bool SmsNotifications { get; set; }
    public Dictionary<string, bool> Types { get; set; } = new();
    public QuietHoursDto QuietHours { get; set; } = new();
}

public class QuietHoursDto
{
    public bool Enabled { get; set; }
    public string StartTime { get; set; } = "22:00";
    public string EndTime { get; set; } = "08:00";
}

public class SendNotificationDto
{
    public required Guid RecipientId { get; set; }
    public NotificationType Type { get; set; }
    public required string Title { get; set; }
    public required string Message { get; set; }
    public NotificationPriority Priority { get; set; } = NotificationPriority.Medium;
    public Dictionary<string, object>? Data { get; set; }
    public List<NotificationActionDto>? Actions { get; set; }
}