using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Application.Features.UserManagement.Common;
using TechTorio.Domain.Entities.Identity;
using TechTorio.Domain.Enums;

namespace TechTorio.Application.Features.UserManagement.Commands.SubmitKycDocument;

public class SubmitKycDocumentCommandHandler : IRequestHandler<SubmitKycDocumentCommand, KycDocumentDto>
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ICurrentUserService _currentUserService;
    private readonly IApplicationDbContext _dbContext;
    private readonly IDocumentStorageService _documentStorageService;

    public SubmitKycDocumentCommandHandler(
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

    public async Task<KycDocumentDto> Handle(SubmitKycDocumentCommand request, CancellationToken cancellationToken)
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

        // Validate input
        if (string.IsNullOrWhiteSpace(request.DocumentBase64))
        {
            throw new ArgumentException("Document content is required");
        }

        if (string.IsNullOrWhiteSpace(request.FileName))
        {
            throw new ArgumentException("File name is required");
        }

        string documentUrl;
        try
        {
            // Upload the document to storage
            documentUrl = await _documentStorageService.StoreDocumentAsync(
                request.DocumentBase64,
                request.FileName,
                userId,
                "kyc");
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to upload document: {ex.Message}", ex);
        }

        // Create new KYC document
        var document = new KycDocument
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            DocumentType = request.DocumentType,
            DocumentNumber = request.DocumentNumber ?? string.Empty,
            DocumentUrl = documentUrl,
            Status = KycDocumentStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        // Save to database
        _dbContext.KycDocuments.Add(document);
        
        // Update user KYC status if not already submitted or verified
        if (user.KycStatus == Domain.Enums.KycStatus.Pending)
        {
            user.KycStatus = Domain.Enums.KycStatus.Submitted;
            await _userManager.UpdateAsync(user);
        }
        
        try
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to save KYC document to database: {ex.Message}", ex);
        }

        // Update user profile completeness
        try
        {
            user.UpdateProfileCompleteness();
            await _userManager.UpdateAsync(user);
        }
        catch
        {
            // Log but don't fail the request if profile completeness update fails
            // The document has already been saved successfully
        }

        return new KycDocumentDto
        {
            Id = document.Id,
            DocumentType = document.DocumentType,
            DocumentNumber = document.DocumentNumber,
            DocumentUrl = document.DocumentUrl,
            Status = document.Status,
            RejectionReason = document.RejectionReason,
            VerifiedAt = document.VerifiedAt,
            CreatedAt = document.CreatedAt
        };
    }
}