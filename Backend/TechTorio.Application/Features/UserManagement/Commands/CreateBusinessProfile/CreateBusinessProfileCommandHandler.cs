using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Application.Features.UserManagement.Common;
using TechTorio.Domain.Entities.Identity;
using TechTorio.Domain.Enums;
using UserRoleEnum = TechTorio.Domain.Enums.UserRole;

namespace TechTorio.Application.Features.UserManagement.Commands.CreateBusinessProfile;

public class CreateBusinessProfileCommandHandler : IRequestHandler<CreateBusinessProfileCommand, BusinessProfileDto>
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ICurrentUserService _currentUserService;
    private readonly IApplicationDbContext _dbContext;

    public CreateBusinessProfileCommandHandler(
        UserManager<ApplicationUser> userManager,
        ICurrentUserService currentUserService,
        IApplicationDbContext dbContext)
    {
        _userManager = userManager;
        _currentUserService = currentUserService;
        _dbContext = dbContext;
    }

    public async Task<BusinessProfileDto> Handle(CreateBusinessProfileCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (userId == null)
        {
            throw new UnauthorizedAccessException("User is not authenticated");
        }

        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        // Check if user already has a business profile
        var existingProfile = await _dbContext.BusinessProfiles
            .FirstOrDefaultAsync(bp => bp.UserId == userId, cancellationToken);

        if (existingProfile != null)
        {
            throw new InvalidOperationException("User already has a business profile");
        }

        // Create new business profile
        var businessProfile = new BusinessProfile
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            BusinessName = request.BusinessName,
            BusinessType = request.BusinessType,
            BusinessCategory = request.BusinessCategory,
            Description = request.Description,
            Website = request.Website,
            PhoneNumber = request.PhoneNumber,
            Address = request.Address,
            City = request.City,
            State = request.State,
            Country = request.Country,
            PostalCode = request.PostalCode,
            TaxId = request.TaxId,
            VerificationStatus = SellerVerificationStatus.Pending
        };

        // Save to database
        _dbContext.BusinessProfiles.Add(businessProfile);
        await _dbContext.SaveChangesAsync(cancellationToken);

        // Add seller role if not already present
        if (!await _userManager.IsInRoleAsync(user, UserRoleEnum.Seller.ToString()))
        {
            await _userManager.AddToRoleAsync(user, UserRoleEnum.Seller.ToString());
        }

        return new BusinessProfileDto
        {
            Id = businessProfile.Id,
            BusinessName = businessProfile.BusinessName,
            BusinessType = businessProfile.BusinessType,
            BusinessCategory = businessProfile.BusinessCategory,
            Description = businessProfile.Description,
            Website = businessProfile.Website,
            PhoneNumber = businessProfile.PhoneNumber,
            Address = businessProfile.Address,
            City = businessProfile.City,
            State = businessProfile.State,
            Country = businessProfile.Country,
            PostalCode = businessProfile.PostalCode,
            TaxId = businessProfile.TaxId,
            VerificationStatus = businessProfile.VerificationStatus,
            VerifiedAt = businessProfile.VerifiedAt,
            RejectionReason = businessProfile.RejectionReason,
            CreatedAt = businessProfile.CreatedAt
        };
    }
}