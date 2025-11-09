using MediatR;
using Microsoft.AspNetCore.Identity;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Application.Features.UserManagement.Common;
using TechTorio.Domain.Entities.Identity;
using TechTorio.Domain.Enums;

namespace TechTorio.Application.Features.UserManagement.Queries.GetUserProfile;

public class GetUserProfileQueryHandler : IRequestHandler<GetUserProfileQuery, UserProfileDto>
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ICurrentUserService _currentUserService;

    public GetUserProfileQueryHandler(
        UserManager<ApplicationUser> userManager,
        ICurrentUserService currentUserService)
    {
        _userManager = userManager;
        _currentUserService = currentUserService;
    }

    public async Task<UserProfileDto> Handle(GetUserProfileQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (userId == Guid.Empty)
        {
            throw new UnauthorizedAccessException("User is not authenticated");
        }

        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        var roles = await _userManager.GetRolesAsync(user);

    return new UserProfileDto
        {
            Id = user.Id,
            Email = user.Email ?? string.Empty,
            PhoneNumber = user.PhoneNumber ?? string.Empty,
            FirstName = user.FirstName,
            LastName = user.LastName,
            ProfileImageUrl = user.ProfileImageUrl,
            DateOfBirth = user.DateOfBirth,
            Gender = user.Gender,
            Address = user.Address,
            City = user.City,
            State = user.State,
            Country = user.Country,
            PostalCode = user.PostalCode,
            // Use verified timestamps if present, otherwise fall back to Identity's confirmation fields
            IsEmailVerified = user.IsEmailVerified || user.EmailConfirmed,
            IsPhoneVerified = user.IsPhoneVerified || user.PhoneNumberConfirmed,
            HasPassword = !string.IsNullOrEmpty(user.PasswordHash),
            KycStatus = user.KycStatus,
            ProfileCompleteness = user.ProfileCompleteness,
            Roles = roles.ToList(),
            Created = user.Created
        };
    }
}