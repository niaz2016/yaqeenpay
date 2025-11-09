using MediatR;
using TechTorio.Application.Features.UserManagement.Common;

namespace TechTorio.Application.Features.UserManagement.Queries.GetBusinessProfile;

public class GetBusinessProfileQuery : IRequest<BusinessProfileDto?>
{
    // Empty query as it will use the current user's identity
}