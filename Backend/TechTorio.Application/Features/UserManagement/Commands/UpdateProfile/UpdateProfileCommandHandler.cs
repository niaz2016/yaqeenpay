using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Application.Features.UserManagement.Common;
using TechTorio.Domain.Entities.Identity;
using TechTorio.Domain.Enums;

namespace TechTorio.Application.Features.UserManagement.Commands.UpdateProfile;

public class UpdateProfileCommandHandler : IRequestHandler<UpdateProfileCommand, UserProfileDto>
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ICurrentUserService _currentUserService;
    private readonly IApplicationDbContext _dbContext;

    public UpdateProfileCommandHandler(
        UserManager<ApplicationUser> userManager,
        ICurrentUserService currentUserService,
        IApplicationDbContext dbContext)
    {
        _userManager = userManager;
        _currentUserService = currentUserService;
        _dbContext = dbContext;
    }

    public async Task<UserProfileDto> Handle(UpdateProfileCommand request, CancellationToken cancellationToken)
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

        // Update user profile
        user.FirstName = request.FirstName ?? user.FirstName;
        user.LastName = request.LastName ?? user.LastName;
        user.DateOfBirth = request.DateOfBirth ?? user.DateOfBirth;
        user.Gender = request.Gender ?? user.Gender;
        user.Address = request.Address ?? user.Address;
        user.City = request.City ?? user.City;
        user.State = request.State ?? user.State;
        user.Country = request.Country ?? user.Country;
        user.PostalCode = request.PostalCode ?? user.PostalCode;
        // Update phone if provided
        if (!string.IsNullOrWhiteSpace(request.PhoneNumber) && request.PhoneNumber != user.PhoneNumber)
        {
            user.PhoneNumber = request.PhoneNumber;
            // Reset phone verification when number changes
            user.PhoneVerifiedAt = null;
            user.PhoneNumberConfirmed = false;
        }
    // Allow updating profile image URL
    user.ProfileImageUrl = request.ProfileImageUrl ?? user.ProfileImageUrl;

        // Calculate profile completeness
        user.UpdateProfileCompleteness();

        await _userManager.UpdateAsync(user);

    // Get user roles
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
            // Prefer explicit verified timestamps; fall back to Identity's confirmation flags
            IsEmailVerified = user.IsEmailVerified || user.EmailConfirmed,
            IsPhoneVerified = user.IsPhoneVerified || user.PhoneNumberConfirmed,
            KycStatus = user.KycStatus,
            ProfileCompleteness = user.ProfileCompleteness,
            Roles = roles.ToList(),
            Created = user.Created
        };
    }
}