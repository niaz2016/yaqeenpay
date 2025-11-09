using MediatR;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Application.Common.Models;
using TechTorio.Domain.Enums;

namespace TechTorio.Application.Features.Wallets.Queries.GetWalletBalance
{
    public class GetWalletBalanceQueryHandler : IRequestHandler<GetWalletBalanceQuery, WalletBalanceDto>
    {
        private readonly IWalletService _walletService;
        private readonly ICurrentUserService _currentUserService;

        public GetWalletBalanceQueryHandler(
            IWalletService walletService,
            ICurrentUserService currentUserService)
        {
            _walletService = walletService;
            _currentUserService = currentUserService;
        }

        public async Task<WalletBalanceDto> Handle(GetWalletBalanceQuery request, CancellationToken cancellationToken)
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
            
            // Get the balance
            var balance = targetWallet.Balance;
            
            return new WalletBalanceDto
            {
                WalletId = walletId,
                Balance = balance.Amount,
                Currency = balance.Currency
                // Remove Type property as it no longer exists in unified wallet system
            };
        }
    }
}