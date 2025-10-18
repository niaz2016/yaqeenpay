using System.ComponentModel.DataAnnotations;

namespace YaqeenPay.Application.Features.Ratings.DTOs
{
    public class RatingRequestDto
    {
        [Required]
        public Guid OrderId { get; set; }

        [Required]
        public Guid RevieweeId { get; set; }

        [Required]
        [Range(1, 5, ErrorMessage = "Score must be between 1 and 5")]
        public int Score { get; set; }

        [MaxLength(500, ErrorMessage = "Comment cannot exceed 500 characters")]
        public string? Comment { get; set; }

        [MaxLength(50)]
        public string Category { get; set; } = "overall";
    }

    public class RatingResponseDto
    {
        public Guid Id { get; set; }
        public Guid OrderId { get; set; }
        public string? OrderCode { get; set; }
        public Guid ReviewerId { get; set; }
        public string ReviewerName { get; set; } = string.Empty;
        public string ReviewerRole { get; set; } = string.Empty;
        public Guid RevieweeId { get; set; }
        public string RevieweeName { get; set; } = string.Empty;
        public string RevieweeRole { get; set; } = string.Empty;
        public int Score { get; set; }
        public string? Comment { get; set; }
        public string Category { get; set; } = string.Empty;
        public bool IsVerified { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class RatingStatsDto
    {
        public Guid UserId { get; set; }
        public decimal AverageRating { get; set; }
        public int TotalRatings { get; set; }
        public RatingDistributionDto RatingDistribution { get; set; } = new();
        public CategoryAveragesDto CategoryAverages { get; set; } = new();
        public List<RatingResponseDto> RecentRatings { get; set; } = new();
        public RoleStatsDto AsBuyer { get; set; } = new();
        public RoleStatsDto AsSeller { get; set; } = new();
        public decimal PositivePercentage { get; set; }
        public int VerifiedTransactions { get; set; }
    }

    public class RatingDistributionDto
    {
        public int Five { get; set; }
        public int Four { get; set; }
        public int Three { get; set; }
        public int Two { get; set; }
        public int One { get; set; }
    }

    public class CategoryAveragesDto
    {
        public decimal Communication { get; set; }
        public decimal Reliability { get; set; }
        public decimal Quality { get; set; }
        public decimal Speed { get; set; }
        public decimal Overall { get; set; }
    }

    public class RoleStatsDto
    {
        public decimal AverageRating { get; set; }
        public int TotalRatings { get; set; }
    }

    public class RatingPermissionDto
    {
        public bool CanRate { get; set; }
        public string? Reason { get; set; }
        public RatingResponseDto? ExistingRating { get; set; }
        public DateTime? Deadline { get; set; }
    }

    public class RatingSubmissionResponseDto
    {
        public bool Success { get; set; }
        public RatingResponseDto? Rating { get; set; }
        public RatingStatsDto? NewStats { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}
