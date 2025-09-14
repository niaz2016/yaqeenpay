using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Domain.Entities.Identity;
using YaqeenPay.Domain.Enums;
using UserRoleEnum = YaqeenPay.Domain.Enums.UserRole;

namespace YaqeenPay.Application.Features.UserManagement.Commands.ApplyForSellerRole;

public class ApplyForSellerRoleCommandHandler : IRequestHandler<ApplyForSellerRoleCommand, SellerRegistrationResponse>
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ICurrentUserService _currentUserService;
    private readonly IApplicationDbContext _dbContext;
    private readonly IDocumentStorageService _documentStorageService;

    public ApplyForSellerRoleCommandHandler(
        UserManager<ApplicationUser> userManager,
        ICurrentUserService currentUserService,
        IApplicationDbContext dbContext,
        IDocumentStorageService documentStorageService)
    {
        _userManager = userManager;
        _currentUserService = currentUserService;
        _dbContext = dbContext;
        _documentStorageService = documentStorageService;
    }

    public async Task<SellerRegistrationResponse> Handle(ApplyForSellerRoleCommand request, CancellationToken cancellationToken)
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

        // Check if user already has seller role
        var isExistingSeller = await _userManager.IsInRoleAsync(user, UserRoleEnum.Seller.ToString());
        
        // Check if user already has a business profile
        var existingProfile = await _dbContext.BusinessProfiles
            .FirstOrDefaultAsync(bp => bp.UserId == userId, cancellationToken);

        BusinessProfile businessProfile;

        if (existingProfile != null)
        {
            // Update existing business profile
            existingProfile.BusinessName = request.BusinessName;
            existingProfile.BusinessType = request.BusinessType;
            existingProfile.BusinessCategory = request.BusinessCategory;
            existingProfile.Description = request.Description;
            existingProfile.Website = request.Website;
            existingProfile.PhoneNumber = request.PhoneNumber;
            existingProfile.Address = request.Address;
            existingProfile.City = request.City;
            existingProfile.State = request.State;
            existingProfile.Country = request.Country;
            existingProfile.PostalCode = request.PostalCode;
            existingProfile.TaxId = request.TaxId;
            // Reset verification status when updating
            existingProfile.VerificationStatus = SellerVerificationStatus.Pending;
            
            businessProfile = existingProfile;
        }
        else
        {
            // Create new business profile
            businessProfile = new BusinessProfile
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

            _dbContext.BusinessProfiles.Add(businessProfile);
        }

        // Process KYC documents (clear existing ones first if updating)
        if (isExistingSeller)
        {
            var existingKycDocs = await _dbContext.KycDocuments
                .Where(k => k.UserId == userId)
                .ToListAsync(cancellationToken);
            _dbContext.KycDocuments.RemoveRange(existingKycDocs);
        }

        foreach (var docRequest in request.Documents)
        {
            // Upload document to storage
            var documentUrl = await _documentStorageService.StoreDocumentAsync(
                docRequest.DocumentBase64,
                docRequest.FileName,
                userId,
                "seller-kyc");

            var document = new KycDocument
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                DocumentType = docRequest.DocumentType,
                DocumentNumber = docRequest.DocumentNumber,
                DocumentUrl = documentUrl,
                Status = KycDocumentStatus.Pending
            };

            _dbContext.KycDocuments.Add(document);
        }

        // Update user KYC status
        user.KycStatus = Domain.Enums.KycStatus.Submitted;
        
        // Add seller role if not already present
        if (!isExistingSeller)
        {
            await _userManager.AddToRoleAsync(user, UserRoleEnum.Seller.ToString());
        }

        // Save changes
        await _dbContext.SaveChangesAsync(cancellationToken);
        await _userManager.UpdateAsync(user);

        // Update profile completeness
        user.UpdateProfileCompleteness();
        await _userManager.UpdateAsync(user);

        var roles = await _userManager.GetRolesAsync(user);

        var message = isExistingSeller 
            ? "Seller profile updated successfully. Waiting for approval." 
            : "Seller application submitted successfully. Waiting for approval.";

        return new SellerRegistrationResponse
        {
            Success = true,
            Message = message,
            BusinessProfileId = businessProfile.Id,
            UserId = userId,
            Status = SellerVerificationStatus.Pending,
            Roles = roles.ToList()
        };
    }
}