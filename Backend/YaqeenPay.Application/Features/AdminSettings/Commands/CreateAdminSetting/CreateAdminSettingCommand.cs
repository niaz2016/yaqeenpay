using MediatR;
using YaqeenPay.Application.Features.AdminSettings.Common;
using YaqeenPay.Domain.Enums;

namespace YaqeenPay.Application.Features.AdminSettings.Commands.CreateAdminSetting;

public class CreateAdminSettingCommand : IRequest<AdminSettingsOperationResult>
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
    
    // Audit info (set by middleware)
    public Guid? UserId { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
}