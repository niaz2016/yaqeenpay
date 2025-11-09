using TechTorio.Domain.Common;
using TechTorio.Domain.Enums;
using TechTorio.Domain.ValueObjects;

namespace TechTorio.Domain.Entities
{
    public class WalletTopupLock : AuditableEntity
    {
        public Guid UserId { get; private set; }
        public Money Amount { get; private set; } = null!;
        public DateTime LockedAt { get; private set; }
        public DateTime ExpiresAt { get; private set; } = DateTime.UtcNow.AddMinutes(2);
        public TopupLockStatus Status { get; private set; }
        public string? TransactionReference { get; private set; }

        // Navigation properties
        public virtual Domain.Entities.Identity.ApplicationUser User { get; private set; } = null!;

        private WalletTopupLock() { } // For EF Core

        public WalletTopupLock(Guid userId, Money amount, int lockExpiryMinutes = 10)
        {
            UserId = userId;
            Amount = amount;
            LockedAt = DateTime.UtcNow;
            ExpiresAt = DateTime.UtcNow.AddMinutes(lockExpiryMinutes);
            Status = TopupLockStatus.Locked;
            TransactionReference = GenerateTransactionReference();
        }

        public static WalletTopupLock Create(Guid userId, Money amount, int lockExpiryMinutes = 10)
        {
            return new WalletTopupLock(userId, amount, lockExpiryMinutes);
        }

        public void MarkAsCompleted()
        {
            if (Status != TopupLockStatus.Locked)
                throw new InvalidOperationException($"Cannot complete lock in status: {Status}");
            
            if (IsExpired())
                throw new InvalidOperationException("Cannot complete expired lock");

            Status = TopupLockStatus.Completed;
        }

        public void MarkAsExpired()
        {
            if (Status == TopupLockStatus.Completed)
                throw new InvalidOperationException("Cannot expire completed lock");

            Status = TopupLockStatus.Expired;
        }

        public bool IsExpired()
        {
            return DateTime.UtcNow > ExpiresAt;
        }

        public bool IsLockActive()
        {
            return Status == TopupLockStatus.Locked && !IsExpired();
        }

        public bool IsAwaitingConfirmation()
        {
            return Status == TopupLockStatus.AwaitingConfirmation && !IsExpired();
        }

        public void MarkAwaitingConfirmation(int extendMinutes)
        {
            if (Status != TopupLockStatus.Locked && Status != TopupLockStatus.AwaitingConfirmation)
                throw new InvalidOperationException("Can only mark awaiting confirmation from Locked or AwaitingConfirmation states");
            if (IsExpired()) throw new InvalidOperationException("Cannot extend expired lock");
            Status = TopupLockStatus.AwaitingConfirmation;
            // Cap extension to +2 minutes from now (business rule)
            var cap = DateTime.UtcNow.AddMinutes(Math.Min(extendMinutes, 2));
            if (cap > ExpiresAt)
            {
                typeof(WalletTopupLock).GetProperty("ExpiresAt")!.SetValue(this, cap);
            }
        }

        private string GenerateTransactionReference()
        {
            return $"WTU{DateTime.UtcNow:yyyyMMddHHmmss}{new Random().Next(1000, 9999)}";
        }
    }
}