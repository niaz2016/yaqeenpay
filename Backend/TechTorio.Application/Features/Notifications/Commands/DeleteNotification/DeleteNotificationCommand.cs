using MediatR;

namespace TechTorio.Application.Features.Notifications.Commands.DeleteNotification;

public class DeleteNotificationCommand : IRequest
{
    public required Guid NotificationId { get; set; }
}