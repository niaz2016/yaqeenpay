using TechTorio.Domain.Common;
using TechTorio.Domain.Enums;
using TechTorio.Domain.ValueObjects;

namespace TechTorio.Domain.Entities
{
    public class TopUp : AuditableEntity
    {
        public Guid UserId { get; private set; }
        public Guid WalletId { get; private set; }
        public Money Amount { get; private set; } = null!;
        public TopUpChannel Channel { get; private set; }
        public TopUpStatus Status { get; private set; }
        public string? ExternalReference { get; private set; }
        public string? FailureReason { get; private set; }
        public DateTime RequestedAt { get; private set; }
        public DateTime? ConfirmedAt { get; private set; }
        public DateTime? FailedAt { get; private set; }
        public Guid? TransactionId { get; private set; }
        
        // Navigation properties
        public virtual Domain.Entities.Identity.ApplicationUser User { get; private set; } = null!;
        public virtual Wallet Wallet { get; private set; } = null!;
        public virtual WalletTransaction? Transaction { get; private set; }

        private TopUp() { } // For EF Core

        public TopUp(Guid userId, Guid walletId, Money amount, TopUpChannel channel)
        {
            if (amount.Amount <= 0)
                throw new ArgumentException("Top-up amount must be positive", nameof(amount));

            UserId = userId;
            WalletId = walletId;
            Amount = amount;
            Channel = channel;
            Status = TopUpStatus.Initiated;
            RequestedAt = DateTime.UtcNow;
        }

        public void SetPendingConfirmation(string? externalReference = null)
        {
            if (Status != TopUpStatus.Initiated)
                throw new InvalidOperationException($"Cannot set top-up to pending in status {Status}");

            Status = TopUpStatus.PendingConfirmation;
            ExternalReference = externalReference;
        }

        public void SetPendingAdminApproval()
        {
            if (Status != TopUpStatus.Initiated && Status != TopUpStatus.PendingConfirmation)
                throw new InvalidOperationException($"Cannot set top-up to pending admin approval in status {Status}");

            Status = TopUpStatus.PendingAdminApproval;
        }

        public void SubmitReference(string externalReference)
        {
            if (Status != TopUpStatus.Initiated && Status != TopUpStatus.PendingConfirmation)
                throw new InvalidOperationException($"Cannot submit reference in status {Status}");

            if (string.IsNullOrWhiteSpace(externalReference))
                throw new ArgumentException("External reference is required", nameof(externalReference));

            ExternalReference = externalReference.Trim();
            Status = TopUpStatus.PendingAdminApproval;
        }

        public void Confirm(string externalReference)
        {
            if (Status != TopUpStatus.PendingConfirmation && Status != TopUpStatus.Initiated && Status != TopUpStatus.PendingAdminApproval)
                throw new InvalidOperationException($"Cannot confirm top-up in status {Status}");

            Status = TopUpStatus.Confirmed;
            ExternalReference = externalReference;
            ConfirmedAt = DateTime.UtcNow;
        }

        public void Fail(string reason)
        {
            if (Status != TopUpStatus.Initiated && Status != TopUpStatus.PendingConfirmation)
                throw new InvalidOperationException($"Cannot fail top-up in status {Status}");

            Status = TopUpStatus.Failed;
            FailureReason = reason;
            FailedAt = DateTime.UtcNow;
        }

        public void Cancel(string reason)
        {
            if (Status != TopUpStatus.Initiated && Status != TopUpStatus.PendingConfirmation)
                throw new InvalidOperationException($"Cannot cancel top-up in status {Status}");

            Status = TopUpStatus.Cancelled;
            FailureReason = reason;
            FailedAt = DateTime.UtcNow;
        }

        public void SetTransactionId(Guid transactionId)
        {
            TransactionId = transactionId;
        }
    }
}