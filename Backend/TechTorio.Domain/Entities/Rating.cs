using TechTorio.Domain.Common;

namespace TechTorio.Domain.Entities
{
    public class Rating : AuditableEntity
    {
        public Guid OrderId { get; private set; }
        public Guid ReviewerId { get; private set; }
        public string ReviewerName { get; private set; } = string.Empty;
        public string ReviewerRole { get; private set; } = string.Empty; // "buyer" or "seller"
        public Guid RevieweeId { get; private set; }
        public string RevieweeName { get; private set; } = string.Empty;
        public string RevieweeRole { get; private set; } = string.Empty; // "buyer" or "seller"
        public int Score { get; private set; } // 1-5
        public string? Comment { get; private set; }
        public string Category { get; private set; } = "overall"; // communication, reliability, quality, speed, overall
        public bool IsVerified { get; private set; } = true;

        // Navigation properties
        public virtual Order Order { get; private set; } = null!;
        public virtual Identity.ApplicationUser Reviewer { get; private set; } = null!;
        public virtual Identity.ApplicationUser Reviewee { get; private set; } = null!;

        private Rating() { } // For EF Core

        public Rating(
            Guid orderId,
            Guid reviewerId,
            string reviewerName,
            string reviewerRole,
            Guid revieweeId,
            string revieweeName,
            string revieweeRole,
            int score,
            string? comment,
            string category)
        {
            if (score < 1 || score > 5)
                throw new ArgumentException("Score must be between 1 and 5", nameof(score));

            if (string.IsNullOrWhiteSpace(reviewerName))
                throw new ArgumentException("Reviewer name is required", nameof(reviewerName));

            if (string.IsNullOrWhiteSpace(revieweeName))
                throw new ArgumentException("Reviewee name is required", nameof(revieweeName));

            OrderId = orderId;
            ReviewerId = reviewerId;
            ReviewerName = reviewerName;
            ReviewerRole = reviewerRole;
            RevieweeId = revieweeId;
            RevieweeName = revieweeName;
            RevieweeRole = revieweeRole;
            Score = score;
            Comment = comment;
            Category = category;
            IsVerified = true;
        }

        public void UpdateRating(int score, string? comment, string category)
        {
            if (score < 1 || score > 5)
                throw new ArgumentException("Score must be between 1 and 5", nameof(score));

            Score = score;
            Comment = comment;
            Category = category;
        }
    }
}
