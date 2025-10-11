using YaqeenPay.Domain.Common;
using YaqeenPay.Domain.ValueObjects;

namespace YaqeenPay.Domain.Entities;

public class CartItem : AuditableEntity
{
    public Guid UserId { get; private set; }
    public Guid ProductId { get; private set; }
    public int Quantity { get; private set; } = 1;
    public Money UnitPrice { get; private set; } = null!;
    public DateTime AddedDate { get; private set; } = DateTime.UtcNow;
    public DateTime LastUpdated { get; private set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual Identity.ApplicationUser User { get; set; } = null!;
    public virtual Product Product { get; set; } = null!;

    private CartItem() { } // For EF Core

    public CartItem(Guid userId, Guid productId, int quantity, Money unitPrice)
    {
        UserId = userId;
        ProductId = productId;
        Quantity = quantity;
        UnitPrice = unitPrice;
        AddedDate = DateTime.UtcNow;
        LastUpdated = DateTime.UtcNow;
    }

    public void UpdateQuantity(int quantity)
    {
        if (quantity <= 0)
            throw new ArgumentException("Quantity must be greater than zero.");
            
        Quantity = quantity;
        LastUpdated = DateTime.UtcNow;
    }

    public void UpdatePrice(Money unitPrice)
    {
        UnitPrice = unitPrice;
        LastUpdated = DateTime.UtcNow;
    }

    public Money GetTotalPrice()
    {
        return new Money(UnitPrice.Amount * Quantity, UnitPrice.Currency);
    }

    public void IncrementQuantity(int amount = 1)
    {
        Quantity += amount;
        LastUpdated = DateTime.UtcNow;
    }

    public void DecrementQuantity(int amount = 1)
    {
        if (Quantity - amount <= 0)
            throw new ArgumentException("Cannot decrement quantity below 1.");
            
        Quantity -= amount;
        LastUpdated = DateTime.UtcNow;
    }
}