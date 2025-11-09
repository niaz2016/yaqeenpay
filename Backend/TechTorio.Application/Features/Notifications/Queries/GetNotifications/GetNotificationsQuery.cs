using MediatR;
using TechTorio.Application.Features.Notifications.Common;
using TechTorio.Domain.Enums;

namespace TechTorio.Application.Features.Notifications.Queries.GetNotifications;

public class GetNotificationsQuery : IRequest<NotificationListResponseDto>
{
    public int Page { get; set; } = 1;
    public int Limit { get; set; } = 20;
    public NotificationType? Type { get; set; }
    public NotificationStatus? Status { get; set; }
}