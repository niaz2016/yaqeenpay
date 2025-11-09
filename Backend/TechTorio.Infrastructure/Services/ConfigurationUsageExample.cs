using Microsoft.Extensions.DependencyInjection;
using TechTorio.Application.Interfaces;

namespace TechTorio.Infrastructure.Services;

/// <summary>
/// Example usage of the AdminConfigurationService
/// Shows how to use database settings to override appsettings.json values
/// </summary>
public class ConfigurationUsageExample
{
    private readonly IAdminConfigurationService _configService;

    public ConfigurationUsageExample(IAdminConfigurationService configService)
    {
        _configService = configService;
    }

    /// <summary>
    /// Example: Get JWT settings with database overrides
    /// </summary>
    public async Task<JwtExampleConfig> GetJwtSettingsAsync()
    {
        return new JwtExampleConfig
        {
            Issuer = await _configService.GetStringAsync("JwtSettings:Issuer", "TechTorio"),
            Audience = await _configService.GetStringAsync("JwtSettings:Audience", "TechTorioClient"),
            ExpiryInMinutes = await _configService.GetIntAsync("JwtSettings:ExpiryInMinutes", 60)
        };
    }

    /// <summary>
    /// Example: Get JazzCash settings with database overrides
    /// </summary>
    public async Task<JazzCashExampleConfig> GetJazzCashSettingsAsync()
    {
        return new JazzCashExampleConfig
        {
            MerchantId = await _configService.GetStringAsync("JazzCash:MerchantId", ""),
            ApiBaseUrl = await _configService.GetStringAsync("JazzCash:ApiBaseUrl", "https://sandbox.jazzcash.com.pk"),
            TransactionExpiryHours = await _configService.GetIntAsync("JazzCash:TransactionExpiryHours", 1),
            IsSandbox = await _configService.GetBoolAsync("JazzCash:IsSandbox", true)
        };
    }

    /// <summary>
    /// Example: Get strongly typed section
    /// </summary>
    public async Task<OutboxExampleConfig?> GetOutboxDispatcherSettingsAsync()
    {
        return await _configService.GetSectionAsync<OutboxExampleConfig>("OutboxDispatcher");
    }

    /// <summary>
    /// Example: Check if admin override exists
    /// </summary>
    public async Task<bool> HasCustomJwtExpiryAsync()
    {
        return await _configService.HasSettingAsync("JwtSettings:ExpiryInMinutes");
    }
}

// Example configuration classes
public class JwtExampleConfig
{
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public int ExpiryInMinutes { get; set; }
}

public class JazzCashExampleConfig
{
    public string MerchantId { get; set; } = string.Empty;
    public string ApiBaseUrl { get; set; } = string.Empty;
    public int TransactionExpiryHours { get; set; }
    public bool IsSandbox { get; set; }
}

public class OutboxExampleConfig
{
    public bool Enabled { get; set; } = true;
    public int IntervalSeconds { get; set; } = 100;
    public int BatchSize { get; set; } = 50;
}