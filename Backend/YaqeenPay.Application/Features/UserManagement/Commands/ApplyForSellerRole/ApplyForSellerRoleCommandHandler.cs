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
        if (userId == Guid.Empty)
        {
            throw new UnauthorizedAccessException("User is not authenticated");
        }

        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        // Validate required fields
        if (string.IsNullOrWhiteSpace(request.BusinessName))
        {
            throw new ArgumentException("Business name is required");
        }

        if (request.Documents == null || !request.Documents.Any())
        {
            throw new ArgumentException("At least one KYC document is required");
        }

        // Check if user already has seller role
        var isExistingSeller = await _userManager.IsInRoleAsync(user, UserRoleEnum.Seller.ToString());
        
        // Check if user already has a business profile
        var existingProfile = await _dbContext.BusinessProfiles
            .AsTracking() // Need to track for updates
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
            existingProfile.LastModifiedAt = DateTime.UtcNow;
            
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
                VerificationStatus = SellerVerificationStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            _dbContext.BusinessProfiles.Add(businessProfile);
        }

        // Process KYC documents (clear existing ones first if updating)
        if (isExistingSeller)
        {
            var existingKycDocs = await _dbContext.KycDocuments
                .AsTracking() // Need to track for deletion
                .Where(k => k.UserId == userId)
                .ToListAsync(cancellationToken);
            _dbContext.KycDocuments.RemoveRange(existingKycDocs);
        }

        // Upload and create KYC documents
        foreach (var docRequest in request.Documents)
        {
            // Validate document fields
            if (string.IsNullOrWhiteSpace(docRequest.DocumentBase64))
            {
                throw new ArgumentException($"Document content is required for {docRequest.DocumentType}");
            }

            if (string.IsNullOrWhiteSpace(docRequest.FileName))
            {
                throw new ArgumentException($"File name is required for {docRequest.DocumentType}");
            }

            string documentUrl;
            try
            {
                // Upload document to storage
                documentUrl = await _documentStorageService.StoreDocumentAsync(
                    docRequest.DocumentBase64,
                    docRequest.FileName,
                    userId,
                    "seller-kyc");
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException($"Failed to upload {docRequest.DocumentType} document: {ex.Message}", ex);
            }

            var document = new KycDocument
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                DocumentType = docRequest.DocumentType,
                DocumentNumber = docRequest.DocumentNumber ?? string.Empty,
                DocumentUrl = documentUrl,
                Status = KycDocumentStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            _dbContext.KycDocuments.Add(document);
        }

        // Update user KYC status
        user.KycStatus = Domain.Enums.KycStatus.Submitted;
        
        // Add seller role if not already present
        if (!isExistingSeller)
        {
            var roleResult = await _userManager.AddToRoleAsync(user, UserRoleEnum.Seller.ToString());
            if (!roleResult.Succeeded)
            {
                var errors = string.Join(", ", roleResult.Errors.Select(e => e.Description));
                throw new InvalidOperationException($"Failed to add seller role: {errors}");
            }
        }

        // Save changes
        try
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to save seller registration: {ex.Message}", ex);
        }

        try
        {
            await _userManager.UpdateAsync(user);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to update user status: {ex.Message}", ex);
        }

        // Update profile completeness
        try
        {
            user.UpdateProfileCompleteness();
            await _userManager.UpdateAsync(user);
        }
        catch
        {
            // Don't fail if profile completeness update fails
        }

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