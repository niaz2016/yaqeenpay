using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Application.Features.Settings.Common;
using TechTorio.Domain.Enums;

namespace TechTorio.Application.Features.Settings.Queries.GetAllSettings;

public class GetAllSettingsQueryHandler : IRequestHandler<GetAllSettingsQuery, AllUserSettingsDto>
{
    private readonly IApplicationDbContext _context;

    public GetAllSettingsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<AllUserSettingsDto> Handle(GetAllSettingsQuery request, CancellationToken cancellationToken)
    {
        var userSettings = await _context.UserSettings
            .Where(x => x.UserId == request.UserId)
            .ToListAsync(cancellationToken);

        var result = new AllUserSettingsDto();

        foreach (var setting in userSettings)
        {
            var settingsData = setting.SettingsData;

            switch (setting.Category)
            {
                case SettingsCategory.Account:
                    result.Account = JsonSerializer.Deserialize<AccountSettingsDto>(settingsData) ?? new AccountSettingsDto();
                    break;
                case SettingsCategory.Security:
                    result.Security = JsonSerializer.Deserialize<SecuritySettingsDto>(settingsData) ?? new SecuritySettingsDto();
                    break;
                case SettingsCategory.Notifications:
                    result.Notifications = JsonSerializer.Deserialize<NotificationSettingsDto>(settingsData) ?? new NotificationSettingsDto();
                    break;
                case SettingsCategory.Payments:
                    result.Payments = JsonSerializer.Deserialize<PaymentSettingsDto>(settingsData) ?? new PaymentSettingsDto();
                    break;
                case SettingsCategory.Business:
                    result.Business = JsonSerializer.Deserialize<BusinessSettingsDto>(settingsData);
                    break;
                case SettingsCategory.Appearance:
                    result.Appearance = JsonSerializer.Deserialize<AppearanceSettingsDto>(settingsData) ?? new AppearanceSettingsDto();
                    break;
                case SettingsCategory.Integrations:
                    result.Integrations = JsonSerializer.Deserialize<IntegrationSettingsDto>(settingsData) ?? new IntegrationSettingsDto();
                    break;
            }
        }

        return result;
    }
}