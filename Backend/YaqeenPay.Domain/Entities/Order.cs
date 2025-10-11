using YaqeenPay.Domain.Common;
using YaqeenPay.Domain.Enums;
using YaqeenPay.Domain.ValueObjects;
using System.Collections.Generic;

namespace YaqeenPay.Domain.Entities
{
    public class Order : AuditableEntity
    {
        public Guid BuyerId { get; private set; }
        public Guid SellerId { get; private set; }
        public Guid EscrowId { get; private set; }
        public string Title { get; private set; } = string.Empty;
        public string Description { get; private set; } = string.Empty;
        public Money Amount { get; private set; } = null!;
        public decimal DeclaredValue { get; private set; } // Added DeclaredValue property
        public string DeclaredValueCurrency { get; private set; } = string.Empty; // Added currency for declared value
        public string? Courier { get; private set; }
        public string? TrackingNumber { get; private set; }
        public OrderStatus Status { get; private set; } = OrderStatus.Created;
        public DateTime? CompletedDate { get; private set; }
        public DateTime? ShippedDate { get; private set; }
        public DateTime? DeliveredDate { get; private set; }
        public DateTime? RejectedDate { get; private set; }
        public DateTime? PaymentDate { get; private set; }
        public Money? FrozenAmount { get; private set; }
        public bool IsAmountFrozen { get; private set; } = false;
        public string? DeliveryAddress { get; private set; }
        public string? RejectionReason { get; private set; }
        public string? DeliveryNotes { get; private set; }
        public string? ShippingProof { get; private set; }
        public DateTime? DeliveryConfirmationExpiry { get; private set; }
        public string? DeliveryConfirmationCode { get; private set; }
        public List<string> ImageUrls { get; private set; } = new List<string>();
        public virtual Identity.ApplicationUser Buyer { get; set; } = null!;
        public virtual Identity.ApplicationUser Seller { get; set; } = null!;
        
        // Navigation properties
        public virtual Escrow Escrow { get; private set; } = null!;
        public virtual ICollection<Dispute> Disputes { get; private set; } = new List<Dispute>();
        public virtual ICollection<OrderItem> OrderItems { get; private set; } = new List<OrderItem>();

        private Order() { } // For EF Core

        public Order(Guid buyerId, Guid sellerId, Guid escrowId, string description, Money amount, List<string>? imageUrls = null)
        {
            BuyerId = buyerId;
            SellerId = sellerId;
            EscrowId = escrowId;
            Description = description;
            Amount = new Money(amount.Amount, amount.Currency); // clone safety
            DeclaredValue = amount.Amount; // Initialize DeclaredValue with Amount
            DeclaredValueCurrency = amount.Currency; // Initialize currency
            Status = OrderStatus.Created;
            ImageUrls = imageUrls ?? new List<string>();
        }
        
        public Order(Guid buyerId, Guid sellerId, Guid escrowId, string title, string description, Money amount, List<string>? imageUrls = null)
        {
            BuyerId = buyerId;
            SellerId = sellerId;
            EscrowId = escrowId;
            Title = title;
            Description = description;
            Amount = new Money(amount.Amount, amount.Currency);
            DeclaredValue = amount.Amount; // Initialize DeclaredValue with Amount
            DeclaredValueCurrency = amount.Currency; // Initialize currency
            Status = OrderStatus.Created;
            ImageUrls = imageUrls ?? new List<string>();
        }

        public void UpdateShippingDetails(string courier, string trackingNumber, string? shippingProof = null)
        {
            Courier = courier;
            TrackingNumber = trackingNumber;
            ShippingProof = shippingProof;
        }

        public void SetDeliveryAddress(string address, string? notes = null)
        {
            DeliveryAddress = address;
            DeliveryNotes = notes;
        }

        public void MarkPaymentPending()
        {
            if (Status != OrderStatus.Created)
                throw new InvalidOperationException($"Cannot mark payment pending for order in status {Status}");
            
            Status = OrderStatus.PaymentPending;
        }

        public void ConfirmPayment(Money frozenAmount)
        {
            if (Status != OrderStatus.PaymentPending && Status != OrderStatus.Created)
                throw new InvalidOperationException($"Cannot confirm payment for order in status {Status}");
            
            if (frozenAmount.Currency != Amount.Currency)
                throw new ArgumentException($"Currency mismatch. Order currency: {Amount.Currency}, Frozen amount currency: {frozenAmount.Currency}");
                
            if (frozenAmount.Amount != Amount.Amount)
                throw new ArgumentException($"Amount mismatch. Order amount: {Amount.Amount}, Frozen amount: {frozenAmount.Amount}");
            
            Status = OrderStatus.AwaitingShipment;
            PaymentDate = DateTime.UtcNow;
            FrozenAmount = new Money(frozenAmount.Amount, frozenAmount.Currency);
            IsAmountFrozen = true;
        }

