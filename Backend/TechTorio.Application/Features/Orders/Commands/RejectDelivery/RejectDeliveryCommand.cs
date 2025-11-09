using MediatR;
using Microsoft.EntityFrameworkCore;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Domain.Enums;

namespace TechTorio.Application.Features.Orders.Commands.RejectDelivery;

public class RejectDeliveryCommand : IRequest<RejectDeliveryResponse>
{
    public Guid OrderId { get; set; }
    public string Reason { get; set; } = string.Empty;
}

public class RejectDeliveryResponse
{
    public Guid OrderId { get; set; }
    public OrderStatus Status { get; set; }
    public DateTime RejectedDate { get; set; }
    public string Reason { get; set; } = string.Empty;
    public bool RequiresAdminReview { get; set; }
}

public class RejectDeliveryCommandHandler : IRequestHandler<RejectDeliveryCommand, RejectDeliveryResponse>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public RejectDeliveryCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<RejectDeliveryResponse> Handle(RejectDeliveryCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;

        var order = await _context.Orders
            .Include(o => o.Escrow)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken)
            ?? throw new KeyNotFoundException($"Order with ID {request.OrderId} not found");

        if (order.BuyerId != userId)
            throw new UnauthorizedAccessException("Only the buyer can reject delivery");

        var requiresAdmin = false;

        // If payment already made or shipment started -> escalate to dispute/admin flow
        if (order.PaymentDate.HasValue || order.Status == OrderStatus.AwaitingShipment || order.Status == OrderStatus.Shipped || order.Status == OrderStatus.Delivered || order.Status == OrderStatus.DeliveredPendingDecision)
        {
            requiresAdmin = true;
            // Convert this into a dispute stub OR just flag - minimal implementation: create dispute entry could be future enhancement
            order.MarkAsDisputed();
        }
        else
        {
            // Early rejection path
            order.RejectBeforeShipment(request.Reason);
            // If escrow exists and is still fundable (not funded) no refund, if funded (edge) we attempt refund
            if (order.Escrow.CanRefund())
            {
                order.Escrow.Refund();
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        return new RejectDeliveryResponse
        {
            OrderId = order.Id,
            Status = order.Status,
            RejectedDate = order.RejectedDate ?? DateTime.UtcNow,
            Reason = request.Reason,
            RequiresAdminReview = requiresAdmin
        };
    }
}
