using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Features.Admin.Common;
using YaqeenPay.Domain.Entities.Identity;
using YaqeenPay.Domain.Enums;
using UserRoleEnum = YaqeenPay.Domain.Enums.UserRole;

namespace YaqeenPay.Application.Features.Admin.Queries.GetPendingSellerProfiles;

public class GetPendingSellerProfilesQueryHandler : IRequestHandler<GetPendingSellerProfilesQuery, List<AdminBusinessProfileDto>>
{
    private readonly IApplicationDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;
    private readonly UserManager<ApplicationUser> _userManager;

    public GetPendingSellerProfilesQueryHandler(
        IApplicationDbContext dbContext,
        ICurrentUserService currentUserService,
        UserManager<ApplicationUser> userManager)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
        _userManager = userManager;
    }

    public async Task<List<AdminBusinessProfileDto>> Handle(GetPendingSellerProfilesQuery request, CancellationToken cancellationToken)
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

        var pendingProfiles = await _dbContext.BusinessProfiles
            .Where(bp => bp.VerificationStatus == SellerVerificationStatus.Pending)
            .Include(bp => bp.User)
            .OrderByDescending(bp => bp.CreatedAt)
            .ToListAsync(cancellationToken);

        return pendingProfiles.Select(bp => new AdminBusinessProfileDto
        {
            Id = bp.Id,
            UserId = bp.UserId,
            UserEmail = bp.User.Email ?? string.Empty,
            UserFullName = $"{bp.User.FirstName} {bp.User.LastName}".Trim(),
            BusinessName = bp.BusinessName,
            BusinessType = bp.BusinessType,
            BusinessCategory = bp.BusinessCategory,
            Description = bp.Description,
            Website = bp.Website,
            PhoneNumber = bp.PhoneNumber,
            Address = bp.Address,
            City = bp.City,
            State = bp.State,
            Country = bp.Country,
            PostalCode = bp.PostalCode,
            TaxId = bp.TaxId,
            VerificationStatus = bp.VerificationStatus,
            RejectionReason = bp.RejectionReason,
            VerifiedAt = bp.VerifiedAt,
            VerifiedBy = bp.VerifiedBy,
            Created = bp.CreatedAt,
            UserKycStatus = bp.User.KycStatus
        }).ToList();
    }
}