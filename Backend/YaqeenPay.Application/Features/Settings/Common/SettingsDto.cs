using YaqeenPay.Domain.Enums;

namespace YaqeenPay.Application.Features.Settings.Common;

public class UserSettingsDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public SettingsCategory Category { get; set; }
    public string SettingsData { get; set; } = "{}";
    public DateTime CreatedAt { get; set; }
    public DateTime? LastModifiedAt { get; set; }
}

public class AllUserSettingsDto
{
    public AccountSettingsDto Account { get; set; } = new();
    public SecuritySettingsDto Security { get; set; } = new();
    public NotificationSettingsDto Notifications { get; set; } = new();
    public PaymentSettingsDto Payments { get; set; } = new();
    public BusinessSettingsDto? Business { get; set; }
    public AppearanceSettingsDto Appearance { get; set; } = new();
    public IntegrationSettingsDto Integrations { get; set; } = new();
}

public class AccountSettingsDto
{
    public string? DefaultLanguage { get; set; } = "en";
    public string? DefaultCurrency { get; set; } = "PKR";
    public string? TimeZone { get; set; } = "Asia/Karachi";
    public bool MarketingEmails { get; set; } = true;
    public bool DataExportEnabled { get; set; } = true;
    public string? PreferredContactMethod { get; set; } = "email";
}

public class SecuritySettingsDto
{
    public bool TwoFactorEnabled { get; set; } = false;
    public bool LoginAlertsEnabled { get; set; } = true;
    public int SessionTimeoutMinutes { get; set; } = 30;
    public bool RequirePasswordForSensitiveActions { get; set; } = true;
    public bool EnableSecurityNotifications { get; set; } = true;
    public List<string> TrustedDevices { get; set; } = new();
    public DateTime? LastPasswordChange { get; set; }
}

public class NotificationSettingsDto
{
    public bool EmailEnabled { get; set; } = true;
    public bool SmsEnabled { get; set; } = false;
    public bool PushEnabled { get; set; } = true;
    public string EmailFrequency { get; set; } = "immediate"; // immediate, daily, weekly
    public bool OrderNotifications { get; set; } = true;
    public bool PaymentNotifications { get; set; } = true;
    public bool SecurityNotifications { get; set; } = true;
    public bool MarketingNotifications { get; set; } = false;
    public QuietHoursDto QuietHours { get; set; } = new();
}

public class QuietHoursDto
{
    public bool Enabled { get; set; } = false;
    public string StartTime { get; set; } = "22:00";
    public string EndTime { get; set; } = "08:00";
    public List<string> Days { get; set; } = new(); // ["monday", "tuesday", etc.]
}

public class PaymentSettingsDto
{
    public string? DefaultPaymentMethod { get; set; }
    public bool AutoPaymentEnabled { get; set; } = false;
    public string DisplayCurrency { get; set; } = "PKR";
    public decimal? DailyTransactionLimit { get; set; }
    public decimal? MonthlyTransactionLimit { get; set; }
    public string? PreferredWithdrawalMethod { get; set; }
    public decimal MinimumWithdrawalAmount { get; set; } = 500;
    public bool EnableTransactionNotifications { get; set; } = true;
}

public class BusinessSettingsDto
{
    public string? BusinessName { get; set; }
    public string? BusinessDescription { get; set; }
    public string? OperatingHours { get; set; }
    public List<string> ShippingMethods { get; set; } = new();
    public int DefaultHandlingTime { get; set; } = 2; // days
    public bool AutoAcceptOrders { get; set; } = false;
    public List<string> PreferredCategories { get; set; } = new();
    public bool EnableBusinessNotifications { get; set; } = true;
}

public class AppearanceSettingsDto
{
    public string Theme { get; set; } = "light"; // light, dark, system
    public string Language { get; set; } = "en";
    public string DateFormat { get; set; } = "DD/MM/YYYY";
    public string TimeFormat { get; set; } = "24"; // 12, 24
    public string Density { get; set; } = "comfortable"; // compact, comfortable
    public bool HighContrastMode { get; set; } = false;
    public int FontSize { get; set; } = 14;
    public bool ReducedAnimations { get; set; } = false;
}

public class IntegrationSettingsDto
{
    public List<ConnectedAppDto> ConnectedApps { get; set; } = new();
    public List<ApiKeyDto> ApiKeys { get; set; } = new();
    public List<WebhookDto> Webhooks { get; set; } = new();
    public bool DataExportEnabled { get; set; } = true;
    public string ExportFormat { get; set; } = "json";
}

public class ConnectedAppDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public DateTime ConnectedAt { get; set; }
    public List<string> Permissions { get; set; } = new();
    public DateTime? LastUsed { get; set; }
}

public class ApiKeyDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string MaskedKey { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? LastUsed { get; set; }
    public List<string> Scopes { get; set; } = new();
}

public class WebhookDto
{
    public string Id { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public List<string> Events { get; set; } = new();
    public bool Active { get; set; } = true;
    public DateTime CreatedAt { get; set; }
}

public class SettingsAuditDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Category { get; set; } = string.Empty;
    public string SettingKey { get; set; } = string.Empty;
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public DateTime ChangedAt { get; set; }
    public Guid ChangedBy { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
}