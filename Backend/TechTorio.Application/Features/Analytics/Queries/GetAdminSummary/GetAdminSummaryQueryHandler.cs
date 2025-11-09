using MediatR;
using Microsoft.EntityFrameworkCore;
using TechTorio.Application.Common.Interfaces;

namespace TechTorio.Application.Features.Analytics.Queries.GetAdminSummary;

public class GetAdminSummaryQueryHandler : IRequestHandler<GetAdminSummaryQuery, AdminSummary>
{
    private readonly IApplicationDbContext _context;

    public GetAdminSummaryQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<AdminSummary> Handle(GetAdminSummaryQuery request, CancellationToken cancellationToken)
    {
        // Count distinct VisitorId across all product page views
        var visitorIds = await _context.PageViews
            .Where(p => p.PageType == "Product" && !string.IsNullOrWhiteSpace(p.VisitorId))
            .Select(p => p.VisitorId)
            .ToListAsync(cancellationToken);

        var totalUnique = visitorIds.Distinct().Count();

        return new AdminSummary
        {
            TotalUniqueVisitors = totalUnique
        };
    }
}
