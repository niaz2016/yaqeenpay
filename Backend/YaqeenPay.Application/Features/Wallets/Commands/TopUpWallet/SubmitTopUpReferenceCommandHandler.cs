using MediatR;
using Microsoft.EntityFrameworkCore;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Common.Models;

namespace YaqeenPay.Application.Features.Wallets.Commands.TopUpWallet
{
    public class SubmitTopUpReferenceCommandHandler(IApplicationDbContext db) : IRequestHandler<SubmitTopUpReferenceCommand, TopUpDto>
    {
        private readonly IApplicationDbContext _db = db;

        public async Task<TopUpDto> Handle(SubmitTopUpReferenceCommand request, CancellationToken cancellationToken)
        {
            var topUp = await _db.TopUps.FirstOrDefaultAsync(t => t.Id == request.TopUpId, cancellationToken);
            if (topUp is null)
                throw new InvalidOperationException($"Top-up not found: {request.TopUpId}");

            topUp.SubmitReference(request.TransactionId);
            await _db.SaveChangesAsync(cancellationToken);

            return new TopUpDto
            {
                Id = topUp.Id,
                UserId = topUp.UserId,
                WalletId = topUp.WalletId,
                Amount = topUp.Amount.Amount,
                Currency = topUp.Amount.Currency,
                Channel = topUp.Channel,
                Status = topUp.Status,
                ExternalReference = topUp.ExternalReference,
                RequestedAt = topUp.RequestedAt,
                ConfirmedAt = topUp.ConfirmedAt,
                FailedAt = topUp.FailedAt,
                FailureReason = topUp.FailureReason
            };
        }
    }
}
