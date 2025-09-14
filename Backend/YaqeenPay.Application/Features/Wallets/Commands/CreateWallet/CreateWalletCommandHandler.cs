using MediatR;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Common.Models;
using YaqeenPay.Domain.Enums;

namespace YaqeenPay.Application.Features.Wallets.Commands.CreateWallet
{
    public class CreateWalletCommandHandler : IRequestHandler<CreateWalletCommand, WalletDto>
    {
        private readonly IWalletService _walletService;
        private readonly ICurrentUserService _currentUserService;

        public CreateWalletCommandHandler(
            IWalletService walletService,
            ICurrentUserService currentUserService)
        {
            _walletService = walletService;
            _currentUserService = currentUserService;
        }

        public async Task<WalletDto> Handle(CreateWalletCommand request, CancellationToken cancellationToken)
        {
            // Get the current user ID if not specified
            if (request.UserId == Guid.Empty)
            {
                request.UserId = _currentUserService.UserId ?? throw new UnauthorizedAccessException("User is not authenticated");
            }

            // Create the wallet (unified system)
            var wallet = await _walletService.CreateWalletAsync(request.UserId, request.Currency);

            // Map to DTO
            return new WalletDto
            {
                Id = wallet.Id,
                UserId = wallet.UserId,
                Balance = wallet.Balance.Amount,
                Currency = wallet.Balance.Currency,
                IsActive = wallet.IsActive,
                CreatedAt = wallet.CreatedAt
            };
        }
    }
}