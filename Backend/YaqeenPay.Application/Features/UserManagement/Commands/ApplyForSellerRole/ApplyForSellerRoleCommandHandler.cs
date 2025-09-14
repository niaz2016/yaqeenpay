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
        if (await _userManager.IsInRoleAsync(user, UserRoleEnum.Seller.ToString()))
        {
            return new SellerRegistrationResponse
            {
                Success = false,
                Message = "User already has seller role"
            };
        }

        // Check if user already has a business profile
        var existingProfile = await _dbContext.BusinessProfiles
            .FirstOrDefaultAsync(bp => bp.UserId == userId, cancellationToken);

        if (existingProfile != null)
        {
            return new SellerRegistrationResponse
            {
                Success = false,
                Message = "User already has a business profile",
                BusinessProfileId = existingProfile.Id,
                UserId = userId,
                Status = existingProfile.VerificationStatus
            };
        }

        // Create business profile
        var businessProfile = new BusinessProfile
        {
            Id = Guid.NewGuid(),
            UserId = userId.Value,
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

        // Process KYC documents
        foreach (var docRequest in request.Documents)
        {
            // Upload document to storage
            var documentUrl = await _documentStorageService.StoreDocumentAsync(
                docRequest.DocumentBase64,
                docRequest.FileName,
                userId.Value,
                "seller-kyc");

            var document = new KycDocument
            {
                Id = Guid.NewGuid(),
                UserId = userId.Value,
                DocumentType = docRequest.DocumentType,
                DocumentNumber = docRequest.DocumentNumber,
                DocumentUrl = documentUrl,
                Status = KycDocumentStatus.Pending
            };

            _dbContext.KycDocuments.Add(document);
        }

        // Update user KYC status
        user.KycStatus = Domain.Enums.KycStatus.Submitted;
        
        // Add seller role
        await _userManager.AddToRoleAsync(user, UserRoleEnum.Seller.ToString());

        // Save changes
        await _dbContext.SaveChangesAsync(cancellationToken);
        await _userManager.UpdateAsync(user);

        // Update profile completeness
        user.UpdateProfileCompleteness();
        await _userManager.UpdateAsync(user);

        var roles = await _userManager.GetRolesAsync(user);

        return new SellerRegistrationResponse
        {
            Success = true,
            Message = "Seller application submitted successfully. Waiting for approval.",
            BusinessProfileId = businessProfile.Id,
            UserId = userId,
            Status = SellerVerificationStatus.Pending,
            Roles = roles.ToList()
        };
    }
}