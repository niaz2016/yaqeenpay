using TechTorio.Domain.Common;

namespace TechTorio.Domain.Entities
{
    public class RatingStats : BaseEntity
    {
        public Guid UserId { get; private set; }
        public decimal AverageRating { get; private set; }
        public int TotalRatings { get; private set; }

        // Distribution
        public int FiveStarCount { get; private set; }
        public int FourStarCount { get; private set; }
        public int ThreeStarCount { get; private set; }
        public int TwoStarCount { get; private set; }
        public int OneStarCount { get; private set; }

        // Category averages
        public decimal CommunicationAvg { get; private set; }
        public decimal ReliabilityAvg { get; private set; }
        public decimal QualityAvg { get; private set; }
        public decimal SpeedAvg { get; private set; }
        public decimal OverallAvg { get; private set; }

        // Role-based stats
        public decimal AsBuyerAverage { get; private set; }
        public int AsBuyerCount { get; private set; }
        public decimal AsSellerAverage { get; private set; }
        public int AsSellerCount { get; private set; }

        public DateTime UpdatedAt { get; private set; }

        // Navigation property
        public virtual Identity.ApplicationUser User { get; private set; } = null!;

        private RatingStats() { } // For EF Core

        public RatingStats(Guid userId)
        {
            UserId = userId;
            UpdatedAt = DateTime.UtcNow;
        }

        public void UpdateStats(
            decimal averageRating,
            int totalRatings,
            int fiveStarCount,
            int fourStarCount,
            int threeStarCount,
            int twoStarCount,
            int oneStarCount,
            decimal communicationAvg,
            decimal reliabilityAvg,
            decimal qualityAvg,
            decimal speedAvg,
            decimal overallAvg,
            decimal asBuyerAverage,
            int asBuyerCount,
            decimal asSellerAverage,
            int asSellerCount)
        {
            AverageRating = averageRating;
            TotalRatings = totalRatings;
            FiveStarCount = fiveStarCount;
            FourStarCount = fourStarCount;
            ThreeStarCount = threeStarCount;
            TwoStarCount = twoStarCount;
            OneStarCount = oneStarCount;
            CommunicationAvg = communicationAvg;
            ReliabilityAvg = reliabilityAvg;
            QualityAvg = qualityAvg;
            SpeedAvg = speedAvg;
            OverallAvg = overallAvg;
            AsBuyerAverage = asBuyerAverage;
            AsBuyerCount = asBuyerCount;
            AsSellerAverage = asSellerAverage;
            AsSellerCount = asSellerCount;
            UpdatedAt = DateTime.UtcNow;
        }
    }
}
