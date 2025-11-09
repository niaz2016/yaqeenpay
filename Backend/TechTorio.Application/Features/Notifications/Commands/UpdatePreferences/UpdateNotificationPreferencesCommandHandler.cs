using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using TechTorio.Application.Common.Exceptions;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Application.Features.Notifications.Common;
using TechTorio.Domain.Entities;

namespace TechTorio.Application.Features.Notifications.Commands.UpdatePreferences;

public class UpdateNotificationPreferencesCommandHandler : IRequestHandler<UpdateNotificationPreferencesCommand, NotificationPreferencesDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public UpdateNotificationPreferencesCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<NotificationPreferencesDto> Handle(UpdateNotificationPreferencesCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;

        var preferences = await _context.NotificationPreferences
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);

        if (preferences == null)
        {
            // Create new preferences
            preferences = new NotificationPreference
            {
                UserId = userId,
                EmailNotifications = request.EmailNotifications ?? true,
                PushNotifications = request.PushNotifications ?? true,
                SmsNotifications = request.SmsNotifications ?? false,
                TypePreferences = request.Types != null ? JsonSerializer.Serialize(request.Types) : "{}",
                QuietHoursSettings = request.QuietHours != null ? JsonSerializer.Serialize(request.QuietHours) : "{}",
                CreatedAt = DateTime.UtcNow,
                CreatedBy = userId
            };

            _context.NotificationPreferences.Add(preferences);
        }
        else
        {
            // Update existing preferences
            if (request.EmailNotifications.HasValue)
                preferences.EmailNotifications = request.EmailNotifications.Value;
            
            if (request.PushNotifications.HasValue)
                preferences.PushNotifications = request.PushNotifications.Value;
            
            if (request.SmsNotifications.HasValue)
                preferences.SmsNotifications = request.SmsNotifications.Value;

            if (request.Types != null)
                preferences.TypePreferences = JsonSerializer.Serialize(request.Types);

            if (request.QuietHours != null)
                preferences.QuietHoursSettings = JsonSerializer.Serialize(request.QuietHours);

            preferences.LastModifiedAt = DateTime.UtcNow;
            preferences.LastModifiedBy = userId;
        }

        await _context.SaveChangesAsync(cancellationToken);

        // Return updated preferences
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