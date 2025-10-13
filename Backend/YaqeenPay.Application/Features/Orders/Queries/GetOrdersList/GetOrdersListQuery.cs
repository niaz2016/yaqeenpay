using MediatR;
using Microsoft.EntityFrameworkCore;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Common.Models;
using YaqeenPay.Application.Features.Orders.Queries.GetOrderById;
using YaqeenPay.Domain.Entities;
using YaqeenPay.Domain.Enums;

namespace YaqeenPay.Application.Features.Orders.Queries.GetOrdersList;

public record GetOrdersListQuery : IRequest<ApiResponse<PaginatedList<OrderDto>>>
{
    public bool? AsSellerOnly { get; set; }
    public bool? AsBuyerOnly { get; set; }
    public int? Page { get; set; }
    public int? PageSize { get; set; }
    public string? Search { get; set; }
    public string? Status { get; set; }
}

public class GetOrdersListQueryHandler : IRequestHandler<GetOrdersListQuery, ApiResponse<PaginatedList<OrderDto>>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetOrdersListQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse<PaginatedList<OrderDto>>> Handle(GetOrdersListQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        
        // Debug logging
        System.Console.WriteLine($"GetOrdersListQuery: Current user ID: {userId}");
        
        if (userId == Guid.Empty)
        {
            System.Console.WriteLine("GetOrdersListQuery: User ID is empty - returning empty list");
            return ApiResponse<PaginatedList<OrderDto>>.SuccessResponse(new PaginatedList<OrderDto>(new List<OrderDto>(), 0, 1, 10));
        }

        IQueryable<Order> query = _context.Orders
            .Include(o => o.Buyer)
            .Include(o => o.Seller)
            .AsQueryable();

        // Filter by role if specified
        if (request.AsBuyerOnly == true)
        {
            query = query.Where(o => o.BuyerId == userId && o.BuyerId != o.SellerId);
        }
        else if (request.AsSellerOnly == true)
        {
            query = query.Where(o => o.SellerId == userId);
        }
        else
        {
            // Default to orders where user is buyer or seller
            query = query.Where(o => o.BuyerId == userId || o.SellerId == userId);
        }

        // Filter by status if provided
        if (!string.IsNullOrEmpty(request.Status) && Enum.TryParse<OrderStatus>(request.Status, true, out var status))
        {
            query = query.Where(o => o.Status == status);
        }

        // Filter by search term if provided
        if (!string.IsNullOrEmpty(request.Search))
        {
            var searchTerm = request.Search.ToLower();
            query = query.Where(o => 
                o.Title.ToLower().Contains(searchTerm) ||
                o.Description.ToLower().Contains(searchTerm) ||
                (o.Buyer != null && o.Buyer.UserName != null && o.Buyer.UserName.ToLower().Contains(searchTerm)) ||
                (o.Seller != null && o.Seller.UserName != null && o.Seller.UserName.ToLower().Contains(searchTerm))
            );
        }

        // Order by creation date, newest first
        query = query.OrderByDescending(o => o.CreatedAt);

        // Apply pagination
        var page = request.Page ?? 1;
        var pageSize = request.PageSize ?? 10;
        
        // Ensure valid pagination values
        page = Math.Max(1, page);
        pageSize = Math.Max(1, Math.Min(100, pageSize)); // Limit max page size to 100

        var totalCount = await query.CountAsync(cancellationToken);
        
        var orders = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        // Debug logging
        System.Console.WriteLine($"GetOrdersListQuery: Found {orders.Count} orders (page {page}/{Math.Ceiling((double)totalCount / pageSize)}) for user {userId}");
        foreach (var order in orders)
        {
            System.Console.WriteLine($"Order: {order.Id}, BuyerId: {order.BuyerId}, SellerId: {order.SellerId}, Status: {order.Status}");
        }

        var orderDtos = orders.Select(order => new OrderDto
        {
            Id = order.Id,
            Title = order.Title,
            Description = order.Description,
            Amount = order.Amount.Value,
            Currency = order.Amount.Currency,
            Status = order.Status.ToString(),
            BuyerId = order.BuyerId,
            BuyerName = order.Buyer?.UserName ?? "Unknown",
            BuyerPhone = order.Buyer?.PhoneNumber,
            SellerId = order.SellerId,
            SellerName = order.Seller?.UserName ?? "Unknown",
            SellerPhone = order.Seller?.PhoneNumber,
            CreatedAt = order.CreatedAt,
            CompletedAt = order.CompletedDate,
            ImageUrls = order.ImageUrls,
            Shipment = new ShipmentDto
            {
                Courier = order.Courier,
                TrackingNumber = order.TrackingNumber,
                ShippedDate = order.ShippedDate,
                DeliveredDate = order.DeliveredDate,
                DeliveryAddress = order.DeliveryAddress,
                DeliveryNotes = order.DeliveryNotes,
                ShippingProof = order.ShippingProof
            }
        }).ToList();

        var paginatedResult = new PaginatedList<OrderDto>(orderDtos, totalCount, page, pageSize);
        return ApiResponse<PaginatedList<OrderDto>>.SuccessResponse(paginatedResult);
    }
}

public class OrderDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public Guid BuyerId { get; set; }
    public string BuyerName { get; set; } = string.Empty;
    public string? BuyerPhone { get; set; }
    public Guid SellerId { get; set; }
    public string SellerName { get; set; } = string.Empty;
    public string? SellerPhone { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public List<string> ImageUrls { get; set; } = new List<string>();
    public ShipmentDto? Shipment { get; set; }
}

public class ShipmentDto
{
    public string? Courier { get; set; }
    public string? TrackingNumber { get; set; }
    public DateTime? ShippedDate { get; set; }
    public DateTime? DeliveredDate { get; set; }
    public string? DeliveryAddress { get; set; }
    public string? DeliveryNotes { get; set; }
    public string? ShippingProof { get; set; }
}