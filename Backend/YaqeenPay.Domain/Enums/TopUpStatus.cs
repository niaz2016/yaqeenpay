namespace YaqeenPay.Domain.Enums
{
    public enum TopUpStatus
    {
        Initiated,
        PendingConfirmation,
        PendingAdminApproval,
        Confirmed,
        Failed,
        Cancelled
    }
}