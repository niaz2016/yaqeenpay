using MediatR;
using Microsoft.EntityFrameworkCore;
using YaqeenPay.Application.Common.Exceptions;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Common.Models;
using YaqeenPay.Domain.Entities;

namespace YaqeenPay.Application.Features.Orders.Queries.GetOrderById;

public record GetOrderByIdQuery : IRequest<ApiResponse<OrderDto>>
{
    public Guid OrderId { get; set; }
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
    public Guid SellerId { get; set; }
    public string SellerName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public List<string> ImageUrls { get; set; } = new List<string>();
}

public class GetOrderByIdQueryHandler : IRequestHandler<GetOrderByIdQuery, ApiResponse<OrderDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetOrderByIdQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse<OrderDto>> Handle(GetOrderByIdQuery request, CancellationToken cancellationToken)
    {
        if (_currentUserService.UserId == Guid.Empty)
        {
            throw new ForbiddenAccessException();
        }

        var order = await _context.Orders
            .Include(o => o.Buyer)
            .Include(o => o.Seller)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order == null)
        {
            throw new NotFoundException(nameof(Order), request.OrderId);
        }

        // Ensure user is either buyer or seller
        if (order.BuyerId != _currentUserService.UserId && order.SellerId != _currentUserService.UserId)
        {
            throw new ForbiddenAccessException();
        }

        var orderDto = new OrderDto
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
            ,
            ImageUrls = order.ImageUrls ?? new List<string>()
        };

        return ApiResponse<OrderDto>.SuccessResponse(orderDto);
    }
}