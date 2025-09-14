using MediatR;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Common.Models;
using YaqeenPay.Domain.Interfaces;

namespace YaqeenPay.Application.Features.Wallets.Queries.GetTopUpHistory
{
    public class GetTopUpHistoryQueryHandler : IRequestHandler<GetTopUpHistoryQuery, PaginatedList<TopUpDto>>
    {
        private readonly IWalletService _walletService;
        private readonly ICurrentUserService _currentUserService;
        private readonly ITopUpRepository _topUpRepository;

        public GetTopUpHistoryQueryHandler(
            IWalletService walletService,
            ICurrentUserService currentUserService,
            ITopUpRepository topUpRepository)
        {
            _walletService = walletService;
            _currentUserService = currentUserService;
            _topUpRepository = topUpRepository;
        }

        public async Task<PaginatedList<TopUpDto>> Handle(GetTopUpHistoryQuery request, CancellationToken cancellationToken)
        {
            var userId = _currentUserService.UserId ?? throw new UnauthorizedAccessException("User is not authenticated");
            
            // Get total count
            var totalCount = await _topUpRepository.GetTopUpCountByUserIdAsync(userId);
            
            // Get top-ups
            var topUps = await _topUpRepository.GetByUserIdAsync(
                userId, 
                request.PageNumber, 
                request.PageSize);
            
            // Map to DTOs
            var topUpDtos = topUps.Select(t => new TopUpDto
            {
                Id = t.Id,
                UserId = t.UserId,
                WalletId = t.WalletId,
                Amount = t.Amount.Amount,
                Currency = t.Amount.Currency,
                Channel = t.Channel,
                Status = t.Status,
                ExternalReference = t.ExternalReference,
                RequestedAt = t.RequestedAt,
                ConfirmedAt = t.ConfirmedAt,
                FailedAt = t.FailedAt,
                FailureReason = t.FailureReason
            }).ToList();
            
            return new PaginatedList<TopUpDto>(
                topUpDtos, 
                totalCount, 
                request.PageNumber, 
                request.PageSize);
        }
    }
}