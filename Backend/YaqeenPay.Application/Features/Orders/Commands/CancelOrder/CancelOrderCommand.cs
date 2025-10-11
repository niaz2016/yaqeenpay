using MediatR;
using Microsoft.EntityFrameworkCore;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Domain.Entities;
using YaqeenPay.Domain.Enums;
using System.Security.Claims;

namespace YaqeenPay.Application.Features.Orders.Commands.CancelOrder;

public class CancelOrderCommand : IRequest<CancelOrderResponse>
{
    public Guid OrderId { get; set; }
}

public class CancelOrderResponse
{
    public Guid OrderId { get; set; }
    public OrderStatus Status { get; set; }
    public bool EscrowCancelled { get; set; }
}

public class CancelOrderCommandHandler : IRequestHandler<CancelOrderCommand, CancelOrderResponse>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly YaqeenPay.Application.Interfaces.IOrderNotificationService _orderNotificationService;

    public CancelOrderCommandHandler(
        IApplicationDbContext context, 
        ICurrentUserService currentUserService,
        YaqeenPay.Application.Interfaces.IOrderNotificationService orderNotificationService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _orderNotificationService = orderNotificationService;
    }

    public async Task<CancelOrderResponse> Handle(CancelOrderCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        
        var order = await _context.Orders
            .Include(o => o.Escrow)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken) 
            ?? throw new KeyNotFoundException($"Order with ID {request.OrderId} not found");
        
        // Either buyer or seller can cancel in early stages
        if ( order.SellerId != userId && !_currentUserService.IsInRole("Admin"))
            throw new UnauthorizedAccessException("Only the buyer, seller, or admin can cancel the order");
        
        // Cancel the order
        order.CancelOrder();
        
        // Cancel the escrow if possible
        bool escrowCancelled = false;
        if (order.Escrow.CanCancel())
        {
            order.Escrow.Cancel();
            escrowCancelled = true;
        }
        else if (order.Escrow.CanRefund())
        {
            order.Escrow.Refund();
            escrowCancelled = true;
        }
        
        await _context.SaveChangesAsync(cancellationToken);

        // Send cancellation notifications to both buyer and seller
        try
        {
            await _orderNotificationService.NotifyCancelled(order, "Order cancelled by user");
        }
        catch (Exception ex)
        {
            // Log notification error but don't fail the cancellation
            System.Console.WriteLine($"Failed to send cancellation notifications: {ex.Message}");
        }
        
        return new CancelOrderResponse
        {
            OrderId = order.Id,
            Status = order.Status,
            EscrowCancelled = escrowCancelled
        };
    }
}