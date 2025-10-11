using YaqeenPay.Domain.Common;
using YaqeenPay.Domain.ValueObjects;

namespace YaqeenPay.Domain.Entities;

public class OrderItem : AuditableEntity
{
    public Guid OrderId { get; private set; }
    public Guid ProductId { get; private set; }
    public int Quantity { get; private set; }
    public Money UnitPrice { get; private set; } = null!;
    public Money TotalPrice { get; private set; } = null!;
    public string ProductName { get; private set; } = string.Empty; // Snapshot of product name
    public string ProductSku { get; private set; } = string.Empty; // Snapshot of product SKU
    public string? ProductDescription { get; private set; } // Snapshot of product description
    public string? ProductImageUrl { get; private set; } // Snapshot of primary product image

    // Navigation properties
    public virtual Order Order { get; set; } = null!;
    public virtual Product Product { get; set; } = null!;

    private OrderItem() { } // For EF Core

    public OrderItem(
        Guid orderId,
        Guid productId,
        int quantity,
        Money unitPrice,
        string productName,
        string productSku,
        string? productDescription = null,
        string? productImageUrl = null)
    {
        OrderId = orderId;
        ProductId = productId;
        Quantity = quantity;
        UnitPrice = unitPrice;
        TotalPrice = new Money(unitPrice.Amount * quantity, unitPrice.Currency);
        ProductName = productName;
        ProductSku = productSku;
        ProductDescription = productDescription;
        ProductImageUrl = productImageUrl;
    }

    public void UpdateQuantity(int quantity)
    {
        if (quantity <= 0)
            throw new ArgumentException("Quantity must be greater than zero.");

        Quantity = quantity;
        TotalPrice = new Money(UnitPrice.Amount * quantity, UnitPrice.Currency);
    }

    public void UpdateUnitPrice(Money unitPrice)
    {
        UnitPrice = unitPrice;
        TotalPrice = new Money(unitPrice.Amount * Quantity, unitPrice.Currency);
    }

    public void UpdateProductSnapshot(string productName, string productSku, 
        string? productDescription = null, string? productImageUrl = null)
    {
        ProductName = productName;
        ProductSku = productSku;
        ProductDescription = productDescription;
        ProductImageUrl = productImageUrl;
    }
}