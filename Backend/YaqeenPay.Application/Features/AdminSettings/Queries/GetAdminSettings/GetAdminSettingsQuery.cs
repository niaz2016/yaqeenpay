using MediatR;
using YaqeenPay.Application.Features.AdminSettings.Common;

namespace YaqeenPay.Application.Features.AdminSettings.Queries.GetAdminSettings;

public class GetAdminSettingsQuery : IRequest<List<AdminSettingsGroupDto>>
{
    public bool IncludeInactive { get; set; } = false;
    public bool MaskSensitiveValues { get; set; } = true;
}