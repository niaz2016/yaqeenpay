namespace YaqeenPay.Domain.Enums;

public enum OrderStatus
{
    Created,
    PaymentPending,
    PaymentConfirmed,
    AwaitingShipment,
    Shipped,
    Delivered,
    DeliveredPendingDecision,
    Completed,
    Cancelled,
    Rejected,
    Disputed,
    DisputeResolved,
    Confirmed
}