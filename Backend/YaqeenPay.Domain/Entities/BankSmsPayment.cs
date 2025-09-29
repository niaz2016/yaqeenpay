using YaqeenPay.Domain.Common;

namespace YaqeenPay.Domain.Entities
{
    public class BankSmsPayment : AuditableEntity
    {
        // Raw SMS text payload
    public string RawText { get; set; } = string.Empty;

        // Parsed fields
        public string? TransactionId { get; set; }
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "PKR";
        public DateTime? PaidAt { get; set; }
        public string? SenderName { get; set; }
        public string? SenderPhone { get; set; }

        // Processing state
        public bool Processed { get; set; }
        public string? ProcessingResult { get; set; }

        // Relations to help reconciliation/debugging
        public Guid? UserId { get; set; }
        public Guid? WalletId { get; set; }
        public Guid? WalletTopupLockId { get; set; }
    }
}
