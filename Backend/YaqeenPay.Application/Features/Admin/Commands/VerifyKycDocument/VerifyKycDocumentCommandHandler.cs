using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Domain.Entities.Identity;
using YaqeenPay.Domain.Enums;
using UserRoleEnum = YaqeenPay.Domain.Enums.UserRole;

namespace YaqeenPay.Application.Features.Admin.Commands.VerifyKycDocument;

public class VerifyKycDocumentCommandHandler : IRequestHandler<VerifyKycDocumentCommand, VerifyKycDocumentResponse>
{
    private readonly IApplicationDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;
    private readonly UserManager<ApplicationUser> _userManager;

    public VerifyKycDocumentCommandHandler(
        IApplicationDbContext dbContext,
        ICurrentUserService currentUserService,
        UserManager<ApplicationUser> userManager)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
        _userManager = userManager;
    }

    public async Task<VerifyKycDocumentResponse> Handle(VerifyKycDocumentCommand request, CancellationToken cancellationToken)
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

        var document = await _dbContext.KycDocuments
            .Include(d => d.User)
            .AsTracking() // Explicitly enable change tracking for this query
            .FirstOrDefaultAsync(d => d.Id == request.DocumentId, cancellationToken);

        if (document == null)
        {
            return new VerifyKycDocumentResponse
            {
                Success = false,
                Message = "Document not found"
            };
        }

        // Update document status
        document.Status = request.Status;
        document.RejectionReason = request.Status == KycDocumentStatus.Rejected ? request.RejectionReason : null;
        document.VerifiedAt = request.Status == KycDocumentStatus.Verified ? DateTime.UtcNow : null;
        document.VerifiedBy = request.Status == KycDocumentStatus.Verified ? adminId : null;
        
        // Mark entity as modified to ensure changes are tracked
        _dbContext.KycDocuments.Update(document);

        // If document is verified, check if all required documents are verified
        // and update user KYC status accordingly
        if (request.Status == KycDocumentStatus.Verified)
        {
            var user = document.User;
            var allDocuments = await _dbContext.KycDocuments
                .Where(d => d.UserId == user.Id)
                .ToListAsync(cancellationToken);

            // Check if all documents are verified
            var allVerified = allDocuments.All(d => d.Status == KycDocumentStatus.Verified);
            if (allVerified)
            {
                user.KycStatus = Domain.Enums.KycStatus.Verified;
                await _userManager.UpdateAsync(user);
            }
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new VerifyKycDocumentResponse
        {
            Success = true,
            Message = $"Document status updated to {request.Status}",
            DocumentId = document.Id,
            Status = document.Status
        };
    }
}