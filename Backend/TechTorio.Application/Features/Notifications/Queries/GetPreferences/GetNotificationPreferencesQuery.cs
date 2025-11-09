using MediatR;
using TechTorio.Application.Features.Notifications.Common;

namespace TechTorio.Application.Features.Notifications.Queries.GetPreferences;

public class GetNotificationPreferencesQuery : IRequest<NotificationPreferencesDto>
{
}