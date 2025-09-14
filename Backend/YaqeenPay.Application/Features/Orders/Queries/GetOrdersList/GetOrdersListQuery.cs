using MediatR;
using Microsoft.EntityFrameworkCore;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Common.Models;
using YaqeenPay.Application.Features.Orders.Queries.GetOrderById;
using YaqeenPay.Domain.Entities;

namespace YaqeenPay.Application.Features.Orders.Queries.GetOrdersList;

public record GetOrdersListQuery : IRequest<ApiResponse<List<OrderDto>>>
{
    public bool? AsSellerOnly { get; set; }
    public bool? AsBuyerOnly { get; set; }
}

public class GetOrdersListQueryHandler : IRequestHandler<GetOrdersListQuery, ApiResponse<List<OrderDto>>>
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

    public async Task<ApiResponse<List<OrderDto>>> Handle(GetOrdersListQuery request, CancellationToken cancellationToken)
    {
        if (_currentUserService.UserId == null)
        {
            return ApiResponse<List<OrderDto>>.SuccessResponse(new List<OrderDto>());
        }

        var userId = _currentUserService.UserId;

        IQueryable<Order> query = _context.Orders
            .Include(o => o.Buyer)
            .Include(o => o.Seller)
            .AsQueryable();

        // Filter by role if specified
        if (request.AsBuyerOnly == true)
        {
            query = query.Where(o => o.BuyerId == userId);
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

        // Order by creation date, newest first
        query = query.OrderByDescending(o => o.CreatedAt);

        var orders = await query.ToListAsync(cancellationToken);

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
            SellerId = order.SellerId,
            SellerName = order.Seller?.UserName ?? "Unknown",
            CreatedAt = order.CreatedAt,
            CompletedAt = order.CompletedDate
        }).ToList();

        return ApiResponse<List<OrderDto>>.SuccessResponse(orderDtos);
    }
}