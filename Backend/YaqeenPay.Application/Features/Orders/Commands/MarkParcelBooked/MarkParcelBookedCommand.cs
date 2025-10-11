using MediatR;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Common.Models;
using YaqeenPay.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace YaqeenPay.Application.Features.Orders.Commands.MarkParcelBooked;

public class MarkParcelBookedCommand : IRequest<MarkParcelBookedResponse>
{
    public Guid OrderId { get; set; }
    public string? Courier { get; set; }
    public string? TrackingNumber { get; set; }
    public string? BookingDetails { get; set; }
}

public class MarkParcelBookedResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public Guid OrderId { get; set; }
}

public class MarkParcelBookedCommandHandler : IRequestHandler<MarkParcelBookedCommand, MarkParcelBookedResponse>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public MarkParcelBookedCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<MarkParcelBookedResponse> Handle(MarkParcelBookedCommand request, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;
        if (currentUserId == Guid.Empty)
        {
            return new MarkParcelBookedResponse
            {
                Success = false,
                Message = "User not authenticated"
            };
        }

        // Get the order
        var order = await _context.Orders
            .Include(o => o.Buyer)
            .Include(o => o.Seller)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order == null)
        {
            return new MarkParcelBookedResponse
            {
                Success = false,
                Message = "Order not found"
            };
        }

        // Verify the current user is the seller
        if (order.SellerId != currentUserId)
        {
            return new MarkParcelBookedResponse
            {
                Success = false,
                Message = "Only the seller can mark parcel as booked"
            };
        }

        // Check if order is in correct status for parcel booking
        if (order.Status != Domain.Enums.OrderStatus.PaymentConfirmed)
        {
            return new MarkParcelBookedResponse
            {
                Success = false,
                Message = $"Cannot mark parcel as booked for order in status {order.Status}. Payment must be confirmed first."
            };
        }

        try
        {
            // Update shipping details if provided
            if (!string.IsNullOrEmpty(request.Courier) && !string.IsNullOrEmpty(request.TrackingNumber))
            {
                order.UpdateShippingDetails(request.Courier, request.TrackingNumber);
            }

            // Move the order to AwaitingShipment status
            // This should already be done by ConfirmPayment, so just update the booking details

            await _context.SaveChangesAsync(cancellationToken);

            return new MarkParcelBookedResponse
            {
                Success = true,
                Message = "Parcel marked as booked for delivery",
                OrderId = order.Id
            };
        }
        catch (Exception ex)
        {
            return new MarkParcelBookedResponse
            {
                Success = false,
                Message = ex.Message
            };
        }
    }
}