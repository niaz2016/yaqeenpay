using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using TechTorio.Application.Common.Exceptions;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Application.Features.Notifications.Common;
using TechTorio.Domain.Entities;

namespace TechTorio.Application.Features.Notifications.Queries.GetPreferences;

public class GetNotificationPreferencesQueryHandler : IRequestHandler<GetNotificationPreferencesQuery, NotificationPreferencesDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetNotificationPreferencesQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<NotificationPreferencesDto> Handle(GetNotificationPreferencesQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;

        var preferences = await _context.NotificationPreferences
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);

        if (preferences == null)
        {
            // Return default preferences
            return new NotificationPreferencesDto
            {
                EmailNotifications = true,
                PushNotifications = true,
                SmsNotifications = false,
                Types = new Dictionary<string, bool>
                {
                    { "order", true },
                    { "payment", true },
                    { "kyc", true },
                    { "system", true },
                    { "security", true },
                    { "promotion", false },
                    { "wallet", true },
                    { "seller", true }
                },
                QuietHours = new QuietHoursDto
                {
                    Enabled = false,
                    StartTime = "22:00",
                    EndTime = "08:00"
                }
            };
        }

        var typePreferences = string.IsNullOrEmpty(preferences.TypePreferences) 
            ? new Dictionary<string, bool>() 
            : JsonSerializer.Deserialize<Dictionary<string, bool>>(preferences.TypePreferences) ?? new Dictionary<string, bool>();

        var quietHours = string.IsNullOrEmpty(preferences.QuietHoursSettings) 
            ? new QuietHoursDto() 
            : JsonSerializer.Deserialize<QuietHoursDto>(preferences.QuietHoursSettings) ?? new QuietHoursDto();

        return new NotificationPreferencesDto
        {
            EmailNotifications = preferences.EmailNotifications,
            PushNotifications = preferences.PushNotifications,
            SmsNotifications = preferences.SmsNotifications,
            Types = typePreferences,
            QuietHours = quietHours
        };
    }
}