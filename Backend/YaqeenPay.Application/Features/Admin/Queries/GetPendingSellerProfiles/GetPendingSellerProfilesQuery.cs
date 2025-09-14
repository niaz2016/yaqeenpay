using MediatR;
using YaqeenPay.Application.Features.Admin.Common;

namespace YaqeenPay.Application.Features.Admin.Queries.GetPendingSellerProfiles;

public class GetPendingSellerProfilesQuery : IRequest<List<AdminBusinessProfileDto>>
{
    // Empty query
}