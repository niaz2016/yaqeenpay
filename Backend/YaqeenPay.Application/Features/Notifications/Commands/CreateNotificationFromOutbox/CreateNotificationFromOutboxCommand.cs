using MediatR;
using YaqeenPay.Domain.Enums;

namespace YaqeenPay.Application.Features.Notifications.Commands.CreateNotificationFromOutbox;

public class CreateNotificationFromOutboxCommand : IRequest<Guid>
{
    public Guid UserId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public NotificationType NotificationType { get; set; }
    public NotificationPriority Priority { get; set; } = NotificationPriority.Medium;
    public string? Metadata { get; set; }
}