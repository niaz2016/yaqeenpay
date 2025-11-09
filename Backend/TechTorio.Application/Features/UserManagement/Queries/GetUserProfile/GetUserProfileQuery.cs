using MediatR;
using TechTorio.Application.Features.UserManagement.Common;

namespace TechTorio.Application.Features.UserManagement.Queries.GetUserProfile;

public class GetUserProfileQuery : IRequest<UserProfileDto>
{
    // Empty query as it will use the current user's identity
}