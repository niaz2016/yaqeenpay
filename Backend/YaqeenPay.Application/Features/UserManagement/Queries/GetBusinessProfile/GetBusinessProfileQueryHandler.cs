using MediatR;
using Microsoft.EntityFrameworkCore;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Features.UserManagement.Common;

namespace YaqeenPay.Application.Features.UserManagement.Queries.GetBusinessProfile;

public class GetBusinessProfileQueryHandler : IRequestHandler<GetBusinessProfileQuery, BusinessProfileDto?>
{
    private readonly IApplicationDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;

    public GetBusinessProfileQueryHandler(
        IApplicationDbContext dbContext,
        ICurrentUserService currentUserService)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
    }

    public async Task<BusinessProfileDto?> Handle(GetBusinessProfileQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (userId == null)
        {
            throw new UnauthorizedAccessException("User is not authenticated");
        }

        var profile = await _dbContext.BusinessProfiles
            .FirstOrDefaultAsync(bp => bp.UserId == userId, cancellationToken);

        if (profile == null)
        {
            return null;
        }

        return new BusinessProfileDto
        {
            Id = profile.Id,
            BusinessName = profile.BusinessName,
            BusinessType = profile.BusinessType,
            BusinessCategory = profile.BusinessCategory,
            Description = profile.Description,
            Website = profile.Website,
            PhoneNumber = profile.PhoneNumber,
            Address = profile.Address,
            City = profile.City,
            State = profile.State,
            Country = profile.Country,
            PostalCode = profile.PostalCode,
            TaxId = profile.TaxId,
            VerificationStatus = profile.VerificationStatus,
            VerifiedAt = profile.VerifiedAt,
            RejectionReason = profile.RejectionReason,
            CreatedAt = profile.CreatedAt
        };
    }
}