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
            var userId = _currentUserService.UserId ?? throw new UnauthorizedAccessException("User is not authenticated");
            
            // Create Money object for the credit operation
            var topUpAmount = new Money(request.Amount, request.Currency);
            
            // Use wallet service to handle top-up properly with transactions
            var topUpId = await _walletService.TopUpInitiateAsync(userId, topUpAmount, request.Channel);
            
            // Complete the top-up immediately (since we're not doing real payment processing)
            await _walletService.TopUpConfirmAsync(topUpId, $"TOP-{DateTime.UtcNow.Ticks}");
            
            // Get the updated wallet to return current state
            var wallet = await _walletService.GetWalletByUserIdAsync(userId);
            
            var topUpDto = new TopUpDto
            {
                Id = topUpId,
                UserId = userId,
                WalletId = wallet!.Id,
                Amount = request.Amount,
                Currency = request.Currency,
                Channel = request.Channel,
                Status = TopUpStatus.Confirmed,
                ExternalReference = $"TOP-{DateTime.UtcNow.Ticks}",
                RequestedAt = DateTime.UtcNow,
                ConfirmedAt = DateTime.UtcNow
            };

            return topUpDto;
        }
    }
}