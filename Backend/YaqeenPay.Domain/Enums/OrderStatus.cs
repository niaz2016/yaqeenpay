namespace YaqeenPay.Domain.Enums;

public enum OrderStatus
{
    Created,
    Confirmed,
    Shipped,
    Delivered,
    DeliveredPendingDecision,
    Completed,
    Cancelled,
    Rejected,
    Disputed,
    DisputeResolved
}