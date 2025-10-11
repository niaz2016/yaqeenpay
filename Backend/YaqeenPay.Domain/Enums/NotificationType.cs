namespace YaqeenPay.Domain.Enums;

public enum NotificationType
{
    Order = 1,
    Payment = 2,
    Kyc = 3,
    System = 4,
    Security = 5,
    Promotion = 6,
    Wallet = 7,
    Seller = 8
}

public enum NotificationPriority
{
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4
}

public enum NotificationStatus
{
    Unread = 1,
    Read = 2,
    Archived = 3
}