        public void ConfirmShipment()
        {
            if (Status != OrderStatus.AwaitingShipment)
                throw new InvalidOperationException($"Cannot confirm shipment for order in status {Status}. Order must be awaiting shipment.");
            
            Status = OrderStatus.Shipped;
            ShippedDate = DateTime.UtcNow;
        }

        public void MarkAsShipped()
        {
            if (Status != OrderStatus.AwaitingShipment)
                throw new InvalidOperationException($"Cannot mark order as shipped in status {Status}");
            
            Status = OrderStatus.Shipped;
            ShippedDate = DateTime.UtcNow;
        }

        public void MarkAsDelivered()
        {
            if (Status != OrderStatus.Shipped)
                throw new InvalidOperationException($"Cannot mark order as delivered in status {Status}");
            
            Status = OrderStatus.Delivered;
            DeliveredDate = DateTime.UtcNow;
            
            // Change status to DeliveredPendingDecision, since buyer now needs to decide
            Status = OrderStatus.DeliveredPendingDecision;
            
            // Set expiry for auto-completion (e.g., 48 hours from now)
            DeliveryConfirmationExpiry = DateTime.UtcNow.AddHours(48);
            
            // Generate a unique confirmation code for delivery verification
            DeliveryConfirmationCode = Guid.NewGuid().ToString("N").Substring(0, 6).ToUpper();
        }

        public void CompleteOrder()
        {
            if (Status != OrderStatus.DeliveredPendingDecision && Status != OrderStatus.Delivered)
                throw new InvalidOperationException($"Cannot complete order in status {Status}");
            
            Status = OrderStatus.Completed;
            CompletedDate = DateTime.UtcNow;
            IsAmountFrozen = false; // Unfreeze amount as order is completed
        }
        
        public void Complete()
        {
            CompleteOrder();
        }

        public void CancelOrder()
        {
            if (Status != OrderStatus.Created && Status != OrderStatus.PaymentPending && 
                Status != OrderStatus.PaymentConfirmed && Status != OrderStatus.AwaitingShipment)
                throw new InvalidOperationException($"Cannot cancel order in status {Status}");
            
            Status = OrderStatus.Cancelled;
            IsAmountFrozen = false; // Unfreeze amount as order is cancelled
        }

        public void RejectOrder(string reason)
        {
            if (Status != OrderStatus.DeliveredPendingDecision)
                throw new InvalidOperationException($"Cannot reject order in status {Status}");
            
            Status = OrderStatus.Rejected;
            RejectedDate = DateTime.UtcNow;
            RejectionReason = reason;
        }

        // Early rejection before any payment or shipment has occurred
        public void RejectBeforeShipment(string reason)
        {
            // Allowed only if order is still pre-payment and not shipped
            if (Status != OrderStatus.Created && Status != OrderStatus.PaymentPending)
                throw new InvalidOperationException($"Cannot early-reject order in status {Status}. Only Created or PaymentPending allowed.");
            if (IsAmountFrozen || PaymentDate.HasValue)
                throw new InvalidOperationException("Cannot early-reject after payment has been made.");

            Status = OrderStatus.Rejected;
            RejectedDate = DateTime.UtcNow;
            RejectionReason = reason;
        }

        public void MarkAsDisputed()
        {
            if (Status != OrderStatus.DeliveredPendingDecision && Status != OrderStatus.Rejected)
                throw new InvalidOperationException($"Cannot mark order as disputed in status {Status}");
            
            Status = OrderStatus.Disputed;
        }
        
        public void ResolveDispute(bool inFavorOfBuyer)
        {
            if (Status != OrderStatus.Disputed)
                throw new InvalidOperationException($"Cannot resolve dispute in status {Status}");
            
            Status = OrderStatus.DisputeResolved;
            
            if (inFavorOfBuyer)
            {
                // The buyer gets refunded in this case
                Status = OrderStatus.Rejected;
            }
            else
            {
                // The seller gets the money in this case
                Status = OrderStatus.Completed;
                CompletedDate = DateTime.UtcNow;
            }
        }
        
        public bool IsExpired()
        {
            return Status == OrderStatus.DeliveredPendingDecision && 
                   DeliveryConfirmationExpiry.HasValue && 
                   DeliveryConfirmationExpiry.Value < DateTime.UtcNow;
        }
        
        public void AutoCompleteIfExpired()
        {
            if (IsExpired())
            {
                CompleteOrder();
            }
        }

        public void SetTitle(string title)
        {
            Title = title;
        }

        public void SetDeliveryNotes(string notes)
        {
            DeliveryNotes = notes;
        }
    }
}