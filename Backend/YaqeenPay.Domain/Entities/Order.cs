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
        public Money DeclaredValue { get; private set; } = null!;
        public Money Amount { get; private set; } = null!;
        public string? Courier { get; private set; }
        public string? TrackingNumber { get; private set; }
        public OrderStatus Status { get; private set; } = OrderStatus.Created;
        public DateTime? CompletedDate { get; private set; }
        public DateTime? ShippedDate { get; private set; }
        public DateTime? DeliveredDate { get; private set; }
        public DateTime? RejectedDate { get; private set; }
        public string? DeliveryAddress { get; private set; }
        public string? RejectionReason { get; private set; }
        public string? DeliveryNotes { get; private set; }
        public string? ShippingProof { get; private set; }
        public DateTime? DeliveryConfirmationExpiry { get; private set; }
        public string? DeliveryConfirmationCode { get; private set; }
        
        // Navigation properties
        public virtual Domain.Entities.Identity.ApplicationUser Buyer { get; private set; } = null!;
        public virtual Domain.Entities.Identity.ApplicationUser Seller { get; private set; } = null!;
        public virtual Escrow Escrow { get; private set; } = null!;
        public virtual ICollection<Dispute> Disputes { get; private set; } = new List<Dispute>();

        private Order() { } // For EF Core

        public Order(Guid buyerId, Guid sellerId, Guid escrowId, string description, Money declaredValue)
        {
            BuyerId = buyerId;
            SellerId = sellerId;
            EscrowId = escrowId;
            Description = description;
            DeclaredValue = declaredValue;
            Amount = declaredValue;
            Status = OrderStatus.Created;
        }
        
        public Order(Guid buyerId, Guid sellerId, Guid escrowId, string title, string description, Money declaredValue)
        {
            BuyerId = buyerId;
            SellerId = sellerId;
            EscrowId = escrowId;
            Title = title;
            Description = description;
            DeclaredValue = declaredValue;
            Amount = declaredValue;
            Status = OrderStatus.Created;
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

        public void ConfirmOrder()
        {
            if (Status != OrderStatus.Created)
                throw new InvalidOperationException($"Cannot confirm order in status {Status}");
            
            Status = OrderStatus.Confirmed;
        }

        public void MarkAsShipped()
        {
            if (Status != OrderStatus.Confirmed)
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
        }
        
        public void Complete()
        {
            CompleteOrder();
        }

        public void CancelOrder()
        {
            if (Status != OrderStatus.Created && Status != OrderStatus.Confirmed)
                throw new InvalidOperationException($"Cannot cancel order in status {Status}");
            
            Status = OrderStatus.Cancelled;
        }

        public void RejectOrder(string reason)
        {
            if (Status != OrderStatus.DeliveredPendingDecision)
                throw new InvalidOperationException($"Cannot reject order in status {Status}");
            
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
    }
}