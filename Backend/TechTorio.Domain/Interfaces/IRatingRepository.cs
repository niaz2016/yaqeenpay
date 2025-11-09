using TechTorio.Domain.Entities;

namespace TechTorio.Domain.Interfaces
{
    public interface IRatingRepository
    {
        Task<Rating> CreateAsync(Rating rating);
        Task<Rating?> GetByIdAsync(Guid ratingId);
        Task<Rating?> GetByOrderAndReviewerAsync(Guid orderId, Guid reviewerId);
        Task<List<Rating>> GetByUserAsync(Guid userId, int page = 1, int pageSize = 10, string? sortBy = "date", string? sortDir = "desc");
        Task<List<Rating>> GetByOrderAsync(Guid orderId);
        Task<RatingStats?> GetStatsAsync(Guid userId);
        Task<Rating> UpdateAsync(Rating rating);
        Task DeleteAsync(Guid ratingId);
        Task<bool> CanUserRateAsync(Guid orderId, Guid reviewerId, Guid revieweeId);
        Task<DateTime?> GetRatingDeadlineAsync(Guid orderId);
        Task UpdateStatsAsync(Guid userId);
        Task<int> GetTotalCountAsync(Guid userId);
    }
}
