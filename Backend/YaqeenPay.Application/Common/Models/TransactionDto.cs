using YaqeenPay.Domain.Enums;

namespace YaqeenPay.Application.Common.Models
{
    public class TransactionDto
    {
        public Guid Id { get; set; }
        public Guid WalletId { get; set; }
        public TransactionType Type { get; set; }
        public decimal Amount { get; set; }
        public string Currency { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
        public Guid? ReferenceId { get; set; }
        public string? ReferenceType { get; set; }
        public string? ExternalReference { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}