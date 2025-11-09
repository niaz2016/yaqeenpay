using MediatR;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Application.Common.Models;
using TechTorio.Domain.Enums;

namespace TechTorio.Application.Features.Wallets.Commands.CreateWallet
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
                request.UserId = _currentUserService.UserId;
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