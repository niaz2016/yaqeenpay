using MediatR;
using Microsoft.Extensions.Logging;
using TechTorio.Application.Features.AdminSettings.Common;
using TechTorio.Domain.Enums;
using TechTorio.Domain.Interfaces;

namespace TechTorio.Application.Features.AdminSettings.Queries.GetAdminSettings;

public class GetAdminSettingsQueryHandler : IRequestHandler<GetAdminSettingsQuery, List<AdminSettingsGroupDto>>
{
    private readonly IAdminSystemSettingsRepository _settingsRepository;
    private readonly ILogger<GetAdminSettingsQueryHandler> _logger;

    public GetAdminSettingsQueryHandler(
        IAdminSystemSettingsRepository settingsRepository,
        ILogger<GetAdminSettingsQueryHandler> logger)
    {
        _settingsRepository = settingsRepository;
        _logger = logger;
    }

    public async Task<List<AdminSettingsGroupDto>> Handle(GetAdminSettingsQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var settings = request.IncludeInactive 
                ? await _settingsRepository.GetAllAsync(cancellationToken)
                : await _settingsRepository.GetActiveSettingsAsync(cancellationToken);

            var groupedSettings = settings
                .GroupBy(s => s.Category)
                .Select(group => new AdminSettingsGroupDto
                {
                    Category = group.Key,
                    CategoryName = GetCategoryDisplayName(group.Key),
                    CategoryDescription = GetCategoryDescription(group.Key),
                    Settings = group.Select(setting => new AdminSystemSettingsDto
                    {
                        Id = setting.Id,
                        SettingKey = setting.SettingKey,
                        SettingValue = (request.MaskSensitiveValues && setting.IsSensitive) ? "***MASKED***" : setting.SettingValue,
                        DataType = setting.DataType,
                        Category = setting.Category,
                        Description = setting.Description,
                        IsActive = setting.IsActive,
                        IsEncrypted = setting.IsEncrypted,
                        IsSensitive = setting.IsSensitive,
                        DefaultValue = setting.DefaultValue,
                        ValidationRules = setting.ValidationRules,
                        ModifiedByUserId = setting.ModifiedByUserId,
                        ModifiedByUserName = setting.ModifiedByUser?.UserName,
                        CreatedAt = setting.CreatedAt,
                        LastModifiedAt = setting.LastModifiedAt
                    }).OrderBy(s => s.SettingKey).ToList()
                })
                .OrderBy(g => g.Category)
                .ToList();

            _logger.LogInformation("Retrieved {Count} admin settings groups", groupedSettings.Count);
            
            return groupedSettings;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving admin settings");
            throw;
        }
    }

    private string GetCategoryDisplayName(AdminSettingsCategory category)
    {
        return category switch
        {
            AdminSettingsCategory.System => "System Configuration",
            AdminSettingsCategory.JwtConfiguration => "JWT Authentication",
            AdminSettingsCategory.PaymentGateways => "Payment Gateways",
            AdminSettingsCategory.CacheConfiguration => "Cache & Redis",
            AdminSettingsCategory.OutboxDispatcher => "Outbox Dispatcher",
            AdminSettingsCategory.BankingSms => "Banking & SMS",
            AdminSettingsCategory.RaastPayments => "Raast Payments",
            AdminSettingsCategory.Logging => "Logging Configuration",
            AdminSettingsCategory.Security => "Security Settings",
            _ => category.ToString()
        };
    }

    private string GetCategoryDescription(AdminSettingsCategory category)
    {
        return category switch
        {
            AdminSettingsCategory.System => "Core system configuration settings",
            AdminSettingsCategory.JwtConfiguration => "JWT token generation and validation settings",
            AdminSettingsCategory.PaymentGateways => "JazzCash, EasyPaisa and other payment gateway configurations",
            AdminSettingsCategory.CacheConfiguration => "Redis cache connection and configuration settings",
            AdminSettingsCategory.OutboxDispatcher => "Background job processing and outbox pattern settings",
            AdminSettingsCategory.BankingSms => "Bank SMS integration and processing settings",
            AdminSettingsCategory.RaastPayments => "Raast instant payment system configuration",
            AdminSettingsCategory.Logging => "Application logging levels and output configuration",
            AdminSettingsCategory.Security => "Security policies and authentication settings",
            _ => $"Configuration settings for {category}"
        };
    }
}