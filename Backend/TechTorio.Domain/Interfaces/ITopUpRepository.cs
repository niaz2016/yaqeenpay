    /// <summary>
    /// Returns all top-ups in the system (admin only)
    /// </summary>
using TechTorio.Domain.Entities;
using TechTorio.Domain.Enums;

namespace TechTorio.Domain.Interfaces
{
    public interface ITopUpRepository
    {
    Task<IEnumerable<TopUp>> GetAllAsync(int page = 1, int pageSize = 100);

        Task<TopUp?> GetByIdAsync(Guid id);
        Task<IEnumerable<TopUp>> GetByUserIdAsync(Guid userId, int page = 1, int pageSize = 20);
        Task<IEnumerable<TopUp>> GetByStatusAsync(TopUpStatus status, int page = 1, int pageSize = 20);
        Task<TopUp> CreateAsync(TopUp topUp);
        Task UpdateAsync(TopUp topUp);
        Task<int> GetTopUpCountByUserIdAsync(Guid userId);
        Task<TopUp?> GetByExternalReferenceAsync(string externalReference);
    }
}