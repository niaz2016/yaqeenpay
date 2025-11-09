namespace TechTorio.Domain.Enums
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