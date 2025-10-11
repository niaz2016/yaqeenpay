using MediatR;
using YaqeenPay.Application.Features.Notifications.Common;
using YaqeenPay.Domain.Enums;

namespace YaqeenPay.Application.Features.Notifications.Queries.GetNotifications;

public class GetNotificationsQuery : IRequest<NotificationListResponseDto>
{
    public int Page { get; set; } = 1;
    public int Limit { get; set; } = 20;
    public NotificationType? Type { get; set; }
    public NotificationStatus? Status { get; set; }
}