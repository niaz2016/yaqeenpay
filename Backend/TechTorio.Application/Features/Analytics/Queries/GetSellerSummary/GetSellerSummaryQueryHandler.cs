using MediatR;
using Microsoft.EntityFrameworkCore;
using TechTorio.Application.Common.Interfaces;

namespace TechTorio.Application.Features.Analytics.Queries.GetSellerSummary;

public class GetSellerSummaryQueryHandler : IRequestHandler<GetSellerSummaryQuery, SellerSummary>
{
    private readonly IApplicationDbContext _context;

    public GetSellerSummaryQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SellerSummary> Handle(GetSellerSummaryQuery request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(request.SellerId, out var sellerGuid))
            return new SellerSummary { TotalUniqueVisitors = 0 };

        var productViewsAll = await _context.PageViews
            .Where(p => p.PageType == "Product" && p.SellerId == sellerGuid && !string.IsNullOrWhiteSpace(p.VisitorId))
            .Select(p => p.VisitorId)
            .ToListAsync(cancellationToken);

        var totalUnique = productViewsAll.Distinct().Count();

        return new SellerSummary
        {
            TotalUniqueVisitors = totalUnique
        };
    }
}
