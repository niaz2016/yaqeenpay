using MediatR;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Application.Common.Models;
using TechTorio.Domain.Enums;

namespace TechTorio.Application.Features.Wallets.Queries.GetWalletSummary
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
            var userId = _currentUserService.UserId;
            
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