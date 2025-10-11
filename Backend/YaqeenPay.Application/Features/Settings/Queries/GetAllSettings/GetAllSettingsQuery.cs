using MediatR;
using YaqeenPay.Application.Features.Settings.Common;

namespace YaqeenPay.Application.Features.Settings.Queries.GetAllSettings;

public class GetAllSettingsQuery : IRequest<AllUserSettingsDto>
{
    public Guid UserId { get; set; }
}