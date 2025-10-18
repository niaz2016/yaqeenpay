using Microsoft.EntityFrameworkCore;
using YaqeenPay.Domain.Entities;
using YaqeenPay.Domain.Enums;
using YaqeenPay.Domain.Interfaces;

namespace YaqeenPay.Infrastructure.Persistence.Repositories
{
    public class RatingRepository : IRatingRepository
    {
        private readonly ApplicationDbContext _context;

        public RatingRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Rating> CreateAsync(Rating rating)
        {
            _context.Ratings.Add(rating);
            await _context.SaveChangesAsync();

            // Update stats after creating rating
            await UpdateStatsAsync(rating.RevieweeId);

            return rating;
        }

        public async Task<Rating?> GetByIdAsync(Guid ratingId)
        {
            return await _context.Ratings
                .Include(r => r.Order)
                .Include(r => r.Reviewer)
                .Include(r => r.Reviewee)
                .FirstOrDefaultAsync(r => r.Id == ratingId);
        }

        public async Task<Rating?> GetByOrderAndReviewerAsync(Guid orderId, Guid reviewerId)
        {
            return await _context.Ratings
                .FirstOrDefaultAsync(r => r.OrderId == orderId && r.ReviewerId == reviewerId);
        }

        public async Task<List<Rating>> GetByUserAsync(Guid userId, int page = 1, int pageSize = 10, string? sortBy = "date", string? sortDir = "desc")
        {
            var query = _context.Ratings
                .Where(r => r.RevieweeId == userId)
                .Include(r => r.Order)
                .Include(r => r.Reviewer)
                .AsQueryable();

            // Apply sorting
            query = sortBy?.ToLower() switch
            {
                "score" => sortDir?.ToLower() == "asc" 
                    ? query.OrderBy(r => r.Score) 
                    : query.OrderByDescending(r => r.Score),
                _ => sortDir?.ToLower() == "asc" 
                    ? query.OrderBy(r => r.CreatedAt) 
                    : query.OrderByDescending(r => r.CreatedAt)
            };

            // Apply pagination
            return await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<List<Rating>> GetByOrderAsync(Guid orderId)
        {
            return await _context.Ratings
                .Where(r => r.OrderId == orderId)
                .Include(r => r.Reviewer)
                .Include(r => r.Reviewee)
                .ToListAsync();
        }

        public async Task<RatingStats?> GetStatsAsync(Guid userId)
        {
            var stats = await _context.RatingStats
                .FirstOrDefaultAsync(s => s.UserId == userId);

            if (stats == null)
            {
                // Create default stats if none exist
                stats = new RatingStats(userId);
                _context.RatingStats.Add(stats);
                await _context.SaveChangesAsync();
            }

            return stats;
        }

        public async Task<Rating> UpdateAsync(Rating rating)
        {
            _context.Entry(rating).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            // Update stats after updating rating
            await UpdateStatsAsync(rating.RevieweeId);

            return rating;
        }

        public async Task DeleteAsync(Guid ratingId)
        {
            var rating = await _context.Ratings.FindAsync(ratingId);
            if (rating != null)
            {
                var revieweeId = rating.RevieweeId;
                _context.Ratings.Remove(rating);
                await _context.SaveChangesAsync();

                // Update stats after deleting rating
                await UpdateStatsAsync(revieweeId);
            }
        }

        public async Task<bool> CanUserRateAsync(Guid orderId, Guid reviewerId, Guid revieweeId)
        {
            // Check if order exists and is in valid status
            var order = await _context.Orders.FindAsync(orderId);
            if (order == null) return false;

            // Only completed, rejected, or cancelled orders can be rated
            var validStatuses = new[] { OrderStatus.Completed, OrderStatus.Rejected, OrderStatus.Cancelled };
            if (!validStatuses.Contains(order.Status)) return false;

            // Check if user is part of the order
            if (order.BuyerId != reviewerId && order.SellerId != reviewerId) return false;

            // Check if already rated
            var existingRating = await GetByOrderAndReviewerAsync(orderId, reviewerId);
            if (existingRating != null) return false;

            // Check 30-day window from completion (use LastModifiedAt if present, otherwise CreatedAt)
            var referenceTime = order.LastModifiedAt ?? order.CreatedAt;
            var deadline = referenceTime.AddDays(30);
            if (DateTime.UtcNow > deadline) return false;

            return true;
        }

        public async Task<DateTime?> GetRatingDeadlineAsync(Guid orderId)
        {
            var order = await _context.Orders.FindAsync(orderId);
            if (order == null) return null;

            // Return 30 days after completion/last modification or creation
            var referenceTime = order.LastModifiedAt ?? order.CreatedAt;
            return referenceTime.AddDays(30);
        }

        public async Task UpdateStatsAsync(Guid userId)
        {
            var ratings = await _context.Ratings
                .Where(r => r.RevieweeId == userId)
                .ToListAsync();

            var stats = await _context.RatingStats
                .FirstOrDefaultAsync(s => s.UserId == userId);

            if (stats == null)
            {
                stats = new RatingStats(userId);
                _context.RatingStats.Add(stats);
            }

            if (ratings.Any())
            {
                // Calculate stats
                var averageRating = (decimal)ratings.Average(r => r.Score);
                var totalRatings = ratings.Count;

                // Distribution
                var fiveStarCount = ratings.Count(r => r.Score == 5);
                var fourStarCount = ratings.Count(r => r.Score == 4);
                var threeStarCount = ratings.Count(r => r.Score == 3);
                var twoStarCount = ratings.Count(r => r.Score == 2);
                var oneStarCount = ratings.Count(r => r.Score == 1);

                // Category averages
                var categoryGroups = ratings.GroupBy(r => r.Category);
                decimal communicationAvg = 0, reliabilityAvg = 0, qualityAvg = 0, speedAvg = 0, overallAvg = 0;
                
                foreach (var group in categoryGroups)
                {
                    var avg = (decimal)group.Average(r => r.Score);
                    switch (group.Key.ToLower())
                    {
                        case "communication":
                            communicationAvg = avg;
                            break;
                        case "reliability":
                            reliabilityAvg = avg;
                            break;
                        case "quality":
                            qualityAvg = avg;
                            break;
                        case "speed":
                            speedAvg = avg;
                            break;
                        case "overall":
                            overallAvg = avg;
                            break;
                    }
                }

                // Role-based stats
                var asBuyerRatings = ratings.Where(r => r.RevieweeRole.ToLower() == "buyer").ToList();
                var asBuyerAverage = asBuyerRatings.Any() ? (decimal)asBuyerRatings.Average(r => r.Score) : 0;
                var asBuyerCount = asBuyerRatings.Count;

                var asSellerRatings = ratings.Where(r => r.RevieweeRole.ToLower() == "seller").ToList();
                var asSellerAverage = asSellerRatings.Any() ? (decimal)asSellerRatings.Average(r => r.Score) : 0;
                var asSellerCount = asSellerRatings.Count;

                stats.UpdateStats(
                    averageRating,
                    totalRatings,
                    fiveStarCount,
                    fourStarCount,
                    threeStarCount,
                    twoStarCount,
                    oneStarCount,
                    communicationAvg,
                    reliabilityAvg,
                    qualityAvg,
                    speedAvg,
                    overallAvg,
                    asBuyerAverage,
                    asBuyerCount,
                    asSellerAverage,
                    asSellerCount
                );
            }
            else
            {
                // Reset to defaults if no ratings
                stats.UpdateStats(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
            }

            await _context.SaveChangesAsync();
        }

        public async Task<int> GetTotalCountAsync(Guid userId)
        {
            return await _context.Ratings.CountAsync(r => r.RevieweeId == userId);
        }
    }
}

