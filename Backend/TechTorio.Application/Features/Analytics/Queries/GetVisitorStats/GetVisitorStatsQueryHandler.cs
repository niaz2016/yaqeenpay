using MediatR;
using Microsoft.EntityFrameworkCore;
using TechTorio.Application.Common.Interfaces;

namespace TechTorio.Application.Features.Analytics.Queries.GetVisitorStats;

public class GetVisitorStatsQueryHandler : IRequestHandler<GetVisitorStatsQuery, VisitorStatsResult>
{
    private readonly IApplicationDbContext _context;

    public GetVisitorStatsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<VisitorStatsResult> Handle(GetVisitorStatsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.PageViews.AsQueryable();

        if (request.StartDate.HasValue)
            query = query.Where(p => p.ViewedAt >= request.StartDate.Value);

        if (request.EndDate.HasValue)
            query = query.Where(p => p.ViewedAt <= request.EndDate.Value);

        // Group by visitor id and aggregate
        var groupedQuery = query
            .GroupBy(p => p.VisitorId)
            .Select(g => new
            {
                VisitorId = g.Key,
                TotalVisits = g.Count(),
                FirstSeen = g.Min(x => x.ViewedAt),
                LastSeen = g.Max(x => x.ViewedAt),
                SampleIp = g.Select(x => x.IpAddress).FirstOrDefault(),
                SampleUserAgent = g.Select(x => x.UserAgent).FirstOrDefault()
            });

        // Apply sorting based on request
        var sortBy = request.SortBy?.ToLowerInvariant() ?? "lastseen";
        var sortDir = (request.SortDir ?? "desc").ToLowerInvariant();

        if (sortBy == "totalvisits")
        {
            groupedQuery = sortDir == "asc" ? groupedQuery.OrderBy(g => g.TotalVisits) : groupedQuery.OrderByDescending(g => g.TotalVisits);
        }
        else if (sortBy == "firstseen")
        {
            groupedQuery = sortDir == "asc" ? groupedQuery.OrderBy(g => g.FirstSeen) : groupedQuery.OrderByDescending(g => g.FirstSeen);
        }
        else // default lastSeen
        {
            groupedQuery = sortDir == "asc" ? groupedQuery.OrderBy(g => g.LastSeen) : groupedQuery.OrderByDescending(g => g.LastSeen);
        }
        // compute total groups for pagination metadata
        var totalCount = await query.GroupBy(p => p.VisitorId).CountAsync(cancellationToken);

        // Apply pagination
        var page = request.Page <= 0 ? 1 : request.Page;
        var pageSize = request.PageSize <= 0 ? 100 : request.PageSize;

        var items = await groupedQuery
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var resultItems = items.Select(i => new VisitorStatDto
        {
            VisitorId = i.VisitorId,
            TotalVisits = i.TotalVisits,
            FirstSeen = i.FirstSeen,
            LastSeen = i.LastSeen,
            SampleIp = i.SampleIp,
            SampleUserAgent = i.SampleUserAgent,
            SampleBrowser = GetBrowserFromUserAgent(i.SampleUserAgent)
        }).ToList();

        return new VisitorStatsResult
        {
            Items = resultItems,
            TotalCount = totalCount
        };
    }

    private static string? GetBrowserFromUserAgent(string? userAgent)
    {
        if (string.IsNullOrWhiteSpace(userAgent)) return null;

        var ua = userAgent.ToLowerInvariant();

        // Edge (Chromium-based)
        if (ua.Contains("edg/") || ua.Contains("edge/")) return "Edge";

        // Opera
        if (ua.Contains("opr/") || ua.Contains("opera")) return "Opera";

        // Samsung Browser
        if (ua.Contains("samsungbrowser") || ua.Contains("samsung")) return "Samsung Browser";

        // Firefox
        if (ua.Contains("firefox/") || ua.Contains("fxios/")) return "Firefox";

        // Chrome on Android/iOS (exclude Edge/Opera which also include "chrome/")
        if (ua.Contains("chrome/") && !ua.Contains("edg/") && !ua.Contains("opr/") && !ua.Contains("samsungbrowser")) return "Chrome";

        // Safari (iOS) - Ensure not Chrome/Chromium
        if ((ua.Contains("safari/") && !ua.Contains("chrome/")) || ua.Contains("crios/")) return "Safari";

        // UC Browser
        if (ua.Contains("ucbrowser") || ua.Contains("ucweb")) return "UC Browser";

        return "Other";
    }
}
