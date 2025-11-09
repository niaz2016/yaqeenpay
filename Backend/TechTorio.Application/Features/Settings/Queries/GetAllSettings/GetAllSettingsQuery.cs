using MediatR;
using TechTorio.Application.Features.Settings.Common;

namespace TechTorio.Application.Features.Settings.Queries.GetAllSettings;

public class GetAllSettingsQuery : IRequest<AllUserSettingsDto>
{
    public Guid UserId { get; set; }
}