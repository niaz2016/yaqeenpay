using MediatR;
using Microsoft.EntityFrameworkCore;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Application.Common.Models;

namespace TechTorio.Application.Features.Withdrawals.Queries.GetWithdrawals
{
    public class GetWithdrawalsQueryHandler : IRequestHandler<GetWithdrawalsQuery, List<WithdrawalDto>>
    {
        private readonly IApplicationDbContext _context;
        private readonly ICurrentUserService _currentUserService;

        public GetWithdrawalsQueryHandler(
            IApplicationDbContext context,
            ICurrentUserService currentUserService)
        {
            _context = context;
            _currentUserService = currentUserService;
        }

        public async Task<List<WithdrawalDto>> Handle(GetWithdrawalsQuery request, CancellationToken cancellationToken)
        {
            var userId = _currentUserService.UserId;

            var withdrawals = await _context.Withdrawals
                .Where(w => w.SellerId == userId)
                .OrderByDescending(w => w.RequestedAt)
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(w => new WithdrawalDto
                {
                    Id = w.Id,
                    SellerId = w.SellerId,
                    Amount = w.Amount.Amount,
                    Currency = w.Amount.Currency,
                    Channel = w.Channel,
                    ChannelReference = w.ChannelReference,
                    Reference = w.Reference,
                    Status = w.Status,
                    RequestedAt = w.RequestedAt,
                    SettledAt = w.SettledAt,
                    FailedAt = w.FailedAt,
                    FailureReason = w.FailureReason,
                    CreatedAt = w.CreatedAt,
                    UpdatedAt = w.LastModifiedAt ?? w.CreatedAt
                })
                .ToListAsync(cancellationToken);

            return withdrawals;
        }
    }
}