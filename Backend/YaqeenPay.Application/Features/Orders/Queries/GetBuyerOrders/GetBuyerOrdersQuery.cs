using MediatR;
using Microsoft.EntityFrameworkCore;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Common.Models;
using YaqeenPay.Domain.Enums;

namespace YaqeenPay.Application.Features.Orders.Queries.GetBuyerOrders;

public class GetBuyerOrdersQuery : IRequest<PaginatedList<BuyerOrderDto>>
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? Status { get; set; }
}

public class BuyerOrderDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public string SellerName { get; set; } = string.Empty;
    public OrderStatus Status { get; set; }
    public string? Courier { get; set; }
    public string? TrackingNumber { get; set; }
    public DateTime? ShippedDate { get; set; }
    public DateTime? DeliveredDate { get; set; }
    public DateTime? DeliveryConfirmationExpiry { get; set; }
    public bool CanReject { get; set; }
    public bool CanComplete { get; set; }
    public bool CanDispute { get; set; }
    public DateTime Created { get; set; }
    public List<string> ImageUrls { get; set; } = new List<string>();
}

public class GetBuyerOrdersQueryHandler : IRequestHandler<GetBuyerOrdersQuery, PaginatedList<BuyerOrderDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetBuyerOrdersQueryHandler(
        IApplicationDbContext context, 
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<PaginatedList<BuyerOrderDto>> Handle(GetBuyerOrdersQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        
        var query = _context.Orders
            .Include(o => o.Seller)
            .Where(o => o.BuyerId == userId)
            .AsQueryable();
        
        // Filter by status if provided
        if (!string.IsNullOrEmpty(request.Status) && Enum.TryParse<OrderStatus>(request.Status, true, out var status))
        {
            query = query.Where(o => o.Status == status);
        }
        
    var now = DateTime.UtcNow;
        
        var queryable = query
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new BuyerOrderDto
            {
                Id = o.Id,
                Title = o.Title,
                Description = o.Description,
                Amount = o.Amount.Amount,
                Currency = o.Amount.Currency,
                SellerName = o.Seller.UserName ?? string.Empty,
                Status = o.Status,
                Courier = o.Courier,
                TrackingNumber = o.TrackingNumber,
                ShippedDate = o.ShippedDate,
                DeliveredDate = o.DeliveredDate,
                DeliveryConfirmationExpiry = o.DeliveryConfirmationExpiry,
                CanReject = o.Status == OrderStatus.DeliveredPendingDecision,
                CanComplete = o.Status == OrderStatus.DeliveredPendingDecision,
                CanDispute = o.Status == OrderStatus.DeliveredPendingDecision || o.Status == OrderStatus.Rejected,
                Created = o.CreatedAt
                ,
                ImageUrls = o.ImageUrls
            });

        var totalCount = await queryable.CountAsync(cancellationToken);
        var items = await queryable
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        var orders = new PaginatedList<BuyerOrderDto>(items, totalCount, request.PageNumber, request.PageSize);

        return orders;
    }
}