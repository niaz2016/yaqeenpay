using MediatR;
using YaqeenPay.Application.Features.AdminSettings.Common;

namespace YaqeenPay.Application.Features.AdminSettings.Commands.UpdateAdminSetting;

public class UpdateAdminSettingCommand : IRequest<AdminSettingsOperationResult>
{
    public string SettingKey { get; set; } = string.Empty;
    public string SettingValue { get; set; } = string.Empty;
    public string? Notes { get; set; }
    
    // Audit info (set by middleware)
    public Guid? UserId { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
}