using YaqeenPay.Domain.Common;
using YaqeenPay.Domain.Enums;
using YaqeenPay.Domain.ValueObjects;

namespace YaqeenPay.Domain.Entities
{
    public class WalletTransaction : AuditableEntity
    {
        public Guid WalletId { get; private set; }
        public TransactionType Type { get; private set; }
        public Money Amount { get; private set; } = null!;
        public string Reason { get; private set; } = string.Empty;
        public Guid? ReferenceId { get; private set; }
        public string? ReferenceType { get; private set; }
        public string? ExternalReference { get; private set; }
        
        // Navigation property
        public virtual Wallet Wallet { get; private set; } = null!;

        private WalletTransaction() { } // For EF Core

        public WalletTransaction(
            Guid walletId, 
            TransactionType type, 
            Money amount, 
            string reason, 
            Guid? referenceId = null, 
            string? referenceType = null,
            string? externalReference = null)
        {
            if (amount.Amount <= 0)
                throw new ArgumentException("Transaction amount must be positive", nameof(amount));

            WalletId = walletId;
            Type = type;
            Amount = amount;
            Reason = reason;
            ReferenceId = referenceId;
            ReferenceType = referenceType;
            ExternalReference = externalReference;
        }

        public void SetReferenceInformation(Guid referenceId, string referenceType)
        {
            ReferenceId = referenceId;
            ReferenceType = referenceType;
        }

        public void SetExternalReference(string externalReference)
        {
            ExternalReference = externalReference;
        }
    }
}