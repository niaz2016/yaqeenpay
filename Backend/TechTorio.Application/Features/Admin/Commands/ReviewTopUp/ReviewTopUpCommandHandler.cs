using MediatR;
using System.Threading;
using System.Threading.Tasks;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Domain.Enums;

namespace TechTorio.Application.Features.Admin.Commands.ReviewTopUp
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

            // Only allow review if status is PendingAdminApproval
            if (topUp.Status != TechTorio.Domain.Enums.TopUpStatus.PendingAdminApproval)
                return false;

            if (request.ReviewStatus == TopUpReviewStatus.Paid)
            {
                // Confirm the top-up
                await _walletService.TopUpConfirmAsync(topUp.Id, "AdminApproved");
            }
            else if (request.ReviewStatus == TopUpReviewStatus.NotPaid)
            {
                await _walletService.TopUpFailAsync(topUp.Id, request.Notes ?? "Marked as Not Paid by Admin");
            }
            else if (request.ReviewStatus == TopUpReviewStatus.Suspicious)
            {
                // Mark as Failed with Suspicious note
                await _walletService.TopUpFailAsync(topUp.Id, request.Notes ?? "Marked as Suspicious by Admin");
            }
            return true;
        }
    }
}
