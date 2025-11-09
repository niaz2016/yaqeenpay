using MediatR;
using Microsoft.EntityFrameworkCore;
using TechTorio.Application.Common.Interfaces;

namespace TechTorio.Application.Features.Analytics.Queries.GetAnalytics;

public record PageTypeStats
{
    public string PageType { get; init; } = string.Empty;
    public int TotalViews { get; init; }
    public int UniqueVisitors { get; init; }
}

public record DeviceStats
{
    public string DeviceType { get; init; } = string.Empty;
    public int TotalViews { get; init; }
    public int UniqueVisitors { get; init; }
}

public record BrowserStats
{
    public string Browser { get; init; } = string.Empty;
    public int TotalViews { get; init; }
    public int UniqueVisitors { get; init; }
}

public record OSStats
{
    public string OperatingSystem { get; init; } = string.Empty;
    public int TotalViews { get; init; }
    public int UniqueVisitors { get; init; }
}

public record AnalyticsResponse
{
    public int TotalPageViews { get; init; }
    public int TotalUniqueVisitors { get; init; }
    public List<PageTypeStats> PageTypeBreakdown { get; init; } = new();
    public List<DeviceStats> DeviceBreakdown { get; init; } = new();
    public List<BrowserStats> BrowserBreakdown { get; init; } = new();
    public List<OSStats> OSBreakdown { get; init; } = new();
    public int TodayViews { get; init; }
    public int TodayUniqueVisitors { get; init; }
    public int WeekViews { get; init; }
    public int WeekUniqueVisitors { get; init; }
    public int MonthViews { get; init; }
    public int MonthUniqueVisitors { get; init; }
}

public record GetAnalyticsQuery : IRequest<AnalyticsResponse>
{
    public DateTime? StartDate { get; init; }
    public DateTime? EndDate { get; init; }
}

public class GetAnalyticsQueryHandler : IRequestHandler<GetAnalyticsQuery, AnalyticsResponse>
{
    private readonly IApplicationDbContext _context;

    public GetAnalyticsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<AnalyticsResponse> Handle(GetAnalyticsQuery request, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var today = now.Date;
        var weekAgo = now.AddDays(-7);
        var monthAgo = now.AddMonths(-1);

        var query = _context.PageViews.AsQueryable();

        if (request.StartDate.HasValue)
            query = query.Where(p => p.ViewedAt >= request.StartDate.Value);

        if (request.EndDate.HasValue)
            query = query.Where(p => p.ViewedAt <= request.EndDate.Value);

        var allViews = await query.ToListAsync(cancellationToken);

        var pageTypeBreakdown = allViews
            .GroupBy(p => p.PageType)
            .Select(g => new PageTypeStats
            {
                PageType = g.Key,
                TotalViews = g.Count(),
                UniqueVisitors = g.Select(v => v.VisitorId).Distinct().Count()
            })
            .ToList();

        var deviceBreakdown = allViews
            .Where(p => !string.IsNullOrEmpty(p.DeviceType))
            .GroupBy(p => p.DeviceType)
            .Select(g => new DeviceStats
            {
                DeviceType = g.Key!,
                TotalViews = g.Count(),
                UniqueVisitors = g.Select(v => v.VisitorId).Distinct().Count()
            })
            .ToList();

        var browserBreakdown = allViews
            .Where(p => !string.IsNullOrEmpty(p.Browser))
            .GroupBy(p => p.Browser)
            .Select(g => new BrowserStats
            {
                Browser = g.Key!,
                TotalViews = g.Count(),
                UniqueVisitors = g.Select(v => v.VisitorId).Distinct().Count()
            })
            .ToList();

        var osBreakdown = allViews
            .Where(p => !string.IsNullOrEmpty(p.OperatingSystem))
            .GroupBy(p => p.OperatingSystem)
            .Select(g => new OSStats
            {
                OperatingSystem = g.Key!,
                TotalViews = g.Count(),
                UniqueVisitors = g.Select(v => v.VisitorId).Distinct().Count()
            })
            .ToList();

        return new AnalyticsResponse
        {
            TotalPageViews = allViews.Count,
            TotalUniqueVisitors = allViews.Select(v => v.VisitorId).Where(id => !string.IsNullOrWhiteSpace(id)).Distinct().Count(),
            PageTypeBreakdown = pageTypeBreakdown,
            DeviceBreakdown = deviceBreakdown,
            BrowserBreakdown = browserBreakdown,
            OSBreakdown = osBreakdown,
            TodayViews = allViews.Count(v => v.ViewedAt >= today),
            TodayUniqueVisitors = allViews.Where(v => v.ViewedAt >= today).Select(v => v.VisitorId).Where(id => !string.IsNullOrWhiteSpace(id)).Distinct().Count(),
            WeekViews = allViews.Count(v => v.ViewedAt >= weekAgo),
            WeekUniqueVisitors = allViews.Where(v => v.ViewedAt >= weekAgo).Select(v => v.VisitorId).Where(id => !string.IsNullOrWhiteSpace(id)).Distinct().Count(),
            MonthViews = allViews.Count(v => v.ViewedAt >= monthAgo),
            MonthUniqueVisitors = allViews.Where(v => v.ViewedAt >= monthAgo).Select(v => v.VisitorId).Where(id => !string.IsNullOrWhiteSpace(id)).Distinct().Count()
        };
    }
}
