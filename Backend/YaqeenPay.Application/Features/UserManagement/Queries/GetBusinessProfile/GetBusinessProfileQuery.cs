using MediatR;
using YaqeenPay.Application.Features.UserManagement.Common;

namespace YaqeenPay.Application.Features.UserManagement.Queries.GetBusinessProfile;

public class GetBusinessProfileQuery : IRequest<BusinessProfileDto?>
{
    // Empty query as it will use the current user's identity
}