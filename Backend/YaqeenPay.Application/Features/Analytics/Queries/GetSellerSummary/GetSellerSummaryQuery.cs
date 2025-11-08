using MediatR;

namespace YaqeenPay.Application.Features.Analytics.Queries.GetSellerSummary;

public record GetSellerSummaryQuery : IRequest<SellerSummary>
{
    public string SellerId { get; init; } = string.Empty;
}

public record SellerSummary
{
    public int TotalUniqueVisitors { get; init; }
}
