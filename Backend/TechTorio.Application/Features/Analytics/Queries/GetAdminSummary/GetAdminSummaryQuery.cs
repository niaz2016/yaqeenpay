using MediatR;

namespace TechTorio.Application.Features.Analytics.Queries.GetAdminSummary;

public record GetAdminSummaryQuery : IRequest<AdminSummary>
{
    // Optional date range could be added later
}

public record AdminSummary
{
    public int TotalUniqueVisitors { get; init; }
}
