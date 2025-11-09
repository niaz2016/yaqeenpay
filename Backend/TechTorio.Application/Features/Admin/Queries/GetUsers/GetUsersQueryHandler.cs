using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Domain.Entities.Identity;

namespace TechTorio.Application.Features.Admin.Queries.GetUsers;

public class GetUsersQueryHandler : IRequestHandler<GetUsersQuery, List<UserDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;

    public GetUsersQueryHandler(IApplicationDbContext context, UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    public async Task<List<UserDto>> Handle(GetUsersQuery request, CancellationToken cancellationToken)
    {
        var users = await _context.Users.ToListAsync(cancellationToken);
        var result = new List<UserDto>();
        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            result.Add(new UserDto
            {
                Id = user.Id,
                UserName = user.UserName ?? string.Empty,
                Email = user.Email ?? string.Empty,
                EmailConfirmed = user.EmailConfirmed,
                IsActive = user.EmailConfirmed,
                Name = $"{(user.FirstName ?? "").Trim()} {(user.LastName ?? "").Trim()}".Trim(),
                RegistrationDate = user.Created,
                ProfileCompleteness = user.ProfileCompleteness,
                Roles = roles.ToList()
            });
        }
        return result;
    }
}
