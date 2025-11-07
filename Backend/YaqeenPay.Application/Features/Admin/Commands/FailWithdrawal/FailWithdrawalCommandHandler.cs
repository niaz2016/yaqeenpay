using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Domain.ValueObjects;

namespace YaqeenPay.Application.Features.Admin.Commands.FailWithdrawal
{
    public class FailWithdrawalCommandHandler : IRequestHandler<FailWithdrawalCommand, bool>
 {
        private readonly IApplicationDbContext _context;
     private readonly IWalletService _walletService;
  private readonly IOutboxService _outboxService;

   public FailWithdrawalCommandHandler(
       IApplicationDbContext context, 
     IWalletService walletService,
       IOutboxService outboxService)
        {
          _context = context;
            _walletService = walletService;
     _outboxService = outboxService;
        }

 public async Task<bool> Handle(FailWithdrawalCommand request, CancellationToken cancellationToken)
   {
         var withdrawal = await _context.Withdrawals
    .AsTracking()
     .FirstOrDefaultAsync(w => w.Id == request.WithdrawalId, cancellationToken);
     
   if (withdrawal == null)
       return false;

      // Can only fail withdrawals that are Initiated or PendingProvider
       if (withdrawal.Status != YaqeenPay.Domain.Entities.WithdrawalStatus.Initiated && 
      withdrawal.Status != YaqeenPay.Domain.Entities.WithdrawalStatus.PendingProvider)
      {
        return false;
   }

    try
    {
          // Mark withdrawal as failed
     withdrawal.SetFailed(request.FailureReason);

 // Get user's wallet to credit back the amount
     var userWallet = await _walletService.GetWalletByUserIdAsync(withdrawal.SellerId);
        if (userWallet != null)
                {
        // Credit the withdrawal amount back to the wallet
      await _walletService.CreditWalletAsync(
 userWallet.Id,
    new Money(withdrawal.Amount.Amount, withdrawal.Amount.Currency),
$"Withdrawal failed refund - {withdrawal.Reference}",
 withdrawal.Id,
      "WithdrawalRefund");
        }

 await _context.SaveChangesAsync(cancellationToken);

    // Notify user about the failed withdrawal
    try
   {
        await _outboxService.EnqueueAsync(
             "WithdrawalFailed",
 new
 {
UserId = withdrawal.SellerId,
          WithdrawalId = withdrawal.Id,
       Amount = withdrawal.Amount.Amount,
      Currency = withdrawal.Amount.Currency,
             FailureReason = request.FailureReason,
     FailedAt = withdrawal.FailedAt
   },
  cancellationToken);
        }
    catch (Exception ex)
   {
    // Log but don't fail the operation
       Console.WriteLine($"Warning: Failed to enqueue withdrawal failed notification: {ex.Message}");
       }

 return true;
            }
   catch
            {
      return false;
 }
        }
    }
}