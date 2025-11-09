using TechTorio.Domain.Common;

namespace TechTorio.Domain.Entities;

public class ProductReview : AuditableEntity
{
    public Guid ProductId { get; private set; }
    public Guid ReviewerId { get; private set; }
    public string ReviewerName { get; private set; } = string.Empty;
    public int Rating { get; private set; }
    public string? Comment { get; private set; }

    // Navigation
    public virtual Identity.ApplicationUser Reviewer { get; set; } = null!;

    private ProductReview() { }

    public ProductReview(Guid productId, Guid reviewerId, string reviewerName, int rating, string? comment = null)
    {
        ProductId = productId;
        ReviewerId = reviewerId;
        ReviewerName = reviewerName;
        Rating = rating;
        Comment = comment;
    }
}
