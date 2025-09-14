using YaqeenPay.Domain.Entities;
using YaqeenPay.Domain.Enums;
using YaqeenPay.Domain.ValueObjects;

namespace YaqeenPay.Application.Common.Interfaces
{
    public interface IWalletService
    {
        Task<Wallet> CreateWalletAsync(Guid userId, string currency = "PKR");
        Task<Wallet?> GetWalletAsync(Guid walletId);
        Task<Wallet?> GetWalletByUserIdAsync(Guid userId);
        Task<Money?> GetBalanceAsync(Guid walletId);
        Task<bool> HasSufficientFundsAsync(Guid walletId, Money amount);
        
        Task<Guid> TopUpInitiateAsync(Guid userId, Money amount, TopUpChannel channel);
        Task<TopUp?> GetTopUpAsync(Guid topUpId);
        Task<IEnumerable<TopUp>> GetTopUpsByUserIdAsync(Guid userId, int page = 1, int pageSize = 20);
        Task<TopUp> TopUpConfirmAsync(Guid topUpId, string externalReference);
        Task<TopUp> TopUpFailAsync(Guid topUpId, string reason);
        
        Task<WalletTransaction> CreditWalletAsync(Guid walletId, Money amount, string reason, Guid? referenceId = null, string? referenceType = null);
        Task<WalletTransaction> DebitWalletAsync(Guid walletId, Money amount, string reason, Guid? referenceId = null, string? referenceType = null);
        Task<IEnumerable<WalletTransaction>> GetTransactionHistoryAsync(Guid walletId, int page = 1, int pageSize = 20);
        Task<IEnumerable<WalletTransaction>> GetTransactionHistoryAsync(Guid walletId, DateTime startDate, DateTime endDate);
        Task<IEnumerable<WalletTransaction>> GetTransactionHistoryAsync(Guid walletId);
    }
}