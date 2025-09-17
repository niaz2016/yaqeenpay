using YaqeenPay.Domain.Enums;
using YaqeenPay.Application.Features.Wallets.Commands.TopUpWallet;

namespace YaqeenPay.Application.Common.Models
{
    public class TopUpDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public Guid WalletId { get; set; }
        public decimal Amount { get; set; }
        public string Currency { get; set; } = string.Empty;
        public TopUpChannel Channel { get; set; }
        public TopUpStatus Status { get; set; }
        public string? ExternalReference { get; set; }
        public DateTime RequestedAt { get; set; }
        public DateTime? ConfirmedAt { get; set; }
        public DateTime? FailedAt { get; set; }
        public string? FailureReason { get; set; }
        // Optional proof metadata for admin UI
        public string? ProofUrl { get; set; }
        public List<TopUpProofDto>? Proofs { get; set; }
    }
}