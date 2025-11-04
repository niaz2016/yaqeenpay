using System.Threading.Tasks;
using YaqeenPay.Domain.Common;
using YaqeenPay.Domain.Enums;
using YaqeenPay.Domain.ValueObjects;

namespace YaqeenPay.Domain.Entities
{
    public class Wallet : AuditableEntity
    {
        private Money _balance = null!;
        private Money _frozenBalance = null!;
        
        public Guid UserId { get; private set; }
        public Money Balance 
        { 
            get => _balance;
            private set 
            {
                if (_balance != value)
                {
                    _balance = value;
                    UpdatedAt = DateTime.UtcNow;
                }
            }
        }
        public Money FrozenBalance 
        { 
            get => _frozenBalance;
            private set 
            {
                if (_frozenBalance != value)
                {
                    _frozenBalance = value;
                    UpdatedAt = DateTime.UtcNow;
                }
            }
        }
        public new bool IsActive { get; private set; } = true;
        
        // Navigation properties
        public virtual Domain.Entities.Identity.ApplicationUser User { get; private set; } = null!;
        public virtual ICollection<WalletTransaction> Transactions { get; private set; } = new List<WalletTransaction>();
        public DateTime UpdatedAt { get; set; }

        private Wallet() 
        { 
            // For EF Core - initialize with safe defaults
            _balance = new Money(0, "PKR");
            _frozenBalance = new Money(0, "PKR");
        }

        public Wallet(Guid userId, string currency = "PKR")
        {
            UserId = userId;
            _balance = new Money(0, currency);
            _frozenBalance = new Money(0, currency);
            IsActive = true;
            UpdatedAt = DateTime.UtcNow;
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
            
            //if (amount.Currency != Balance.Currency)
            //    throw new ArgumentException($"Currency mismatch. Wallet currency: {Balance.Currency}, Transaction currency: {amount.Currency}");

            // Update balance using the property setter to ensure change tracking
            Balance = new Money(Balance.Amount + amount.Amount, Balance.Currency);
            
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

            // Update balance using the property setter to ensure change tracking
            Balance = new Money(Balance.Amount - amount.Amount, Balance.Currency);
            
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
            return IsActive && GetAvailableBalance().Amount >= amount.Amount && Balance.Currency == amount.Currency;
        }

        public Money GetAvailableBalance()
        {
            var availableAmount = Balance.Amount - FrozenBalance.Amount;
            return new Money(availableAmount, Balance.Currency);
        }

        // Added optional reference parameters so callers can link wallet transactions to domain entities (e.g., orders)
        public void FreezeAmount(Money amount, string reason, Guid? referenceId = null, string? referenceType = null)
        {
            if (!IsActive)
                throw new InvalidOperationException("Cannot freeze amount in inactive wallet");
            
            if (amount.Amount <= 0)
                throw new ArgumentException("Freeze amount must be positive", nameof(amount));
            
            if (amount.Currency != Balance.Currency)
                throw new ArgumentException($"Currency mismatch. Wallet currency: {Balance.Currency}, Freeze amount currency: {amount.Currency}");

            if (!HasSufficientFunds(amount))
                throw new InvalidOperationException($"Insufficient available funds. Available: {GetAvailableBalance().Amount}, Required: {amount.Amount}");

            // Update frozen balance using the property setter to ensure change tracking
            FrozenBalance = new Money(FrozenBalance.Amount + amount.Amount, FrozenBalance.Currency);
            
            // Record transaction for freeze
            var transaction = new WalletTransaction(
                this.Id,
                TransactionType.Freeze,
                amount,
                reason,
                referenceId,
                referenceType);
            
            Transactions.Add(transaction);
        }

        public void UnfreezeAmount(Money amount, string reason)
        {
            if (!IsActive)
                throw new InvalidOperationException("Cannot unfreeze amount in inactive wallet");
            
            if (amount.Amount <= 0)
                throw new ArgumentException("Unfreeze amount must be positive", nameof(amount));
            
            if (amount.Currency != Balance.Currency)
                throw new ArgumentException($"Currency mismatch. Wallet currency: {Balance.Currency}, Unfreeze amount currency: {amount.Currency}");

            if (FrozenBalance.Amount < amount.Amount)
                throw new InvalidOperationException($"Insufficient frozen funds. Frozen: {FrozenBalance.Amount}, Unfreeze amount: {amount.Amount}");

            // Update frozen balance using the property setter to ensure change tracking
            FrozenBalance = new Money(FrozenBalance.Amount - amount.Amount, FrozenBalance.Currency);
            
            // Record transaction for unfreeze
            var transaction = new WalletTransaction(
                this.Id,
                TransactionType.Unfreeze,
                amount,
                reason);
            
            Transactions.Add(transaction);
        }

        // Added optional reference parameters to aid tracing which order a frozen-to-debit transfer belongs to
        public void TransferFrozenToDebit(Money amount, string reason, Guid? referenceId = null, string? referenceType = null)
        {
            if (!IsActive)
                throw new InvalidOperationException("Cannot transfer frozen amount in inactive wallet");
            
            if (amount.Amount <= 0)
                throw new ArgumentException("Transfer amount must be positive", nameof(amount));
            
            if (amount.Currency != Balance.Currency)
                throw new ArgumentException($"Currency mismatch. Wallet currency: {Balance.Currency}, Transfer amount currency: {amount.Currency}");

            if (FrozenBalance.Amount < amount.Amount)
                throw new InvalidOperationException($"Insufficient frozen funds. Frozen: {FrozenBalance.Amount}, Transfer amount: {amount.Amount}");

            // Reduce both frozen balance and total balance using property setters to ensure change tracking
            FrozenBalance = new Money(FrozenBalance.Amount - amount.Amount, FrozenBalance.Currency);
            Balance = new Money(Balance.Amount - amount.Amount, Balance.Currency);
            
            // Record transaction for frozen to debit transfer
            var transaction = new WalletTransaction(
                this.Id,
                TransactionType.FrozenToDebit,
                amount,
                reason,
                referenceId,
                referenceType);
            
            Transactions.Add(transaction);
        }
    }
}