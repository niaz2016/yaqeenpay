using MediatR;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Common.Models;
using YaqeenPay.Domain.Enums;
using YaqeenPay.Domain.Interfaces;

namespace YaqeenPay.Application.Features.Wallets.Queries.GetTransactionHistory
{
    public class GetTransactionHistoryQueryHandler : IRequestHandler<GetTransactionHistoryQuery, PaginatedList<TransactionDto>>
    {
        private readonly IWalletService _walletService;
        private readonly ICurrentUserService _currentUserService;
        private readonly IWalletTransactionRepository _transactionRepository;

        public GetTransactionHistoryQueryHandler(
            IWalletService walletService,
            ICurrentUserService currentUserService,
            IWalletTransactionRepository transactionRepository)
        {
            _walletService = walletService;
            _currentUserService = currentUserService;
            _transactionRepository = transactionRepository;
        }

        public async Task<PaginatedList<TransactionDto>> Handle(GetTransactionHistoryQuery request, CancellationToken cancellationToken)
        {
            var userId = _currentUserService.UserId;
            
            Guid walletId;
            
            if (request.WalletId.HasValue)
            {
                walletId = request.WalletId.Value;
            }
            else
            {
                // Get user's wallet (unified system)
                var wallet = await _walletService.GetWalletByUserIdAsync(userId);
                if (wallet == null)
                {
                    // Create wallet if it doesn't exist
                    wallet = await _walletService.CreateWalletAsync(userId, "PKR");
                }
                
                walletId = wallet.Id;
            }
            
            // Get the wallet
            var targetWallet = await _walletService.GetWalletAsync(walletId);
            if (targetWallet == null)
            {
                throw new InvalidOperationException($"Wallet not found with ID {walletId}");
            }
            
            // Ensure the wallet belongs to the current user
            if (targetWallet.UserId != userId)
            {
                throw new UnauthorizedAccessException("You do not have permission to access this wallet");
            }
            
            // Get total count
            var totalCount = await _transactionRepository.GetTransactionCountByWalletIdAsync(walletId);
            
            // Get transactions
            var transactions = await _walletService.GetTransactionHistoryAsync(
                walletId, 
                request.PageNumber, 
                request.PageSize);
            
            // Map to DTOs
            var transactionDtos = transactions.Select(t => new TransactionDto
            {
                Id = t.Id,
                WalletId = t.WalletId,
                Type = t.Type,
                Amount = t.Amount.Amount,
                Currency = t.Amount.Currency,
                Reason = t.Reason,
                ReferenceId = t.ReferenceId,
                ReferenceType = t.ReferenceType,
                ExternalReference = t.ExternalReference,
                CreatedAt = t.CreatedAt
            }).ToList();
            
            return new PaginatedList<TransactionDto>(
                transactionDtos, 
                totalCount, 
                request.PageNumber, 
                request.PageSize);
        }
    }
}