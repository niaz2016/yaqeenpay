using MediatR;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Common.Models;
using YaqeenPay.Domain.Enums;
using YaqeenPay.Domain.ValueObjects;

namespace YaqeenPay.Application.Features.Wallets.Commands.TopUpWallet
{
    public class TopUpWalletCommandHandler : IRequestHandler<TopUpWalletCommand, TopUpDto>
    {
        private readonly IWalletService _walletService;
        private readonly ICurrentUserService _currentUserService;
        private readonly IApplicationDbContext _context;

        public TopUpWalletCommandHandler(
            IWalletService walletService,
            ICurrentUserService currentUserService,
            IApplicationDbContext context)
        {
            _walletService = walletService;
            _currentUserService = currentUserService;
            _context = context;
        }

        public async Task<TopUpDto> Handle(TopUpWalletCommand request, CancellationToken cancellationToken)
        {
            var userId = _currentUserService.UserId;

            // Create Money object for the credit operation
            var topUpAmount = new Money(request.Amount, request.Currency);

            // Only initiate the top-up, do not confirm/credit yet
            var topUpId = await _walletService.TopUpInitiateAsync(userId, topUpAmount, request.Channel);

            // Get the wallet (for WalletId)
            var wallet = await _walletService.GetWalletByUserIdAsync(userId);

            var topUpDto = new TopUpDto
            {
                Id = topUpId,
                UserId = userId,
                WalletId = wallet!.Id,
                Amount = request.Amount,
                Currency = request.Currency,
                Channel = request.Channel,
                Status = TopUpStatus.PendingConfirmation,
                RequestedAt = DateTime.UtcNow
            };

            return topUpDto;
        }
    }
}