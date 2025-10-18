using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using YaqeenPay.Application.Features.Ratings.DTOs;
using YaqeenPay.Domain.Entities;
using YaqeenPay.Domain.Interfaces;
using YaqeenPay.Infrastructure.Persistence;
namespace YaqeenPay.API.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    public class RatingsController : ApiControllerBase
    {
        private readonly IRatingRepository _ratingRepository;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<RatingsController> _logger;
        public RatingsController(
            IRatingRepository ratingRepository,
            ApplicationDbContext context,
            ILogger<RatingsController> logger)
        {
            _ratingRepository = ratingRepository;
            _context = context;
            _logger = logger;
        }
        [HttpPost]
        public async Task<IActionResult> SubmitRating([FromBody] RatingRequestDto request)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var reviewerId))
                {
                    return Unauthorized(new { message = "User not authenticated" });
                }
                var order = await _context.Orders.FindAsync(request.OrderId);
                if (order == null)
                {
                    return NotFound(new { message = "Order not found" });
                }
                var canRate = await _ratingRepository.CanUserRateAsync(request.OrderId, reviewerId, request.RevieweeId);
                if (!canRate)
                {
                    var existingRating = await _ratingRepository.GetByOrderAndReviewerAsync(request.OrderId, reviewerId);
                    if (existingRating != null)
                    {
                        return BadRequest(new { message = "You have already rated this order" });
                    }
                    return BadRequest(new { message = "You cannot rate this order" });
                }
                if (request.RevieweeId != order.BuyerId && request.RevieweeId != order.SellerId)
                {
                    return BadRequest(new { message = "Reviewee is not part of this order" });
                }
                var reviewerRole = reviewerId == order.BuyerId ? "buyer" : "seller";
                var revieweeRole = request.RevieweeId == order.BuyerId ? "buyer" : "seller";

                // Use Guid keys when querying DbContext.Users via EF Core (ApplicationUser Id is Guid)
                var reviewer = await _context.Users.FindAsync(reviewerId);
                var reviewee = await _context.Users.FindAsync(request.RevieweeId);

                var rating = new Rating(
                    request.OrderId,
                    reviewerId,
                    reviewer?.UserName ?? "Unknown",
                    reviewerRole,
                    request.RevieweeId,
                    reviewee?.UserName ?? "Unknown",
                    revieweeRole,
                    request.Score,
                    request.Comment,
                    request.Category
                );
                var createdRating = await _ratingRepository.CreateAsync(rating);
                var updatedStats = await _ratingRepository.GetStatsAsync(request.RevieweeId);
                var response = new RatingSubmissionResponseDto
                {
                    Success = true,
                    Rating = MapToRatingResponseDto(createdRating),
                    NewStats = await MapToRatingStatsDto(updatedStats),
                    Message = "Rating submitted successfully"
                };
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error submitting rating");
                return StatusCode(500, new { message = $"Error: {ex.Message}" });
            }
        }
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetRatings(
            [FromQuery] Guid userId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? sortBy = "date",
            [FromQuery] string? sortDir = "desc")
        {
            try
            {
                var ratings = await _ratingRepository.GetByUserAsync(userId, page, pageSize, sortBy, sortDir);
                var ratingDtos = ratings.Select(MapToRatingResponseDto).ToList();
                return Ok(ratingDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving ratings");
                return StatusCode(500, new { message = $"Error: {ex.Message}" });
            }
        }
        [HttpGet("stats/{userId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetRatingStats(Guid userId)
        {
            try
            {
                var stats = await _ratingRepository.GetStatsAsync(userId);
                var statsDto = await MapToRatingStatsDto(stats);
                return Ok(statsDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving stats");
                return StatusCode(500, new { message = $"Error: {ex.Message}" });
            }
        }
        [HttpGet("order/{orderId}")]
        public async Task<IActionResult> GetOrderRatings(Guid orderId)
        {
            try
            {
                var ratings = await _ratingRepository.GetByOrderAsync(orderId);
                var ratingDtos = ratings.Select(MapToRatingResponseDto).ToList();
                return Ok(ratingDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving order ratings");
                return StatusCode(500, new { message = $"Error: {ex.Message}" });
            }
        }
        [HttpGet("permission")]
        public async Task<IActionResult> CheckRatingPermission([FromQuery] Guid orderId, [FromQuery] Guid revieweeId)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var reviewerId))
                {
                    return Unauthorized(new { message = "User not authenticated" });
                }
                var canRate = await _ratingRepository.CanUserRateAsync(orderId, reviewerId, revieweeId);
                var deadline = await _ratingRepository.GetRatingDeadlineAsync(orderId);
                var existingRating = await _ratingRepository.GetByOrderAndReviewerAsync(orderId, reviewerId);
                var permission = new RatingPermissionDto
                {
                    CanRate = canRate,
                    Deadline = deadline
                };
                if (!canRate)
                {
                    if (existingRating != null)
                    {
                        permission.Reason = "You have already rated this order";
                        permission.ExistingRating = MapToRatingResponseDto(existingRating);
                    }
                    else
                    {
                        var order = await _context.Orders.FindAsync(orderId);
                        if (order == null)
                        {
                            permission.Reason = "Order not found";
                        }
                        else if (deadline.HasValue && DateTime.UtcNow > deadline.Value)
                        {
                            permission.Reason = "Rating window has expired (30 days)";
                        }
                        else
                        {
                            permission.Reason = "Order must be completed, rejected, or cancelled";
                        }
                    }
                }
                return Ok(permission);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking permission");
                return StatusCode(500, new { message = $"Error: {ex.Message}" });
            }
        }

        [HttpPut("{ratingId}")]
        public async Task<IActionResult> UpdateRating(Guid ratingId, [FromBody] RatingRequestDto request)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var reviewerId))
                {
                    return Unauthorized(new { message = "User not authenticated" });
                }

                var existingRating = await _ratingRepository.GetByIdAsync(ratingId);
                if (existingRating == null)
                {
                    return NotFound(new { message = "Rating not found" });
                }

                // Only the reviewer can update their own rating
                if (existingRating.ReviewerId != reviewerId)
                {
                    return Forbid();
                }

                // Check if within 30-day edit window
                var daysSinceCreation = (DateTime.UtcNow - existingRating.CreatedAt).TotalDays;
                if (daysSinceCreation > 30)
                {
                    return BadRequest(new { message = "Rating can only be edited within 30 days of creation" });
                }

                // Update the rating
                existingRating.UpdateRating(request.Score, request.Comment, request.Category);
                await _ratingRepository.UpdateAsync(existingRating);

                // Get updated stats
                var updatedStats = await _ratingRepository.GetStatsAsync(existingRating.RevieweeId);

                var response = new RatingSubmissionResponseDto
                {
                    Success = true,
                    Rating = MapToRatingResponseDto(existingRating),
                    NewStats = await MapToRatingStatsDto(updatedStats),
                    Message = "Rating updated successfully"
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating rating");
                return StatusCode(500, new { message = $"Error: {ex.Message}" });
            }
        }

        private RatingResponseDto MapToRatingResponseDto(Rating rating)
        {
            return new RatingResponseDto
            {
                Id = rating.Id,
                OrderId = rating.OrderId,
                OrderCode = rating.Order?.Title,
                ReviewerId = rating.ReviewerId,
                ReviewerName = rating.ReviewerName,
                ReviewerRole = rating.ReviewerRole,
                RevieweeId = rating.RevieweeId,
                RevieweeName = rating.RevieweeName,
                RevieweeRole = rating.RevieweeRole,
                Score = rating.Score,
                Comment = rating.Comment,
                Category = rating.Category,
                IsVerified = rating.IsVerified,
                CreatedAt = rating.CreatedAt,
                UpdatedAt = rating.LastModifiedAt ?? rating.CreatedAt
            };
        }
        private async Task<RatingStatsDto> MapToRatingStatsDto(RatingStats? stats)
        {
            if (stats == null)
            {
                return new RatingStatsDto
                {
                    UserId = Guid.Empty,
                    AverageRating = 0,
                    TotalRatings = 0,
                    PositivePercentage = 0,
                    VerifiedTransactions = 0
                };
            }
            var recentRatings = await _ratingRepository.GetByUserAsync(stats.UserId, 1, 5);
            var recentRatingDtos = recentRatings.Select(MapToRatingResponseDto).ToList();
            var positiveCount = stats.FiveStarCount + stats.FourStarCount;
            var positivePercentage = stats.TotalRatings > 0 
                ? (decimal)positiveCount / stats.TotalRatings * 100 
                : 0;
            return new RatingStatsDto
            {
                UserId = stats.UserId,
                AverageRating = stats.AverageRating,
                TotalRatings = stats.TotalRatings,
                RatingDistribution = new RatingDistributionDto
                {
                    Five = stats.FiveStarCount,
                    Four = stats.FourStarCount,
                    Three = stats.ThreeStarCount,
                    Two = stats.TwoStarCount,
                    One = stats.OneStarCount
                },
                CategoryAverages = new CategoryAveragesDto
                {
                    Communication = stats.CommunicationAvg,
                    Reliability = stats.ReliabilityAvg,
                    Quality = stats.QualityAvg,
                    Speed = stats.SpeedAvg,
                    Overall = stats.OverallAvg
                },
                RecentRatings = recentRatingDtos,
                AsBuyer = new RoleStatsDto
                {
                    AverageRating = stats.AsBuyerAverage,
                    TotalRatings = stats.AsBuyerCount
                },
                AsSeller = new RoleStatsDto
                {
                    AverageRating = stats.AsSellerAverage,
                    TotalRatings = stats.AsSellerCount
                },
                PositivePercentage = positivePercentage,
                VerifiedTransactions = stats.TotalRatings
            };
        }
    }
}

