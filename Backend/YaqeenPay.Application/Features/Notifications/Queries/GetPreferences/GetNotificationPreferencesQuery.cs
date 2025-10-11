using MediatR;
using YaqeenPay.Application.Features.Notifications.Common;

namespace YaqeenPay.Application.Features.Notifications.Queries.GetPreferences;

public class GetNotificationPreferencesQuery : IRequest<NotificationPreferencesDto>
{
}