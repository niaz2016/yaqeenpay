using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;
using YaqeenPay.Application.Common.Interfaces;

namespace YaqeenPay.Application.Features.Admin.Commands.ApproveWithdrawal
{
    public class ApproveWithdrawalCommandHandler : IRequestHandler<ApproveWithdrawalCommand, bool>
    {
        private readonly IApplicationDbContext _context;

        public ApproveWithdrawalCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> Handle(ApproveWithdrawalCommand request, CancellationToken cancellationToken)
        {
            var withdrawal = await _context.Withdrawals.FirstOrDefaultAsync(w => w.Id == request.WithdrawalId, cancellationToken);
            if (withdrawal == null)
                return false;

            // Allow admin to approve when withdrawal is Initiated or PendingProvider.
            // If Initiated, first move it to PendingProvider then settle.
            try
            {
                // Use domain methods which enforce state transitions
                var status = withdrawal.Status;
                if (status == YaqeenPay.Domain.Entities.WithdrawalStatus.Initiated)
                {
                    withdrawal.SetPendingProvider(request.ChannelReference ?? string.Empty);
                    // Now it is PendingProvider; fallthrough to settle
                }

                if (withdrawal.Status == YaqeenPay.Domain.Entities.WithdrawalStatus.PendingProvider)
                {
                    withdrawal.SetSettled(request.ChannelReference ?? string.Empty);
                }
                else
                {
                    // If it's not in a state we can settle, fail
                    return false;
                }
            }
            catch
            {
                return false;
            }

            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }
    }
}
