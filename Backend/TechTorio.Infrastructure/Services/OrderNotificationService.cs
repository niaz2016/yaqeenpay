using MediatR;
using Microsoft.EntityFrameworkCore;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Application.Features.Notifications.Commands.CreateNotificationFromOutbox;
using TechTorio.Application.Interfaces;
using TechTorio.Domain.Entities;
using TechTorio.Domain.Enums;
using System.Text.Json;

namespace TechTorio.Infrastructure.Services;

public class OrderNotificationService : IOrderNotificationService
{
    private readonly IMediator _mediator;
    private readonly IApplicationDbContext _context;

    public OrderNotificationService(IMediator mediator, IApplicationDbContext context)
    {
        _mediator = mediator;
        _context = context;
    }

    public async Task NotifyOrderCreated(Order order)
    {
        await LoadOrderDetails(order);
        
        // Notify buyer
        await CreateNotification(
            order.BuyerId,
            "Order Created Successfully",
            $"Your order '{order.Title}' for {order.Amount.Amount} {order.Amount.Currency} has been created and is awaiting seller confirmation.",
            NotificationType.Order,
            NotificationPriority.High,
            order
        );

        // Notify seller
        await CreateNotification(
            order.SellerId,
            "New Order Received",
            $"You have received a new order '{order.Title}' for {order.Amount.Amount} {order.Amount.Currency} from {order.Buyer?.UserName ?? "a customer"}.",
            NotificationType.Order,
            NotificationPriority.High,
            order
        );
    }

    public async Task NotifyPaymentPending(Order order)
    {
        await LoadOrderDetails(order);
        
        // Notify buyer
        await CreateNotification(
            order.BuyerId,
            "Payment Pending",
            $"Payment for order '{order.Title}' is being processed. Please complete the payment to proceed.",
            NotificationType.Payment,
            NotificationPriority.High,
            order
        );

        // Notify seller
        await CreateNotification(
            order.SellerId,
            "Customer Payment Pending",
            $"Payment is being processed for order '{order.Title}' from {order.Buyer?.UserName ?? "customer"}.",
            NotificationType.Payment,
            NotificationPriority.Medium,
            order
        );
    }

    public async Task NotifyPaymentConfirmed(Order order)
    {
        await LoadOrderDetails(order);
        
        // Notify buyer
        await CreateNotification(
            order.BuyerId,
            "Payment Confirmed",
            $"Payment confirmed for order '{order.Title}'. Your funds are securely held in escrow until delivery.",
            NotificationType.Payment,
            NotificationPriority.High,
            order
        );

        // Notify seller
        await CreateNotification(
            order.SellerId,
            "Payment Received",
            $"Payment confirmed for order '{order.Title}'. Please prepare the item for shipment.",
            NotificationType.Payment,
            NotificationPriority.High,
            order
        );
    }

    public async Task NotifyAwaitingShipment(Order order)
    {
        await LoadOrderDetails(order);
        
        // Notify buyer
        await CreateNotification(
            order.BuyerId,
            "Order Awaiting Shipment",
            $"Your order '{order.Title}' is confirmed and awaiting shipment from the seller.",
            NotificationType.Order,
            NotificationPriority.Medium,
            order
        );

        // Notify seller
        await CreateNotification(
            order.SellerId,
            "Ready to Ship",
            $"Order '{order.Title}' is ready to ship. Please update shipping details and send the item.",
            NotificationType.Order,
            NotificationPriority.High,
            order
        );
    }

    public async Task NotifyShipped(Order order)
    {
        await LoadOrderDetails(order);
        
        var trackingInfo = !string.IsNullOrEmpty(order.TrackingNumber) 
            ? $" Tracking number: {order.TrackingNumber}"
            : "";

        // Notify buyer
        await CreateNotification(
            order.BuyerId,
            "Order Shipped",
            $"Your order '{order.Title}' has been shipped by {order.Seller?.UserName ?? "the seller"}.{trackingInfo}",
            NotificationType.Order,
            NotificationPriority.High,
            order
        );

        // Notify seller
        await CreateNotification(
            order.SellerId,
            "Order Shipped Successfully",
            $"You have successfully shipped order '{order.Title}' to {order.Buyer?.UserName ?? "the customer"}.{trackingInfo}",
            NotificationType.Order,
            NotificationPriority.Medium,
            order
        );
    }

    public async Task NotifyDelivered(Order order)
    {
        await LoadOrderDetails(order);
        
        // Notify buyer
        await CreateNotification(
            order.BuyerId,
            "Order Delivered",
            $"Your order '{order.Title}' has been delivered. Please confirm receipt to release payment to the seller.",
            NotificationType.Order,
            NotificationPriority.Critical,
            order
        );

        // Notify seller
        await CreateNotification(
            order.SellerId,
            "Order Delivered to Customer",
            $"Order '{order.Title}' has been delivered to {order.Buyer?.UserName ?? "the customer"}. Payment will be released upon confirmation.",
            NotificationType.Order,
            NotificationPriority.High,
            order
        );
    }

    public async Task NotifyCompleted(Order order)
    {
        await LoadOrderDetails(order);
        
        // Notify buyer
        await CreateNotification(
            order.BuyerId,
            "Order Completed",
            $"Your order '{order.Title}' has been completed successfully. Thank you for your purchase!",
            NotificationType.Order,
            NotificationPriority.Medium,
            order
        );

        // Notify seller
        await CreateNotification(
            order.SellerId,
            "Order Completed - Payment Released",
            $"Order '{order.Title}' completed successfully. Payment of {order.Amount.Amount} {order.Amount.Currency} has been released to your account.",
            NotificationType.Payment,
            NotificationPriority.High,
            order
        );
    }

