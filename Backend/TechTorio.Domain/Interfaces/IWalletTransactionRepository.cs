using TechTorio.Domain.Entities;

namespace TechTorio.Domain.Interfaces
{
    public interface IWalletTransactionRepository
    {
        Task<WalletTransaction?> GetByIdAsync(Guid id);
        Task<IEnumerable<WalletTransaction>> GetByWalletIdAsync(Guid walletId, int page = 1, int pageSize = 20);
        Task<WalletTransaction> CreateAsync(WalletTransaction transaction);
        Task<int> GetTransactionCountByWalletIdAsync(Guid walletId);
    }
}