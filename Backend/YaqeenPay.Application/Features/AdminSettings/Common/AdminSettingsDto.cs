using YaqeenPay.Domain.Enums;

namespace YaqeenPay.Application.Features.AdminSettings.Common;

/// <summary>
/// DTO for admin system settings
/// </summary>
public class AdminSystemSettingsDto
{
    public Guid Id { get; set; }
    public string SettingKey { get; set; } = string.Empty;
    public string SettingValue { get; set; } = string.Empty;
    public string DataType { get; set; } = "string";
    public AdminSettingsCategory Category { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsEncrypted { get; set; } = false;
    public bool IsSensitive { get; set; } = false;
    public string? DefaultValue { get; set; }
    public string? ValidationRules { get; set; }
    public Guid? ModifiedByUserId { get; set; }
    public string? ModifiedByUserName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastModifiedAt { get; set; }
}

/// <summary>
/// DTO for admin settings audit trail
/// </summary>
public class AdminSettingsAuditDto
{
    public Guid Id { get; set; }
    public string SettingKey { get; set; } = string.Empty;
    public AdminSettingsCategory Category { get; set; }
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public string ChangeType { get; set; } = string.Empty;
    public DateTime ChangedAt { get; set; }
    public Guid ChangedByUserId { get; set; }
    public string ChangedByUserName { get; set; } = string.Empty;
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// Grouped admin settings by category
/// </summary>
public class AdminSettingsGroupDto
{
    public AdminSettingsCategory Category { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string CategoryDescription { get; set; } = string.Empty;
    public List<AdminSystemSettingsDto> Settings { get; set; } = new();
}

/// <summary>
/// Request to update a setting value
/// </summary>
public class UpdateAdminSettingRequest
{
    public string SettingKey { get; set; } = string.Empty;
    public string SettingValue { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

/// <summary>
/// Request to create a new setting
/// </summary>
public class CreateAdminSettingRequest
{
    public string SettingKey { get; set; } = string.Empty;
    public string SettingValue { get; set; } = string.Empty;
    public string DataType { get; set; } = "string";
    public AdminSettingsCategory Category { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsEncrypted { get; set; } = false;
    public bool IsSensitive { get; set; } = false;
    public string? DefaultValue { get; set; }
    public string? ValidationRules { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// Bulk update request for multiple settings
/// </summary>
public class BulkUpdateAdminSettingsRequest
{
    public List<UpdateAdminSettingRequest> Settings { get; set; } = new();
    public string? Notes { get; set; }
}

/// <summary>
/// Response for admin settings operations
/// </summary>
public class AdminSettingsOperationResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<string> Errors { get; set; } = new();
    public AdminSystemSettingsDto? Setting { get; set; }
}

/// <summary>
/// Statistics about admin settings
/// </summary>
public class AdminSettingsStatsDto
{
    public int TotalSettings { get; set; }
    public int ActiveSettings { get; set; }
    public int EncryptedSettings { get; set; }
    public int SensitiveSettings { get; set; }
    public Dictionary<AdminSettingsCategory, int> SettingsByCategory { get; set; } = new();
    public DateTime? LastModified { get; set; }
    public string? LastModifiedBy { get; set; }
}