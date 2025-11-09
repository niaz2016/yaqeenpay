using MediatR;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Domain.Entities;
using TechTorio.Domain.Enums;
using System.Security.Claims;

namespace TechTorio.Application.Features.Orders.Commands.MarkOrderAsShipped;

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
    private readonly TechTorio.Application.Interfaces.IOrderNotificationService _orderNotificationService;

    public MarkOrderAsShippedCommandHandler(
        IApplicationDbContext context, 
        ICurrentUserService currentUserService,
        TechTorio.Application.Interfaces.IOrderNotificationService orderNotificationService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _orderNotificationService = orderNotificationService;
    }

    public async Task<MarkOrderAsShippedResponse> Handle(MarkOrderAsShippedCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        
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

        // Send notifications to both buyer and seller
        try
        {
            await _orderNotificationService.NotifyShipped(order);
        }
        catch (Exception ex)
        {
            // Log notification error but don't fail the order update
            System.Console.WriteLine($"Failed to send shipped notifications: {ex.Message}");
        }
        
        return new MarkOrderAsShippedResponse
        {
            OrderId = order.Id,
            Status = order.Status,
            ShippedDate = order.ShippedDate ?? DateTime.UtcNow
        };
    }
}