using MediatR;
using Microsoft.EntityFrameworkCore;
using YaqeenPay.Application.Common.Interfaces;

namespace YaqeenPay.Application.Features.Orders.Queries.CheckProductReviewEligibility;

public class CheckProductReviewEligibilityQuery : IRequest<bool>
{
    public Guid ProductId { get; set; }
    public Guid? UserId { get; set; }
}

public class CheckProductReviewEligibilityQueryHandler : IRequestHandler<CheckProductReviewEligibilityQuery, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public CheckProductReviewEligibilityQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(CheckProductReviewEligibilityQuery request, CancellationToken cancellationToken)
    {
        var userId = request.UserId ?? _currentUserService.UserId;
        if (userId == Guid.Empty) return false;

        var validStatuses = new[] { YaqeenPay.Domain.Enums.OrderStatus.Delivered, YaqeenPay.Domain.Enums.OrderStatus.Completed };

        var has = await _context.Orders
            .Where(o => o.BuyerId == userId && validStatuses.Contains(o.Status))
            .Join(_context.OrderItems, o => o.Id, oi => oi.OrderId, (o, oi) => new { o, oi })
            .AnyAsync(x => x.oi.ProductId == request.ProductId, cancellationToken);

        return has;
    }
}
