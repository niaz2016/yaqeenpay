using MediatR;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Common.Models;
using YaqeenPay.Domain.Enums;

namespace YaqeenPay.Application.Features.Wallets.Queries.GetWalletSummary
{
    public class GetWalletSummaryQueryHandler : IRequestHandler<GetWalletSummaryQuery, WalletSummaryDto>
    {
        private readonly IWalletService _walletService;
        private readonly ICurrentUserService _currentUserService;

        public GetWalletSummaryQueryHandler(
            IWalletService walletService,
            ICurrentUserService currentUserService)
        {
            _walletService = walletService;
            _currentUserService = currentUserService;
        }

        public async Task<WalletSummaryDto> Handle(GetWalletSummaryQuery request, CancellationToken cancellationToken)
        {
            var userId = _currentUserService.UserId ?? throw new UnauthorizedAccessException("User is not authenticated");
            
            // Get the user's wallet (unified wallet system)
            var wallet = await _walletService.GetWalletByUserIdAsync(userId);
            
            if (wallet == null)
            {
                // Create a wallet if it doesn't exist
                wallet = await _walletService.CreateWalletAsync(userId, "PKR");
            }

            // Map wallet status to string
            var status = wallet.IsActive ? "Active" : "Suspended";

            return new WalletSummaryDto
            {
                Balance = wallet.Balance.Amount,
                Currency = wallet.Balance.Currency,
                Status = status,
                UpdatedAt = wallet.UpdatedAt
            };
        }
    }
}