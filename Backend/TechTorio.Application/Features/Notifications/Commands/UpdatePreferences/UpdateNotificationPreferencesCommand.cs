using MediatR;
using TechTorio.Application.Features.Notifications.Common;

namespace TechTorio.Application.Features.Notifications.Commands.UpdatePreferences;

public class UpdateNotificationPreferencesCommand : IRequest<NotificationPreferencesDto>
{
    public bool? EmailNotifications { get; set; }
    public bool? PushNotifications { get; set; }
    public bool? SmsNotifications { get; set; }
    public Dictionary<string, bool>? Types { get; set; }
    public QuietHoursDto? QuietHours { get; set; }
}