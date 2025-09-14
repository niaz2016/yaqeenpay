using System;
using System.Threading.Tasks;
using YaqeenPay.Domain.Entities;
using YaqeenPay.Domain.ValueObjects;

namespace YaqeenPay.Domain.Interfaces
{
    public interface ILedgerService
    {
        Task<bool> TransferFundsAsync(
            Guid fromAccountId, 
            Guid toAccountId, 
            Money amount, 
            ReferenceType referenceType, 
            Guid referenceId, 
            string? description = null);
            
        Task<bool> TopUpBuyerWalletAsync(
            Guid buyerId, 
            Money amount, 
            string paymentReference);
            
        Task<bool> CreateEscrowPaymentAsync(
            Guid escrowId, 
            Guid buyerId, 
            Guid sellerId, 
            Money amount, 
            decimal feeRate);
            
        Task<bool> ReleaseEscrowToSellerAsync(
            Guid escrowId);
            
        Task<bool> RefundEscrowToBuyerAsync(
            Guid escrowId);

        Task<Money> GetAccountBalanceAsync(Guid accountId);
        Task<Money> GetBuyerBalanceAsync(Guid buyerId);
        Task<Money> GetSellerBalanceAsync(Guid sellerId);
    }
}