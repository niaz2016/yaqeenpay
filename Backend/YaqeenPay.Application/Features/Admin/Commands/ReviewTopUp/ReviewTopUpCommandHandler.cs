using MediatR;
using System.Threading;
using System.Threading.Tasks;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Domain.Enums;

namespace YaqeenPay.Application.Features.Admin.Commands.ReviewTopUp
{
    public class ReviewTopUpCommandHandler : IRequestHandler<ReviewTopUpCommand, bool>
    {
        private readonly IWalletService _walletService;
        public ReviewTopUpCommandHandler(IWalletService walletService)
        {
            _walletService = walletService;
        }

        public async Task<bool> Handle(ReviewTopUpCommand request, CancellationToken cancellationToken)
        {
            var topUp = await _walletService.GetTopUpAsync(request.TopUpId);
            if (topUp == null)
                return false;

            if (request.ReviewStatus == TopUpReviewStatus.Paid)
            {
                // Only credit wallet if not already confirmed
                if (topUp.Status != YaqeenPay.Domain.Enums.TopUpStatus.Confirmed)
                {
                    await _walletService.TopUpConfirmAsync(topUp.Id, "AdminApproved");
                }
            }
            else if (request.ReviewStatus == TopUpReviewStatus.NotPaid)
            {
                if (topUp.Status != YaqeenPay.Domain.Enums.TopUpStatus.Failed)
                {
                    await _walletService.TopUpFailAsync(topUp.Id, request.Notes ?? "Marked as Not Paid by Admin");
                }
            }
            else if (request.ReviewStatus == TopUpReviewStatus.Suspicious)
            {
                // Optionally, set to Failed or another status, or just log/flag for further review
                // For now, mark as Failed with Suspicious note
                if (topUp.Status != YaqeenPay.Domain.Enums.TopUpStatus.Failed)
                {
                    await _walletService.TopUpFailAsync(topUp.Id, request.Notes ?? "Marked as Suspicious by Admin");
                }
            }
            return true;
        }
    }
}
