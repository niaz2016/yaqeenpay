using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Common.Helpers;
using YaqeenPay.Domain.Entities;

namespace YaqeenPay.Application.Features.Analytics.Commands.TrackPageView;

public record TrackPageViewCommand : IRequest<bool>
{
    public string PageUrl { get; init; } = string.Empty;
    public string PageType { get; init; } = string.Empty;
    public string? ProductId { get; init; }
    public string? SellerId { get; init; }
    public string VisitorId { get; init; } = string.Empty;
    public string? IpAddress { get; init; }
    public string? UserAgent { get; init; }
    public string? Referrer { get; init; }
}

public class TrackPageViewCommandHandler : IRequestHandler<TrackPageViewCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly IAnalyticsSettings _analyticsSettings;

    public TrackPageViewCommandHandler(IApplicationDbContext context, IAnalyticsSettings analyticsSettings)
    {
        _context = context;
        _analyticsSettings = analyticsSettings;
    }

    public async Task<bool> Handle(TrackPageViewCommand request, CancellationToken cancellationToken)
    {
        // Check if this visitor is excluded from tracking
        if (_analyticsSettings.ExcludedVisitorIds.Contains(request.VisitorId))
        {
            return false; // Don't track excluded visitors
        }

        // Check if this visitor has viewed this page in the last minute (60 seconds)
        var oneMinuteAgo = DateTime.UtcNow.AddMinutes(-1);
        
        Guid? productId = null;
        if (!string.IsNullOrEmpty(request.ProductId) && Guid.TryParse(request.ProductId, out var parsedProductId))
        {
            productId = parsedProductId;
        }

        Guid? sellerId = null;
        if (!string.IsNullOrEmpty(request.SellerId) && Guid.TryParse(request.SellerId, out var parsedSellerId))
        {
            sellerId = parsedSellerId;
        }

        // Check for duplicate view within cooldown period
        var recentView = await _context.PageViews
            .Where(pv => pv.VisitorId == request.VisitorId 
                      && pv.PageType == request.PageType
                      && pv.ProductId == productId
                      && pv.SellerId == sellerId
                      && pv.ViewedAt >= oneMinuteAgo)
            .OrderByDescending(pv => pv.ViewedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (recentView != null)
        {
            // Duplicate view within cooldown period - don't track
            return false;
        }

        // Parse User-Agent to extract device information
        var (deviceType, browser, os) = UserAgentParser.Parse(request.UserAgent);

        var pageView = new PageView
        {
            Id = Guid.NewGuid(),
            PageUrl = request.PageUrl,
            PageType = request.PageType,
            ProductId = productId,
            SellerId = sellerId,
            VisitorId = request.VisitorId,
            IpAddress = request.IpAddress,
            UserAgent = request.UserAgent,
            Referrer = request.Referrer,
            DeviceType = deviceType,
            Browser = browser,
            OperatingSystem = os,
            ViewedAt = DateTime.UtcNow
        };

        _context.PageViews.Add(pageView);

        // If it's a product page, increment the product view count
        if (productId.HasValue)
        {
            var product = await _context.Products.FindAsync(new object[] { productId.Value }, cancellationToken);
            if (product != null)
            {
                product.IncrementViewCount();
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
