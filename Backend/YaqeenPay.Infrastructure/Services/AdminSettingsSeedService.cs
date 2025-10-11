using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using YaqeenPay.Domain.Entities;
using YaqeenPay.Domain.Enums;
using YaqeenPay.Domain.Interfaces;

namespace YaqeenPay.Infrastructure.Services;

/// <summary>
/// Service to seed default admin settings from appsettings.json
/// </summary>
public class AdminSettingsSeedService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<AdminSettingsSeedService> _logger;

    public AdminSettingsSeedService(
        IServiceProvider serviceProvider,
        ILogger<AdminSettingsSeedService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public async Task SeedDefaultSettingsAsync()
    {
        using var scope = _serviceProvider.CreateScope();
        var settingsRepository = scope.ServiceProvider.GetRequiredService<IAdminSystemSettingsRepository>();

        try
        {
            // Check if settings are already seeded
            var existingSettings = await settingsRepository.GetAllAsync();
            if (existingSettings.Any())
            {
                _logger.LogInformation("Admin settings already exist, skipping seed");
                return;
            }

            var defaultSettings = GetDefaultSettings();
            
            foreach (var setting in defaultSettings)
            {
                var exists = await settingsRepository.ExistsAsync(setting.SettingKey);
                if (!exists)
                {
                    await settingsRepository.AddAsync(setting);
                    _logger.LogInformation("Seeded admin setting: {SettingKey}", setting.SettingKey);
                }
            }

            _logger.LogInformation("Admin settings seeding completed");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error seeding admin settings");
            throw;
        }
    }

    private List<AdminSystemSettings> GetDefaultSettings()
    {
        var settings = new List<AdminSystemSettings>();
        var now = DateTime.UtcNow;

        // JWT Settings
        settings.AddRange(new[]
        {
            new AdminSystemSettings
            {
                Id = Guid.NewGuid(),
                SettingKey = "JwtSettings:Issuer",
                SettingValue = "YaqeenPay",
                DataType = "string",
                Category = AdminSettingsCategory.JwtConfiguration,
                Description = "JWT token issuer name",
                DefaultValue = "YaqeenPay",
                CreatedAt = now,
                LastModifiedAt = now
            },
            new AdminSystemSettings
            {
                Id = Guid.NewGuid(),
                SettingKey = "JwtSettings:Audience",
                SettingValue = "YaqeenPayClient",
                DataType = "string",
                Category = AdminSettingsCategory.JwtConfiguration,
                Description = "JWT token audience",
                DefaultValue = "YaqeenPayClient",
                CreatedAt = now,
                LastModifiedAt = now
            },
            new AdminSystemSettings
            {
                Id = Guid.NewGuid(),
                SettingKey = "JwtSettings:ExpiryInMinutes",
                SettingValue = "60",
                DataType = "int",
                Category = AdminSettingsCategory.JwtConfiguration,
                Description = "JWT token expiry time in minutes",
                DefaultValue = "60",
                ValidationRules = "{\"min\":1,\"max\":1440}",
                CreatedAt = now,
                LastModifiedAt = now
            }
        });

        // JazzCash Settings
        settings.AddRange(new[]
        {
            new AdminSystemSettings
            {
                Id = Guid.NewGuid(),
                SettingKey = "JazzCash:MerchantId",
                SettingValue = "03035339996",
                DataType = "string",
                Category = AdminSettingsCategory.PaymentGateways,
                Description = "JazzCash merchant ID",
                IsSensitive = true,
                CreatedAt = now,
                LastModifiedAt = now
            },
            new AdminSystemSettings
            {
                Id = Guid.NewGuid(),
                SettingKey = "JazzCash:ApiBaseUrl",
                SettingValue = "https://sandbox.jazzcash.com.pk",
                DataType = "string",
                Category = AdminSettingsCategory.PaymentGateways,
                Description = "JazzCash API base URL",
                DefaultValue = "https://sandbox.jazzcash.com.pk",
                CreatedAt = now,
                LastModifiedAt = now
            },
            new AdminSystemSettings
            {
                Id = Guid.NewGuid(),
                SettingKey = "JazzCash:TransactionExpiryHours",
                SettingValue = "1",
                DataType = "int",
                Category = AdminSettingsCategory.PaymentGateways,
                Description = "Transaction expiry time in hours",
                DefaultValue = "1",
                ValidationRules = "{\"min\":1,\"max\":48}",
                CreatedAt = now,
                LastModifiedAt = now
            },
            new AdminSystemSettings
            {
                Id = Guid.NewGuid(),
                SettingKey = "JazzCash:IsSandbox",
                SettingValue = "true",
                DataType = "bool",
                Category = AdminSettingsCategory.PaymentGateways,
                Description = "Enable sandbox mode for testing",
                DefaultValue = "true",
                CreatedAt = now,
                LastModifiedAt = now
            }
        });

        // Redis Settings
        settings.AddRange(new[]
        {
            new AdminSystemSettings
            {
                Id = Guid.NewGuid(),
                SettingKey = "Redis:ConnectionString",
                SettingValue = "localhost:6379",
                DataType = "string",
                Category = AdminSettingsCategory.CacheConfiguration,
                Description = "Redis connection string",
                DefaultValue = "localhost:6379",
                IsSensitive = true,
                CreatedAt = now,
                LastModifiedAt = now
            }
        });

        // Outbox Dispatcher Settings
        settings.AddRange(new[]
        {
            new AdminSystemSettings
            {
                Id = Guid.NewGuid(),
                SettingKey = "OutboxDispatcher:Enabled",
                SettingValue = "true",
                DataType = "bool",
                Category = AdminSettingsCategory.OutboxDispatcher,
                Description = "Enable outbox message dispatcher",
                DefaultValue = "true",
                CreatedAt = now,
                LastModifiedAt = now
            },
            new AdminSystemSettings
            {
                Id = Guid.NewGuid(),
                SettingKey = "OutboxDispatcher:IntervalSeconds",
                SettingValue = "100",
                DataType = "int",
                Category = AdminSettingsCategory.OutboxDispatcher,
                Description = "Dispatcher interval in seconds",
                DefaultValue = "100",
                ValidationRules = "{\"min\":5,\"max\":3600}",
                CreatedAt = now,
                LastModifiedAt = now
            },
            new AdminSystemSettings
            {
                Id = Guid.NewGuid(),
                SettingKey = "OutboxDispatcher:BatchSize",
                SettingValue = "50",
                DataType = "int",
                Category = AdminSettingsCategory.OutboxDispatcher,
                Description = "Number of messages to process per batch",
                DefaultValue = "50",
                ValidationRules = "{\"min\":1,\"max\":1000}",
                CreatedAt = now,
                LastModifiedAt = now
            }
        });

        // Raast Payments
        settings.AddRange(new[]
        {
            new AdminSystemSettings
            {
                Id = Guid.NewGuid(),
                SettingKey = "Payments:Raast:Iban",
                SettingValue = "PK37HABB0014167901035003",
                DataType = "string",
                Category = AdminSettingsCategory.RaastPayments,
                Description = "Default IBAN for Raast payments",
                DefaultValue = "PK37HABB0014167901035003",
                IsSensitive = true,
                CreatedAt = now,
                LastModifiedAt = now
            },
            new AdminSystemSettings
            {
                Id = Guid.NewGuid(),
                SettingKey = "Payments:Raast:NumericOnly",
                SettingValue = "false",
                DataType = "bool",
                Category = AdminSettingsCategory.RaastPayments,
                Description = "Accept numeric values only",
                DefaultValue = "false",
                CreatedAt = now,
                LastModifiedAt = now
            }
        });

        return settings;
    }
}