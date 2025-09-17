using YaqeenPay.Domain.Entities;

namespace YaqeenPay.Application.Common.Models
{
    public class WithdrawalDto
    {
        public Guid Id { get; set; }
        public Guid SellerId { get; set; }
        public string? SellerName { get; set; }
        public decimal Amount { get; set; }
        public string Currency { get; set; } = null!;
        public WithdrawalChannel Channel { get; set; }
        public string? ChannelReference { get; set; }
        public string Reference { get; set; } = string.Empty; // User-friendly reference
        public WithdrawalStatus Status { get; set; }
        public DateTime RequestedAt { get; set; }
        public DateTime? SettledAt { get; set; }
        public DateTime? FailedAt { get; set; }
        public string? FailureReason { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}