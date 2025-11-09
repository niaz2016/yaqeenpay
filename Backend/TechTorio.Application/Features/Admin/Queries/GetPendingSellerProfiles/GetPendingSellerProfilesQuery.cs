using MediatR;
using TechTorio.Application.Features.Admin.Common;

namespace TechTorio.Application.Features.Admin.Queries.GetPendingSellerProfiles;

public class GetPendingSellerProfilesQuery : IRequest<List<AdminBusinessProfileDto>>
{
    // Empty query
}