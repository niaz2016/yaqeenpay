using YaqeenPay.Domain.Common;

namespace YaqeenPay.Domain.Entities;

public class WishlistItem : AuditableEntity
{
    public Guid UserId { get; private set; }
    public Guid ProductId { get; private set; }
    public DateTime AddedDate { get; private set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual Identity.ApplicationUser User { get; set; } = null!;
    public virtual Product Product { get; set; } = null!;

    private WishlistItem() { } // For EF Core

    public WishlistItem(Guid userId, Guid productId)
    {
        UserId = userId;
        ProductId = productId;
        AddedDate = DateTime.UtcNow;
    }
}
