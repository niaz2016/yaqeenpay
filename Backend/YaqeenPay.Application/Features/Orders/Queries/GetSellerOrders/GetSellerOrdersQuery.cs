using MediatR;
using Microsoft.EntityFrameworkCore;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Common.Models;
using YaqeenPay.Domain.Enums;

namespace YaqeenPay.Application.Features.Orders.Queries.GetSellerOrders;

public class GetSellerOrdersQuery : IRequest<PaginatedList<SellerOrderDto>>
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? Status { get; set; }
}

public class SellerOrderDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public string BuyerName { get; set; } = string.Empty;
    public string? BuyerPhone { get; set; }
    public OrderStatus Status { get; set; }
    public string? Courier { get; set; }
    public string? TrackingNumber { get; set; }
    public DateTime? ShippedDate { get; set; }
    public DateTime? DeliveredDate { get; set; }
    public bool CanShip { get; set; }
    public bool CanMarkDelivered { get; set; }
    public bool CanUpdateShipping { get; set; }
    public bool CanDispute { get; set; }
    public DateTime Created { get; set; }
    public List<string> ImageUrls { get; set; } = new List<string>();
    public string? DeliveryAddress { get; set; }
    public string? DeliveryNotes { get; set; }
    public string? ShippingProof { get; set; }
}

public class GetSellerOrdersQueryHandler : IRequestHandler<GetSellerOrdersQuery, PaginatedList<SellerOrderDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetSellerOrdersQueryHandler(
        IApplicationDbContext context, 
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<PaginatedList<SellerOrderDto>> Handle(GetSellerOrdersQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        
        System.Console.WriteLine($"GetSellerOrdersQuery: Current user ID: {userId}");
        
        // First, let's see all orders in the system for debugging
        var allOrdersCount = await _context.Orders.CountAsync(cancellationToken);
        var ordersForUser = await _context.Orders.CountAsync(o => o.SellerId == userId, cancellationToken);
        
        System.Console.WriteLine($"GetSellerOrdersQuery: Total orders in system: {allOrdersCount}");
        System.Console.WriteLine($"GetSellerOrdersQuery: Orders where user {userId} is seller: {ordersForUser}");
        
        var query = _context.Orders
            .Include(o => o.Buyer)
            .Where(o => o.SellerId == userId) // Include all orders where user is seller (including seller requests)
            .AsQueryable();
        
        // Filter by status if provided
        if (!string.IsNullOrEmpty(request.Status) && Enum.TryParse<OrderStatus>(request.Status, true, out var status))
        {
            query = query.Where(o => o.Status == status);
        }
        
        var orders = query
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new SellerOrderDto
            {
                Id = o.Id,
                Title = o.Title,
                Description = o.Description,
                Amount = o.Amount.Amount,
                Currency = o.Amount.Currency,
                BuyerName = o.Buyer.UserName ?? string.Empty,
                BuyerPhone = o.Buyer.PhoneNumber,
                Status = o.Status,
                Courier = o.Courier,
                TrackingNumber = o.TrackingNumber,
                ShippedDate = o.ShippedDate,
                DeliveredDate = o.DeliveredDate,
                CanShip = o.Status == OrderStatus.AwaitingShipment,
                CanMarkDelivered = o.Status == OrderStatus.Shipped,
                CanUpdateShipping = o.Status == OrderStatus.AwaitingShipment || o.Status == OrderStatus.Shipped,
                CanDispute = o.Status == OrderStatus.DeliveredPendingDecision || o.Status == OrderStatus.Rejected,
                Created = o.CreatedAt,
                ImageUrls = o.ImageUrls,
                DeliveryAddress = o.DeliveryAddress,
                DeliveryNotes = o.DeliveryNotes,
                ShippingProof = o.ShippingProof
            });

        return await Task.FromResult(PaginatedList<SellerOrderDto>.Create(orders, request.PageNumber, request.PageSize));
    }
}