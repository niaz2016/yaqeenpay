using MediatR;
using Microsoft.EntityFrameworkCore;
using YaqeenPay.Application.Common.Interfaces;

namespace YaqeenPay.Application.Features.Analytics.Queries.GetSellerProductViews;

public record DailyViewCount
{
    public string Date { get; init; } = string.Empty;
    public int Views { get; init; }
    public int UniqueVisitors { get; init; }
}

public record ProductViewStats
{
    public string ProductId { get; init; } = string.Empty;
    public string ProductName { get; init; } = string.Empty;
    public string? ImageUrl { get; init; }
    public int TotalViews { get; init; }
    public int UniqueVisitors { get; init; }
    public int TodayViews { get; init; }
    public int WeekViews { get; init; }
    public int MonthViews { get; init; }
    public List<DailyViewCount> DailyViews { get; init; } = new();
    // Number of distinct users who currently have this product in their cart
    public int InCartCount { get; init; }
    // Number of distinct users who have this product in their wishlist/favorites
    public int FavoritesCount { get; init; }
}

public record GetSellerProductViewsQuery : IRequest<List<ProductViewStats>>
{
    public string SellerId { get; init; } = string.Empty;
}

public class GetSellerProductViewsQueryHandler : IRequestHandler<GetSellerProductViewsQuery, List<ProductViewStats>>
{
    private readonly IApplicationDbContext _context;

    public GetSellerProductViewsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<ProductViewStats>> Handle(GetSellerProductViewsQuery request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(request.SellerId, out var sellerId))
            return new List<ProductViewStats>();

        var now = DateTime.UtcNow;
        var today = now.Date;
        var weekAgo = now.AddDays(-7);
        var monthAgo = now.AddDays(-30);

        var products = await _context.Products
            .Where(p => p.SellerId == sellerId)
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.ViewCount,
                PrimaryImageUrl = p.ProductImages
                    .Where(img => img.IsPrimary && img.IsActive)
                    .OrderBy(img => img.SortOrder)
                    .Select(img => img.ImageUrl)
                    .FirstOrDefault()
                    ?? p.ProductImages
                        .Where(img => img.IsActive)
                        .OrderBy(img => img.SortOrder)
                        .Select(img => img.ImageUrl)
                        .FirstOrDefault()
            })
            .ToListAsync(cancellationToken);

        // Pre-compute in-cart counts for this seller's products.
        // We'll count distinct users who have the product in their cart (i.e. number of active carts containing the product).
        var productIds = products.Select(p => p.Id).ToList();
        var cartCounts = new Dictionary<Guid, int>();
        var wishlistCounts = new Dictionary<Guid, int>();
        if (productIds.Count > 0)
        {
            cartCounts = await _context.CartItems
                .Where(ci => productIds.Contains(ci.ProductId) && ci.IsActive)
                .GroupBy(ci => ci.ProductId)
                .Select(g => new { ProductId = g.Key, Count = g.Select(ci => ci.UserId).Distinct().Count() })
                .ToDictionaryAsync(x => x.ProductId, x => x.Count, cancellationToken);

            wishlistCounts = await _context.WishlistItems
                .Where(wi => productIds.Contains(wi.ProductId) && wi.IsActive)
                .GroupBy(wi => wi.ProductId)
                .Select(g => new { ProductId = g.Key, Count = g.Select(wi => wi.UserId).Distinct().Count() })
                .ToDictionaryAsync(x => x.ProductId, x => x.Count, cancellationToken);
        }

        // Load page views for this seller.
        // We need all-time page views to calculate "TotalViews" and "UniqueVisitors" correctly.
        // We'll still compute month/week/today values by filtering these records in-memory.
        var productViewsAll = await _context.PageViews
            .Where(p => p.PageType == "Product" && p.SellerId == sellerId)
            .ToListAsync(cancellationToken);

        var stats = products.Select(p =>
        {
            // All-time views for this product
            var viewsAll = productViewsAll.Where(v => v.ProductId == p.Id).ToList();

            // Views within the last 30 days (for daily breakdown and month/week/today counts)
            var viewsLast30 = viewsAll.Where(v => v.ViewedAt >= monthAgo).ToList();

            // Group views by date for the last 30 days
            var dailyViews = new List<DailyViewCount>();
            for (int i = 29; i >= 0; i--)
            {
                var date = today.AddDays(-i);
                var nextDate = date.AddDays(1);
                var dayViews = viewsLast30.Where(v => v.ViewedAt >= date && v.ViewedAt < nextDate).ToList();

                dailyViews.Add(new DailyViewCount
                {
                    Date = date.ToString("yyyy-MM-dd"),
                    Views = dayViews.Count,
                    UniqueVisitors = dayViews.Select(v => v.VisitorId).Distinct().Count()
                });
            }

            return new ProductViewStats
            {
                ProductId = p.Id.ToString(),
                ProductName = p.Name,
                ImageUrl = p.PrimaryImageUrl,
                // Use page views table as source of truth for totals (all-time)
                TotalViews = viewsAll.Count,
                UniqueVisitors = viewsAll.Select(v => v.VisitorId).Distinct().Count(),
                TodayViews = viewsAll.Count(v => v.ViewedAt >= today),
                WeekViews = viewsAll.Count(v => v.ViewedAt >= weekAgo),
                MonthViews = viewsLast30.Count,
                DailyViews = dailyViews,
                InCartCount = cartCounts.TryGetValue(p.Id, out var c) ? c : 0,
                FavoritesCount = wishlistCounts.TryGetValue(p.Id, out var w) ? w : 0
            };
        }).ToList();

        return stats;
    }
}
