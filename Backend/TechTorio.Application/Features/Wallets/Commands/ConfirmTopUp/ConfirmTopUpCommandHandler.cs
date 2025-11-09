using MediatR;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Application.Common.Models;

namespace TechTorio.Application.Features.Wallets.Commands.ConfirmTopUp
{
    public class ConfirmTopUpCommandHandler : IRequestHandler<ConfirmTopUpCommand, TopUpDto>
    {
        private readonly IWalletService _walletService;

        public ConfirmTopUpCommandHandler(IWalletService walletService)
        {
            _walletService = walletService;
        }

        public async Task<TopUpDto> Handle(ConfirmTopUpCommand request, CancellationToken cancellationToken)
        {
            // Confirm the top-up
            var topUp = await _walletService.TopUpConfirmAsync(request.TopUpId, request.ExternalReference);
            
            // Map to DTO
            return new TopUpDto
            {
                Id = topUp.Id,
                UserId = topUp.UserId,
                WalletId = topUp.WalletId,
                Amount = topUp.Amount.Amount,
                Currency = topUp.Amount.Currency,
                Channel = topUp.Channel,
                Status = topUp.Status,
                RequestedAt = topUp.RequestedAt,
                ConfirmedAt = topUp.ConfirmedAt,
                ExternalReference = topUp.ExternalReference
            };
        }
    }
}