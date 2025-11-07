using MediatR;

namespace YaqeenPay.Application.Features.Analytics.Queries.GetVisitorStats;

public record VisitorStatDto
{
    public string VisitorId { get; init; } = string.Empty;
    public int TotalVisits { get; init; }
    public DateTime FirstSeen { get; init; }
    public DateTime LastSeen { get; init; }
    public string? SampleIp { get; init; }
    public string? SampleUserAgent { get; init; }
    // Concise browser name parsed from the sample user agent (e.g. "Chrome", "Safari", "Firefox")
    public string? SampleBrowser { get; init; }
}

public record VisitorStatsResult
{
    public List<VisitorStatDto> Items { get; init; } = new();
    public int TotalCount { get; init; }
}

public record GetVisitorStatsQuery : IRequest<VisitorStatsResult>
{
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 100; // sensible default for admin
    public DateTime? StartDate { get; init; }
    public DateTime? EndDate { get; init; }
    // Sorting
    public string? SortBy { get; init; }
    public string? SortDir { get; init; } // "asc" or "desc"
}
