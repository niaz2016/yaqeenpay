using MediatR;
using YaqeenPay.Application.Features.UserManagement.Common;

namespace YaqeenPay.Application.Features.UserManagement.Queries.GetUserProfile;

public class GetUserProfileQuery : IRequest<UserProfileDto>
{
    // Empty query as it will use the current user's identity
}