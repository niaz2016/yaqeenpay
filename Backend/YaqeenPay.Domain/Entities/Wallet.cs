using YaqeenPay.Domain.Common;
using YaqeenPay.Domain.Enums;
using YaqeenPay.Domain.ValueObjects;

namespace YaqeenPay.Domain.Entities
{
    public class Wallet : AuditableEntity
    {
        public Guid UserId { get; private set; }
        public Money Balance { get; private set; } = null!;
        public bool IsActive { get; private set; } = true;
        
        // Navigation properties
        public virtual Domain.Entities.Identity.ApplicationUser User { get; private set; } = null!;
        public virtual ICollection<WalletTransaction> Transactions { get; private set; } = new List<WalletTransaction>();
        public DateTime UpdatedAt { get; set; }

        private Wallet() { } // For EF Core

        public Wallet(Guid userId, string currency = "PKR")
        {
            UserId = userId;
            Balance = new Money(0, currency);
            IsActive = true;
        }

        public static Wallet Create(Guid userId, string currency = "PKR")
        {
            return new Wallet(userId, currency);
        }

        public void Deactivate()
        {
            IsActive = false;
        }

        public void Activate()
        {
            IsActive = true;
        }

        public void Credit(Money amount, string reason)
        {
            if (!IsActive)
                throw new InvalidOperationException("Cannot credit inactive wallet");
            
            if (amount.Amount <= 0)
                throw new ArgumentException("Credit amount must be positive", nameof(amount));
            
            if (amount.Currency != Balance.Currency)
                throw new ArgumentException($"Currency mismatch. Wallet currency: {Balance.Currency}, Transaction currency: {amount.Currency}");

            Balance += amount;
            
            // Record transaction
            var transaction = new WalletTransaction(
                this.Id,
                TransactionType.Credit,
                amount,
                reason);
            
            Transactions.Add(transaction);
        }

        public void Debit(Money amount, string reason)
        {
            if (!IsActive)
                throw new InvalidOperationException("Cannot debit inactive wallet");
            
            if (amount.Amount <= 0)
                throw new ArgumentException("Debit amount must be positive", nameof(amount));
            
            if (amount.Currency != Balance.Currency)
                throw new ArgumentException($"Currency mismatch. Wallet currency: {Balance.Currency}, Transaction currency: {amount.Currency}");

            if (Balance.Amount < amount.Amount)
                throw new InvalidOperationException($"Insufficient funds. Available: {Balance.Amount}, Required: {amount.Amount}");

            Balance -= amount;
            
            // Record transaction
            var transaction = new WalletTransaction(
                this.Id,
                TransactionType.Debit,
                amount,
                reason);
            
            Transactions.Add(transaction);
        }

        public bool HasSufficientFunds(Money amount)
        {
            return IsActive && Balance.Amount >= amount.Amount && Balance.Currency == amount.Currency;
        }
    }
}