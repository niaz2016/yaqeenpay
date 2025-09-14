using MediatR;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Domain.Entities;
using YaqeenPay.Domain.Enums;
using System.Security.Claims;

namespace YaqeenPay.Application.Features.Orders.Commands.MarkOrderAsShipped;

public class MarkOrderAsShippedCommand : IRequest<MarkOrderAsShippedResponse>
{
    public Guid OrderId { get; set; }
    public string? Courier { get; set; }
    public string? TrackingNumber { get; set; }
    public string? ShippingProof { get; set; }
}

public class MarkOrderAsShippedResponse
{
    public Guid OrderId { get; set; }
    public OrderStatus Status { get; set; }
    public DateTime ShippedDate { get; set; }
}

public class MarkOrderAsShippedCommandHandler : IRequestHandler<MarkOrderAsShippedCommand, MarkOrderAsShippedResponse>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public MarkOrderAsShippedCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<MarkOrderAsShippedResponse> Handle(MarkOrderAsShippedCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId ?? throw new UnauthorizedAccessException("User not authenticated");
        
        var order = await _context.Orders.FindAsync(new object[] { request.OrderId }, cancellationToken) 
            ?? throw new KeyNotFoundException($"Order with ID {request.OrderId} not found");
        
        // Only the seller can mark order as shipped
        if (order.SellerId != userId)
            throw new UnauthorizedAccessException("Only the seller can mark order as shipped");
        
        // Update shipping details if provided
        if (!string.IsNullOrEmpty(request.Courier) && !string.IsNullOrEmpty(request.TrackingNumber))
        {
            order.UpdateShippingDetails(request.Courier, request.TrackingNumber, request.ShippingProof);
        }
        
        // Mark order as shipped
        order.MarkAsShipped();
        
        await _context.SaveChangesAsync(cancellationToken);
        
        return new MarkOrderAsShippedResponse
        {
            OrderId = order.Id,
            Status = order.Status,
            ShippedDate = order.ShippedDate ?? DateTime.UtcNow
        };
    }
}