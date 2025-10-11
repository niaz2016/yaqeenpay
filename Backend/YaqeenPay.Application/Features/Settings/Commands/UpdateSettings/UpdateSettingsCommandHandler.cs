using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Domain.Entities;
using YaqeenPay.Domain.Enums;

namespace YaqeenPay.Application.Features.Settings.Commands.UpdateSettings;

public class UpdateSettingsCommandHandler : IRequestHandler<UpdateSettingsCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public UpdateSettingsCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(UpdateSettingsCommand request, CancellationToken cancellationToken)
    {
        // Get existing settings
        var existingSettings = await _context.UserSettings
            .FirstOrDefaultAsync(x => x.UserId == request.UserId && x.Category == request.Category, cancellationToken);

        var newSettingsJson = JsonSerializer.Serialize(request.SettingsData);
        var oldSettingsJson = existingSettings?.SettingsData;

        if (existingSettings != null)
        {
            // Update existing settings
            existingSettings.SettingsData = newSettingsJson;
        }
        else
        {
            // Create new settings
            var userSettings = new UserSettings
            {
                Id = Guid.NewGuid(),
                UserId = request.UserId,
                Category = request.Category,
                SettingsData = newSettingsJson,
                IsActive = true
            };

            _context.UserSettings.Add(userSettings);
        }

        // Create audit log
        var auditLog = new SettingsAudit
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            Category = request.Category.ToString(),
            SettingKey = "ALL", // For bulk updates
            OldValue = oldSettingsJson,
            NewValue = newSettingsJson,
            ChangedBy = _currentUserService.UserId,
            IpAddress = request.IpAddress,
            UserAgent = request.UserAgent,
            IsActive = true
        };

        _context.SettingsAudits.Add(auditLog);

        var result = await _context.SaveChangesAsync(cancellationToken);
        return result > 0;
    }
}