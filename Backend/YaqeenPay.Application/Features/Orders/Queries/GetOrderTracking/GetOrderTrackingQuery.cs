using MediatR;
using Microsoft.EntityFrameworkCore;
using YaqeenPay.Application.Common.Exceptions;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Common.Models;
using YaqeenPay.Domain.Entities;
using YaqeenPay.Domain.Enums;

namespace YaqeenPay.Application.Features.Orders.Queries.GetOrderTracking;

public record GetOrderTrackingQuery : IRequest<ApiResponse<OrderTrackingDto>>
{
    public Guid OrderId { get; set; }
}

public class OrderTrackingDto
{
    public List<TrackingTimelineItem> Timeline { get; set; } = new();
}

public class TrackingTimelineItem
{
    public string Status { get; set; } = string.Empty;
    public string At { get; set; } = string.Empty;
    public string? Note { get; set; }
}

public class GetOrderTrackingQueryHandler : IRequestHandler<GetOrderTrackingQuery, ApiResponse<OrderTrackingDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetOrderTrackingQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse<OrderTrackingDto>> Handle(GetOrderTrackingQuery request, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;

        var order = await _context.Orders
            .Include(o => o.Buyer)
            .Include(o => o.Seller)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order == null)
        {
            throw new NotFoundException($"Order with ID {request.OrderId} not found.");
        }

        // Verify that the current user is either the buyer or seller
        if (order.BuyerId != currentUserId && order.SellerId != currentUserId)
        {
            throw new UnauthorizedAccessException("You are not authorized to view this order's tracking information.");
        }

        // Build timeline based on order status and dates
        var timeline = new List<TrackingTimelineItem>();

        // Order Created
        timeline.Add(new TrackingTimelineItem
        {
            Status = "Created",
            At = order.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
            Note = "Order was created"
        });

        // Payment stages
        if (order.Status >= OrderStatus.PaymentPending)
        {
            timeline.Add(new TrackingTimelineItem
            {
                Status = "PaymentPending",
                At = order.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                Note = "Waiting for buyer payment"
            });
        }

        if (order.PaymentDate.HasValue)
        {
            timeline.Add(new TrackingTimelineItem
            {
                Status = "PaymentConfirmed",
                At = order.PaymentDate.Value.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                Note = "Payment confirmed and amount frozen"
            });

            timeline.Add(new TrackingTimelineItem
            {
                Status = "AwaitingShipment",
                At = order.PaymentDate.Value.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                Note = "Order ready for shipment"
            });
        }

        // Shipping stages
        if (order.ShippedDate.HasValue)
        {
            timeline.Add(new TrackingTimelineItem
            {
                Status = "Shipped",
                At = order.ShippedDate.Value.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                Note = "Order has been shipped"
            });
        }

        if (order.DeliveredDate.HasValue)
        {
            timeline.Add(new TrackingTimelineItem
            {
                Status = "Delivered",
                At = order.DeliveredDate.Value.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                Note = "Order has been delivered"
            });
        }

        // Completion
        if (order.CompletedDate.HasValue)
        {
            timeline.Add(new TrackingTimelineItem
            {
                Status = "Completed",
                At = order.CompletedDate.Value.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                Note = "Order completed and payment released to seller"
            });
        }

        // Handle other statuses
        if (order.Status == OrderStatus.Cancelled)
        {
            timeline.Add(new TrackingTimelineItem
            {
                Status = "Cancelled",
                At = order.LastModifiedAt?.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") ?? order.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                Note = "Order was cancelled"
            });
        }

        if (order.Status == OrderStatus.Rejected)
        {
            timeline.Add(new TrackingTimelineItem
            {
                Status = "Rejected",
                At = order.RejectedDate?.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") ?? order.LastModifiedAt?.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") ?? order.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                Note = string.IsNullOrEmpty(order.RejectionReason) ? "Order was rejected" : $"Order was rejected: {order.RejectionReason}"
            });
        }

        var result = new OrderTrackingDto
        {
            Timeline = timeline
        };

        return new ApiResponse<OrderTrackingDto>
        {
            Success = true,
            Data = result
        };
    }
}