using MediatR;

namespace YaqeenPay.Application.Features.Notifications.Commands.MarkAsRead;

public class MarkAsReadCommand : IRequest
{
    public List<Guid> NotificationIds { get; set; } = new();
}