using MediatR;
using Microsoft.EntityFrameworkCore;
using YaqeenPay.Application.Common.Interfaces;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace YaqeenPay.Application.Features.Withdrawals.Commands.CancelWithdrawal
{
    public class CancelWithdrawalCommandHandler : IRequestHandler<CancelWithdrawalCommand, bool>
    {
        private readonly IApplicationDbContext _context;
        private readonly ICurrentUserService _currentUserService;

        public CancelWithdrawalCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
        {
            _context = context;
            _currentUserService = currentUserService;
        }

        public async Task<bool> Handle(CancelWithdrawalCommand request, CancellationToken cancellationToken)
        {
            var userId = _currentUserService.UserId;

            var withdrawal = await _context.Withdrawals
                .FirstOrDefaultAsync(w => w.Id == request.WithdrawalId && w.SellerId == userId, cancellationToken);

            if (withdrawal == null)
                return false;

            // Only allow cancel if status is Initiated or PendingProvider
            if (withdrawal.Status != Domain.Entities.WithdrawalStatus.Initiated && withdrawal.Status != Domain.Entities.WithdrawalStatus.PendingProvider)
                return false;

            withdrawal.SetReversed("Cancelled by user");
            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }
    }
}