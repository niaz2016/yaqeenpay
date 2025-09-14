using MediatR;
using Microsoft.EntityFrameworkCore;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Domain.Entities;
using YaqeenPay.Domain.Enums;
using System.Security.Claims;

namespace YaqeenPay.Application.Features.Orders.Commands.RejectOrder;

public class RejectOrderCommand : IRequest<RejectOrderResponse>
{
    public Guid OrderId { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? Evidence { get; set; }
}

public class RejectOrderResponse
{
    public Guid OrderId { get; set; }
    public OrderStatus Status { get; set; }
    public DateTime RejectedDate { get; set; }
    public string Reason { get; set; } = string.Empty;
    public bool RefundInitiated { get; set; }
}

public class RejectOrderCommandHandler : IRequestHandler<RejectOrderCommand, RejectOrderResponse>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public RejectOrderCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<RejectOrderResponse> Handle(RejectOrderCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId ?? throw new UnauthorizedAccessException("User not authenticated");
        
        var order = await _context.Orders
            .Include(o => o.Escrow)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken) 
            ?? throw new KeyNotFoundException($"Order with ID {request.OrderId} not found");
        
        // Only the buyer can reject the order
        if (order.BuyerId != userId)
            throw new UnauthorizedAccessException("Only the buyer can reject the order");
        
        // Reject the order
        order.RejectOrder(request.Reason);
        
        // Refund the escrow
        if (order.Escrow.CanRefund())
        {
            order.Escrow.Refund();
        }
        
        await _context.SaveChangesAsync(cancellationToken);
        
        return new RejectOrderResponse
        {
            OrderId = order.Id,
            Status = order.Status,
            RejectedDate = order.RejectedDate ?? DateTime.UtcNow,
            Reason = order.RejectionReason ?? string.Empty,
            RefundInitiated = order.Escrow.Status == EscrowStatus.Refunded
        };
    }
}