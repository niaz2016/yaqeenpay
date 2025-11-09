using TechTorio.Domain.Common;

namespace TechTorio.Domain.ValueObjects;

/// <summary>
/// JWT configuration settings
/// </summary>
public record JwtConfigurationSettings : IValueObject
{
    public string Issuer { get; init; } = "TechTorio";
    public string Audience { get; init; } = "TechTorioClient";
    public int ExpiryInMinutes { get; init; } = 60;
    public string KeyId { get; init; } = "prod-1";
    
    public static JwtConfigurationSettings Default => new();
}

/// <summary>
/// JazzCash payment gateway settings
/// </summary>
public record JazzCashSettings : IValueObject
{
    public string MerchantId { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
    public string IntegritySalt { get; init; } = string.Empty;
    public string ApiBaseUrl { get; init; } = "https://sandbox.jazzcash.com.pk";
    public string ReturnUrl { get; init; } = string.Empty;
    public string Language { get; init; } = "EN";
    public string Currency { get; init; } = "PKR";
    public int TransactionExpiryHours { get; init; } = 1;
    public bool IsSandbox { get; init; } = true;
    
    public static JazzCashSettings Default => new();
}

/// <summary>
/// Redis cache configuration settings
/// </summary>
public record RedisSettings : IValueObject
{
    public string ConnectionString { get; init; } = "localhost:6379";
    public int Database { get; init; } = 0;
    public int ConnectTimeout { get; init; } = 5000;
    public int SyncTimeout { get; init; } = 5000;
    
    public static RedisSettings Default => new();
}

/// <summary>
/// Outbox dispatcher configuration settings
/// </summary>
public record OutboxDispatcherSettings : IValueObject
{
    public bool Enabled { get; init; } = true;
    public int IntervalSeconds { get; init; } = 100;
    public int BatchSize { get; init; } = 50;
    public int MaxRetryAttempts { get; init; } = 3;
    
    public static OutboxDispatcherSettings Default => new();
}

/// <summary>
/// Bank SMS configuration settings
/// </summary>
public record BankSmsSettings : IValueObject
{
    public string Secret { get; init; } = string.Empty;
    public int TimeoutSeconds { get; init; } = 30;
    public bool IsEnabled { get; init; } = true;
    
    public static BankSmsSettings Default => new();
}

/// <summary>
/// Raast payments configuration settings
/// </summary>
public record RaastPaymentSettings : IValueObject
{
    public string Iban { get; init; } = string.Empty;
    public bool NumericOnly { get; init; } = false;
    public bool OmitGui { get; init; } = true;
    public bool AmountAsMinorUnits { get; init; } = true;
    public string Alias { get; init; } = string.Empty;
    
    public static RaastPaymentSettings Default => new();
}