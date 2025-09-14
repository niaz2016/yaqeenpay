using YaqeenPay.Domain.Common;
using YaqeenPay.Domain.ValueObjects;

namespace YaqeenPay.Domain.Entities
{
    public enum LedgerAccountType
    {
        BuyerWallet,
        SellerWallet,
        EscrowHolding,
        PlatformFeeRevenue
    }

    public class LedgerAccount : AuditableEntity
    {
        public Guid? UserId { get; private set; }
        public LedgerAccountType Type { get; private set; }
        public string Currency { get; private set; } = "PKR";

        private LedgerAccount() { } // For EF Core

        public LedgerAccount(LedgerAccountType type, string currency, Guid? userId = null)
        {
            Type = type;
            Currency = currency.ToUpperInvariant();
            UserId = userId;
        }

        public static LedgerAccount CreateBuyerWallet(Guid userId, string currency = "PKR")
        {
            return new LedgerAccount(LedgerAccountType.BuyerWallet, currency, userId);
        }

        public static LedgerAccount CreateSellerWallet(Guid userId, string currency = "PKR")
        {
            return new LedgerAccount(LedgerAccountType.SellerWallet, currency, userId);
        }

        public static LedgerAccount CreateEscrowHolding(string currency = "PKR")
        {
            return new LedgerAccount(LedgerAccountType.EscrowHolding, currency);
        }

        public static LedgerAccount CreatePlatformFeeRevenue(string currency = "PKR")
        {
            return new LedgerAccount(LedgerAccountType.PlatformFeeRevenue, currency);
        }
    }

    public enum ReferenceType
    {
        TopUp,
        EscrowFunding,
        EscrowRelease,
        EscrowRefund,
        EscrowCancel,
        FeeCollection,
        Withdrawal
    }

    public class LedgerEntry : AuditableEntity
    {
        public Guid DebitAccountId { get; private set; }
        public Guid CreditAccountId { get; private set; }
        public Money Amount { get; private set; } = null!;
        public ReferenceType ReferenceType { get; private set; }
        public Guid ReferenceId { get; private set; }
        public Guid CorrelationId { get; private set; }
        public string? Description { get; private set; }

        private LedgerEntry() { } // For EF Core

        public LedgerEntry(
            Guid debitAccountId, 
            Guid creditAccountId, 
            Money amount, 
            ReferenceType referenceType, 
            Guid referenceId, 
            Guid correlationId,
            string? description = null)
        {
            if (amount.Amount <= 0)
                throw new ArgumentException("Amount must be positive", nameof(amount));

            DebitAccountId = debitAccountId;
            CreditAccountId = creditAccountId;
            Amount = amount;
            ReferenceType = referenceType;
            ReferenceId = referenceId;
            CorrelationId = correlationId;
            Description = description;
        }
    }
}