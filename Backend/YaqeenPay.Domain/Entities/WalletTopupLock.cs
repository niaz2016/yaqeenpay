using YaqeenPay.Domain.Common;
using YaqeenPay.Domain.Enums;
using YaqeenPay.Domain.ValueObjects;

namespace YaqeenPay.Domain.Entities
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

        private string GenerateTransactionReference()
        {
            return $"WTU{DateTime.UtcNow:yyyyMMddHHmmss}{new Random().Next(1000, 9999)}";
        }
    }
}