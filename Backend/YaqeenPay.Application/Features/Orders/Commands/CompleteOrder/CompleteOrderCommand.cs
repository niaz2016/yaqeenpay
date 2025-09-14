using MediatR;
using Microsoft.EntityFrameworkCore;
using YaqeenPay.Application.Common.Exceptions;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Common.Models;
using YaqeenPay.Domain.Entities;
using YaqeenPay.Domain.Enums;

namespace YaqeenPay.Application.Features.Orders.Commands.CompleteOrder;

public record CompleteOrderCommand : IRequest<ApiResponse<bool>>
{
    public Guid OrderId { get; set; }
}

public class CompleteOrderCommandHandler : IRequestHandler<CompleteOrderCommand, ApiResponse<bool>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public CompleteOrderCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse<bool>> Handle(CompleteOrderCommand request, CancellationToken cancellationToken)
    {
        if (_currentUserService.UserId == null)
        {
            throw new ForbiddenAccessException();
        }

        var order = await _context.Orders
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order == null)
        {
            throw new NotFoundException(nameof(Order), request.OrderId);
        }

        // Only seller can mark order as complete
        if (order.SellerId != _currentUserService.UserId)
        {
            throw new ForbiddenAccessException();
        }

        // Can only complete if in confirmed state
        if (order.Status != OrderStatus.Confirmed)
        {
            return ApiResponse<bool>.FailureResponse($"Cannot complete order with status {order.Status}");
        }

        order.Complete();
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<bool>.SuccessResponse(true, "Order completed successfully");
    }
}