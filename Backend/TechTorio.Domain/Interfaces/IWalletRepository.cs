using TechTorio.Domain.Entities;
using TechTorio.Domain.ValueObjects;

namespace TechTorio.Domain.Interfaces
{
    public interface IWalletRepository
    {
        Task<Wallet?> GetByIdAsync(Guid id);
        Task<Wallet?> GetByUserIdAsync(Guid userId);
        Task<Wallet> CreateAsync(Wallet wallet);
        Task UpdateAsync(Wallet wallet);
        Task<Money?> GetBalanceAsync(Guid walletId);
        Task<bool> HasSufficientFundsAsync(Guid walletId, Money amount);
    }
}