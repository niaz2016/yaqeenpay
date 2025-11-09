using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Domain.Entities.Identity;
using TechTorio.Domain.Enums;
using UserRoleEnum = TechTorio.Domain.Enums.UserRole;

namespace TechTorio.Application.Features.Admin.Commands.VerifySellerProfile;

public class VerifySellerProfileCommandHandler : IRequestHandler<VerifySellerProfileCommand, VerifySellerProfileResponse>
{
    private readonly IApplicationDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IWalletService _walletService;

    public VerifySellerProfileCommandHandler(
        IApplicationDbContext dbContext,
        ICurrentUserService currentUserService,
        UserManager<ApplicationUser> userManager,
        IWalletService walletService)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
        _userManager = userManager;
        _walletService = walletService;
    }

    public async Task<VerifySellerProfileResponse> Handle(VerifySellerProfileCommand request, CancellationToken cancellationToken)
    {
        var adminId = _currentUserService.UserId;
        if (adminId == null)
        {
            throw new UnauthorizedAccessException("User is not authenticated");
        }

        var admin = await _userManager.FindByIdAsync(adminId.ToString());
        if (admin == null || !await _userManager.IsInRoleAsync(admin, UserRoleEnum.Admin.ToString()))
        {
            throw new UnauthorizedAccessException("User is not authorized for this action");
        }

        var profile = await _dbContext.BusinessProfiles
            .AsTracking() // Explicitly enable change tracking for this query
            .FirstOrDefaultAsync(bp => bp.Id == request.BusinessProfileId, cancellationToken);

        if (profile == null)
        {
            return new VerifySellerProfileResponse
            {
                Success = false,
                Message = "Business profile not found"
            };
        }

        // Update profile status
        profile.VerificationStatus = request.Status;
        profile.RejectionReason = request.Status == SellerVerificationStatus.Rejected ? request.RejectionReason : null;
        profile.VerifiedAt = request.Status == SellerVerificationStatus.Approved ? DateTime.UtcNow : null;
        profile.VerifiedBy = request.Status == SellerVerificationStatus.Approved ? adminId : null;
        
        // Mark entity as modified to ensure changes are tracked
        _dbContext.BusinessProfiles.Update(profile);

        // If seller is approved, grant seller role and create wallet
        if (request.Status == SellerVerificationStatus.Approved)
        {
            var user = await _userManager.FindByIdAsync(profile.UserId.ToString());
            if (user != null)
            {
                // Add seller role if not already assigned
                if (!await _userManager.IsInRoleAsync(user, UserRoleEnum.Seller.ToString()))
                {
                    var roleResult = await _userManager.AddToRoleAsync(user, UserRoleEnum.Seller.ToString());
                    if (!roleResult.Succeeded)
                    {
                        return new VerifySellerProfileResponse
                        {
                            Success = false,
                            Message = "Failed to grant seller role: " + string.Join(", ", roleResult.Errors.Select(e => e.Description))
                        };
                    }
                }
                
                // Create wallet if it doesn't exist
                var existingWallet = await _walletService.GetWalletByUserIdAsync(profile.UserId);
                if (existingWallet == null)
                {
                    await _walletService.CreateWalletAsync(profile.UserId, "PKR");
                }
            }
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new VerifySellerProfileResponse
        {
            Success = true,
            Message = $"Seller profile status updated to {request.Status}",
            BusinessProfileId = profile.Id,
            Status = profile.VerificationStatus
        };
    }
}