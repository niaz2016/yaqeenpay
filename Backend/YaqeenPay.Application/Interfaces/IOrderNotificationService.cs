using YaqeenPay.Domain.Entities;
using YaqeenPay.Domain.Enums;

namespace YaqeenPay.Application.Interfaces;

public interface IOrderNotificationService
{
    Task NotifyOrderCreated(Order order);
    Task NotifyPaymentPending(Order order);
    Task NotifyPaymentConfirmed(Order order);
    Task NotifyAwaitingShipment(Order order);
    Task NotifyShipped(Order order);
    Task NotifyDelivered(Order order);
    Task NotifyCompleted(Order order);
    Task NotifyCancelled(Order order, string reason);
    Task NotifyRejected(Order order, string reason);
    Task NotifyDisputed(Order order);
    Task NotifyDisputeResolved(Order order);
    Task NotifyStatusChanged(Order order, OrderStatus previousStatus, OrderStatus newStatus);
}