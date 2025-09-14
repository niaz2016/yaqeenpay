using YaqeenPay.Domain.Common;
using YaqeenPay.Domain.Enums;
using YaqeenPay.Domain.ValueObjects;

namespace YaqeenPay.Domain.Entities
{
    public class Escrow : AuditableEntity
    {
        public Guid BuyerId { get; private set; }
        public Guid SellerId { get; private set; }
        public Guid? OrderId { get; private set; }
        public Money Amount { get; private set; } = null!;
        public decimal FeeRate { get; private set; }
        public EscrowStatus Status { get; private set; } = EscrowStatus.Created;
        public string Title { get; private set; } = string.Empty;
        public string Description { get; private set; } = string.Empty;
        public DateTime? LockedAt { get; private set; }
        public DateTime? ShippedAt { get; private set; }
        public DateTime? DeliveredAt { get; private set; }
        public DateTime? ReleasedAt { get; private set; }
        public DateTime? RefundedAt { get; private set; }
        public DateTime? CancelledAt { get; private set; }
        public DateTime? CompletedDate { get; private set; }
        
        // Navigation properties
        public virtual Domain.Entities.Identity.ApplicationUser Buyer { get; private set; } = null!;
        public virtual Domain.Entities.Identity.ApplicationUser Seller { get; private set; } = null!;
        public virtual Order Order { get; private set; } = null!;

        private Escrow() { } // For EF Core

        public Escrow(Guid buyerId, Guid sellerId, Money amount, decimal feeRate)
        {
            if (amount.Amount <= 0)
                throw new ArgumentException("Escrow amount must be positive", nameof(amount));
            
            if (feeRate < 0 || feeRate > 1)
                throw new ArgumentException("Fee rate must be between 0 and 1", nameof(feeRate));

            BuyerId = buyerId;
            SellerId = sellerId;
            Amount = amount;
            FeeRate = feeRate;
            Status = EscrowStatus.Created;
        }
        
        public Escrow(Money amount, Guid buyerId, Guid sellerId, string title, string description)
        {
            if (amount.Amount <= 0)
                throw new ArgumentException("Escrow amount must be positive", nameof(amount));
            
            Amount = amount;
            BuyerId = buyerId;
            SellerId = sellerId;
            Title = title;
            Description = description;
            FeeRate = 0.05m; // Default fee rate
            Status = EscrowStatus.Created;
        }

        public void SetOrderId(Guid orderId)
        {
            OrderId = orderId;
        }

        public bool CanFund()
        {
            return Status == EscrowStatus.Created;
        }

        public void Fund()
        {
            if (!CanFund())
                throw new InvalidOperationException($"Cannot fund escrow in status {Status}");
            
            Status = EscrowStatus.Funded;
            LockedAt = DateTime.UtcNow;
        }

        public bool CanRelease()
        {
            return Status == EscrowStatus.Funded;
        }

        public void Release()
        {
            if (!CanRelease())
                throw new InvalidOperationException($"Cannot release escrow in status {Status}");
            
            Status = EscrowStatus.Released;
            ReleasedAt = DateTime.UtcNow;
        }

        public bool CanDispute()
        {
            return Status == EscrowStatus.Funded;
        }

        public void Dispute()
        {
            if (!CanDispute())
                throw new InvalidOperationException($"Cannot dispute escrow in status {Status}");
            
            Status = EscrowStatus.Disputed;
        }

        public bool CanRefund()
        {
            return Status == EscrowStatus.Funded || Status == EscrowStatus.Disputed;
        }

        public void Refund()
        {
            if (!CanRefund())
                throw new InvalidOperationException($"Cannot refund escrow in status {Status}");
            
            Status = EscrowStatus.Refunded;
            RefundedAt = DateTime.UtcNow;
        }

        public bool CanCancel()
        {
            return Status == EscrowStatus.Created;
        }

        public void Cancel()
        {
            if (!CanCancel())
                throw new InvalidOperationException($"Cannot cancel escrow in status {Status}");
            
            Status = EscrowStatus.Cancelled;
            CancelledAt = DateTime.UtcNow;
        }

        public bool CanComplete()
        {
            return Status == EscrowStatus.Released;
        }

        public void Complete()
        {
            if (!CanComplete())
                throw new InvalidOperationException($"Cannot complete escrow in status {Status}");
            
            Status = EscrowStatus.Completed;
            CompletedDate = DateTime.UtcNow;
        }

        public Money CalculateFee()
        {
            return Amount * FeeRate;
        }

        public Money CalculateSellerAmount()
        {
            return Amount - CalculateFee();
        }
    }
}