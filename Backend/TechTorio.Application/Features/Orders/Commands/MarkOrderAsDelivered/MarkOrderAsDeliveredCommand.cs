using MediatR;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Domain.Entities;
using TechTorio.Domain.Enums;
using System.Security.Claims;

namespace TechTorio.Application.Features.Orders.Commands.MarkOrderAsDelivered;

public class MarkOrderAsDeliveredCommand : IRequest<MarkOrderAsDeliveredResponse>
{
    public Guid OrderId { get; set; }
    public string? DeliveryProof { get; set; }
    public string? DeliveryNotes { get; set; }
}

public class MarkOrderAsDeliveredResponse
{
    public Guid OrderId { get; set; }
    public OrderStatus Status { get; set; }
    public DateTime DeliveredDate { get; set; }
    public DateTime DeliveryConfirmationExpiry { get; set; }
    public string DeliveryConfirmationCode { get; set; } = string.Empty;
}

public class MarkOrderAsDeliveredCommandHandler : IRequestHandler<MarkOrderAsDeliveredCommand, MarkOrderAsDeliveredResponse>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public MarkOrderAsDeliveredCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<MarkOrderAsDeliveredResponse> Handle(MarkOrderAsDeliveredCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        
        var order = await _context.Orders.FindAsync(new object[] { request.OrderId }, cancellationToken) 
            ?? throw new KeyNotFoundException($"Order with ID {request.OrderId} not found");
        
        // For MVP, allow sellers or a courier service (admin) to mark as delivered
        if (order.SellerId != userId && !_currentUserService.IsInRole("Admin"))
            throw new UnauthorizedAccessException("Only the seller or admin can mark order as delivered");
        
        // Mark order as delivered
        order.MarkAsDelivered();
        
        // Update delivery notes if provided
        if (!string.IsNullOrEmpty(request.DeliveryNotes))
        {
            order.SetDeliveryAddress(order.DeliveryAddress ?? "Not provided", request.DeliveryNotes);
        }
        
        await _context.SaveChangesAsync(cancellationToken);
        
        return new MarkOrderAsDeliveredResponse
        {
            OrderId = order.Id,
            Status = order.Status,
            DeliveredDate = order.DeliveredDate ?? DateTime.UtcNow,
            DeliveryConfirmationExpiry = order.DeliveryConfirmationExpiry ?? DateTime.UtcNow.AddHours(48),
            DeliveryConfirmationCode = order.DeliveryConfirmationCode ?? string.Empty
        };
    }
}