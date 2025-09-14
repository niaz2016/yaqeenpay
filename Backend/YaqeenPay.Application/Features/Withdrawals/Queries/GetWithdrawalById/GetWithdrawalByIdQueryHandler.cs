using MediatR;
using Microsoft.EntityFrameworkCore;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Common.Models;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace YaqeenPay.Application.Features.Withdrawals.Queries.GetWithdrawalById
{
    public class GetWithdrawalByIdQueryHandler : IRequestHandler<GetWithdrawalByIdQuery, WithdrawalDto?>
    {
        private readonly IApplicationDbContext _context;
        private readonly ICurrentUserService _currentUserService;

        public GetWithdrawalByIdQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
        {
            _context = context;
            _currentUserService = currentUserService;
        }

        public async Task<WithdrawalDto?> Handle(GetWithdrawalByIdQuery request, CancellationToken cancellationToken)
        {
            var userId = _currentUserService.UserId;

            var withdrawal = await _context.Withdrawals
                .AsNoTracking()
                .FirstOrDefaultAsync(w => w.Id == request.WithdrawalId && w.SellerId == userId, cancellationToken);

            if (withdrawal == null)
                return null;

            return new WithdrawalDto
            {
                Id = withdrawal.Id,
                SellerId = withdrawal.SellerId,
                Amount = withdrawal.Amount.Amount,
                Currency = withdrawal.Amount.Currency,
                Channel = withdrawal.Channel,
                ChannelReference = withdrawal.ChannelReference,
                Reference = withdrawal.Reference,
                Status = withdrawal.Status,
                RequestedAt = withdrawal.RequestedAt,
                SettledAt = withdrawal.SettledAt,
                FailedAt = withdrawal.FailedAt,
                FailureReason = withdrawal.FailureReason,
                CreatedAt = withdrawal.CreatedAt,
                UpdatedAt = withdrawal.LastModifiedAt ?? withdrawal.CreatedAt
            };
        }
    }
}