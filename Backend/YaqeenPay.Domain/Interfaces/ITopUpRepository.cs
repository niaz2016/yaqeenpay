using YaqeenPay.Domain.Entities;
using YaqeenPay.Domain.Enums;

namespace YaqeenPay.Domain.Interfaces
{
    public interface ITopUpRepository
    {
        Task<TopUp?> GetByIdAsync(Guid id);
        Task<IEnumerable<TopUp>> GetByUserIdAsync(Guid userId, int page = 1, int pageSize = 20);
        Task<IEnumerable<TopUp>> GetByStatusAsync(TopUpStatus status, int page = 1, int pageSize = 20);
        Task<TopUp> CreateAsync(TopUp topUp);
        Task UpdateAsync(TopUp topUp);
        Task<int> GetTopUpCountByUserIdAsync(Guid userId);
        Task<TopUp?> GetByExternalReferenceAsync(string externalReference);
    }
}