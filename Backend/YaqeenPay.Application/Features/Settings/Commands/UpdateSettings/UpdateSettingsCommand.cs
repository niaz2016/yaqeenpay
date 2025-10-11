using MediatR;
using YaqeenPay.Domain.Enums;

namespace YaqeenPay.Application.Features.Settings.Commands.UpdateSettings;

public class UpdateSettingsCommand : IRequest<bool>
{
    public Guid UserId { get; set; }
    public SettingsCategory Category { get; set; }
    public object SettingsData { get; set; } = new();
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
}