using MediatR;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Domain.Entities;
using YaqeenPay.Domain.Enums;
using System.Security.Claims;

namespace YaqeenPay.Application.Features.Orders.Commands.UpdateShippingDetails;

public class UpdateShippingDetailsCommand : IRequest<UpdateShippingDetailsResponse>
{
    public Guid OrderId { get; set; }
    public string Courier { get; set; } = string.Empty;
    public string TrackingNumber { get; set; } = string.Empty;
    public string? ShippingProof { get; set; }
}

public class UpdateShippingDetailsResponse
{
    public Guid OrderId { get; set; }
    public string Courier { get; set; } = string.Empty;
    public string TrackingNumber { get; set; } = string.Empty;
    public string? ShippingProof { get; set; }
    public OrderStatus Status { get; set; }
}

public class UpdateShippingDetailsCommandHandler : IRequestHandler<UpdateShippingDetailsCommand, UpdateShippingDetailsResponse>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public UpdateShippingDetailsCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<UpdateShippingDetailsResponse> Handle(UpdateShippingDetailsCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        
        var order = await _context.Orders.FindAsync(new object[] { request.OrderId }, cancellationToken) 
            ?? throw new KeyNotFoundException($"Order with ID {request.OrderId} not found");
        
        // Only the seller can update shipping details
        if (order.SellerId != userId)
            throw new UnauthorizedAccessException("Only the seller can update shipping details");
        
        // Update shipping details
        order.UpdateShippingDetails(request.Courier, request.TrackingNumber, request.ShippingProof);
        
        await _context.SaveChangesAsync(cancellationToken);
        
        return new UpdateShippingDetailsResponse
        {
            OrderId = order.Id,
            Courier = order.Courier ?? string.Empty,
            TrackingNumber = order.TrackingNumber ?? string.Empty,
            ShippingProof = order.ShippingProof,
            Status = order.Status
        };
    }
}