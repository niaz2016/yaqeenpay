using MediatR;
using TechTorio.Application.Features.Notifications.Common;
using TechTorio.Domain.Enums;

namespace TechTorio.Application.Features.Notifications.Commands.SendNotification;

public class SendNotificationCommand : IRequest<Guid>
{
    public required Guid RecipientId { get; set; }
    public NotificationType Type { get; set; }
    public required string Title { get; set; }
    public required string Message { get; set; }
    public NotificationPriority Priority { get; set; } = NotificationPriority.Medium;
    public Dictionary<string, object>? Data { get; set; }
    public List<NotificationActionDto>? Actions { get; set; }
}