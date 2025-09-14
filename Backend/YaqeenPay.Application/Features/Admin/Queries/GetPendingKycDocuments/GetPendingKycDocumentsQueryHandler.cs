using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Features.Admin.Common;
using YaqeenPay.Domain.Entities.Identity;
using YaqeenPay.Domain.Enums;
using UserRoleEnum = YaqeenPay.Domain.Enums.UserRole;

namespace YaqeenPay.Application.Features.Admin.Queries.GetPendingKycDocuments;

public class GetPendingKycDocumentsQueryHandler : IRequestHandler<GetPendingKycDocumentsQuery, List<AdminKycDocumentDto>>
{
    private readonly IApplicationDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;
    private readonly UserManager<ApplicationUser> _userManager;

    public GetPendingKycDocumentsQueryHandler(
        IApplicationDbContext dbContext,
        ICurrentUserService currentUserService,
        UserManager<ApplicationUser> userManager)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
        _userManager = userManager;
    }

    public async Task<List<AdminKycDocumentDto>> Handle(GetPendingKycDocumentsQuery request, CancellationToken cancellationToken)
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

        var pendingDocuments = await _dbContext.KycDocuments
            .Include(d => d.User)
            .Where(d => d.Status == KycDocumentStatus.Pending)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync(cancellationToken);

        return [.. pendingDocuments.Select(d => new AdminKycDocumentDto
        {
            Id = d.Id,
            UserId = d.UserId,
            UserEmail = d.User.Email ?? string.Empty,
            UserFullName = $"{d.User.FirstName} {d.User.LastName}".Trim(),
            DocumentType = d.DocumentType,
            DocumentNumber = d.DocumentNumber,
            DocumentUrl = d.DocumentUrl,
            Status = d.Status,
            RejectionReason = d.RejectionReason,
            VerifiedAt = d.VerifiedAt,
            VerifiedBy = d.VerifiedBy,
            CreatedAt = d.CreatedAt
        })];
    }
}