using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Features.UserManagement.Common;
using YaqeenPay.Domain.Entities.Identity;
using YaqeenPay.Domain.Enums;

namespace YaqeenPay.Application.Features.UserManagement.Commands.SubmitKycDocument;

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
        if (userId == null)
        {
            throw new UnauthorizedAccessException("User is not authenticated");
        }

        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        // Upload the document to storage
        var documentUrl = await _documentStorageService.StoreDocumentAsync(
            request.DocumentBase64,
            request.FileName,
            userId.Value,
            "kyc");

        // Create new KYC document
        var document = new KycDocument
        {
            Id = Guid.NewGuid(),
            UserId = userId.Value,
            DocumentType = request.DocumentType,
            DocumentNumber = request.DocumentNumber,
            DocumentUrl = documentUrl,
            Status = KycDocumentStatus.Pending
        };

        // Save to database
        _dbContext.KycDocuments.Add(document);
        
        // Update user KYC status if not already submitted or verified
        if (user.KycStatus == Domain.Enums.KycStatus.Pending)
        {
            user.KycStatus = Domain.Enums.KycStatus.Submitted;
            await _userManager.UpdateAsync(user);
        }
        
        await _dbContext.SaveChangesAsync(cancellationToken);

        // Update user profile completeness
        user.UpdateProfileCompleteness();
        await _userManager.UpdateAsync(user);

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