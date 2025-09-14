using MediatR;
using Microsoft.EntityFrameworkCore;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Domain.ValueObjects;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace YaqeenPay.Application.Features.Admin.Commands.LedgerAdjustment
{
    public class LedgerAdjustmentCommandHandler : IRequestHandler<LedgerAdjustmentCommand, LedgerAdjustmentResponse>
    {
        private readonly IApplicationDbContext _dbContext;
        private readonly IWalletService _walletService;
        private readonly ICurrentUserService _currentUserService;

        public LedgerAdjustmentCommandHandler(IApplicationDbContext dbContext, IWalletService walletService, ICurrentUserService currentUserService)
        {
            _dbContext = dbContext;
            _walletService = walletService;
            _currentUserService = currentUserService;
        }

        public async Task<LedgerAdjustmentResponse> Handle(LedgerAdjustmentCommand request, CancellationToken cancellationToken)
        {
            var adminId = _currentUserService.UserId;
            if (adminId == null)
                return new LedgerAdjustmentResponse { Success = false, Message = "Unauthorized" };

            var wallet = await _walletService.GetWalletByUserIdAsync(request.UserId);
            if (wallet == null)
                return new LedgerAdjustmentResponse { Success = false, Message = "Wallet not found" };

            var amount = new Money(request.Amount, request.Currency);
            try
            {
                if (request.IsCredit)
                {
                    wallet.Credit(amount, $"Admin adjustment: {request.Reason}");
                }
                else
                {
                    wallet.Debit(amount, $"Admin adjustment: {request.Reason}");
                }
                await _dbContext.SaveChangesAsync(cancellationToken);
                // TODO: Add audit log entry here
                return new LedgerAdjustmentResponse { Success = true, Message = "Ledger adjusted successfully" };
            }
            catch (Exception ex)
            {
                return new LedgerAdjustmentResponse { Success = false, Message = ex.Message };
            }
        }
    }
}