    public async Task NotifyCancelled(Order order, string reason)
    {
        await LoadOrderDetails(order);
        
        // Notify buyer
        await CreateNotification(
            order.BuyerId,
            "Order Cancelled",
            $"Your order '{order.Title}' has been cancelled. Reason: {reason}. Any payments will be refunded.",
            NotificationType.Order,
            NotificationPriority.High,
            order
        );

        // Notify seller
        await CreateNotification(
            order.SellerId,
            "Order Cancelled",
            $"Order '{order.Title}' has been cancelled. Reason: {reason}.",
            NotificationType.Order,
            NotificationPriority.Medium,
            order
        );
    }

    public async Task NotifyRejected(Order order, string reason)
    {
        await LoadOrderDetails(order);
        
        // Notify buyer
        await CreateNotification(
            order.BuyerId,
            "Order Rejected",
            $"Your order '{order.Title}' has been rejected by the seller. Reason: {reason}. Your payment will be refunded.",
            NotificationType.Order,
            NotificationPriority.High,
            order
        );

        // Notify seller
        await CreateNotification(
            order.SellerId,
            "Order Rejected",
            $"You have rejected order '{order.Title}' from {order.Buyer?.UserName ?? "customer"}. Reason: {reason}.",
            NotificationType.Order,
            NotificationPriority.Medium,
            order
        );
    }

    public async Task NotifyDisputed(Order order)
    {
        await LoadOrderDetails(order);
        
        // Notify buyer
        await CreateNotification(
            order.BuyerId,
            "Dispute Opened",
            $"A dispute has been opened for order '{order.Title}'. Our support team will review and contact you soon.",
            NotificationType.Order,
            NotificationPriority.Critical,
            order
        );

        // Notify seller
        await CreateNotification(
            order.SellerId,
            "Order Disputed",
            $"A dispute has been opened for order '{order.Title}' by {order.Buyer?.UserName ?? "the customer"}. Please provide any relevant information.",
            NotificationType.Order,
            NotificationPriority.Critical,
            order
        );
    }

    public async Task NotifyDisputeResolved(Order order)
    {
        await LoadOrderDetails(order);
        
        // Notify buyer
        await CreateNotification(
            order.BuyerId,
            "Dispute Resolved",
            $"The dispute for order '{order.Title}' has been resolved by our support team.",
            NotificationType.Order,
            NotificationPriority.High,
            order
        );

        // Notify seller
        await CreateNotification(
            order.SellerId,
            "Dispute Resolved",
            $"The dispute for order '{order.Title}' has been resolved by our support team.",
            NotificationType.Order,
            NotificationPriority.High,
            order
        );
    }

    public async Task NotifyStatusChanged(Order order, OrderStatus previousStatus, OrderStatus newStatus)
    {
        // Call specific notification method based on new status
        switch (newStatus)
        {
            case OrderStatus.Created:
                await NotifyOrderCreated(order);
                break;
            case OrderStatus.PaymentPending:
                await NotifyPaymentPending(order);
                break;
            case OrderStatus.PaymentConfirmed:
                await NotifyPaymentConfirmed(order);
                break;
            case OrderStatus.AwaitingShipment:
                await NotifyAwaitingShipment(order);
                break;
            case OrderStatus.Shipped:
                await NotifyShipped(order);
                break;
            case OrderStatus.Delivered:
                await NotifyDelivered(order);
                break;
            case OrderStatus.Completed:
                await NotifyCompleted(order);
                break;
            case OrderStatus.Cancelled:
                await NotifyCancelled(order, "Status changed to cancelled");
                break;
            case OrderStatus.Rejected:
                await NotifyRejected(order, "Status changed to rejected");
                break;
            case OrderStatus.Disputed:
                await NotifyDisputed(order);
                break;
            case OrderStatus.DisputeResolved:
                await NotifyDisputeResolved(order);
                break;
        }
    }

    private async Task LoadOrderDetails(Order order)
    {
        // Ensure buyer and seller information is loaded
        if (order.Buyer == null || order.Seller == null)
        {
            var orderWithDetails = await _context.Orders
                .Include(o => o.Buyer)
                .Include(o => o.Seller)
                .FirstOrDefaultAsync(o => o.Id == order.Id);

            if (orderWithDetails != null)
            {
                order.Buyer = orderWithDetails.Buyer;
                order.Seller = orderWithDetails.Seller;
            }
        }
    }

    private async Task CreateNotification(Guid userId, string title, string message, NotificationType type, NotificationPriority priority, Order order)
    {
        var metadata = JsonSerializer.Serialize(new
        {
            OrderId = order.Id,
            OrderTitle = order.Title,
            Amount = order.Amount.Amount,
            Currency = order.Amount.Currency,
            Status = order.Status.ToString(),
            CreatedAt = order.CreatedAt
        });

        var command = new CreateNotificationFromOutboxCommand
        {
            UserId = userId,
            Title = title,
            Message = message,
            NotificationType = type,
            Priority = priority,
            Metadata = metadata
        };

        await _mediator.Send(command);
    }
}