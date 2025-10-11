using MediatR;

namespace YaqeenPay.Application.Features.Notifications.Commands.DeleteNotification;

public class DeleteNotificationCommand : IRequest
{
    public required Guid NotificationId { get; set; }
}