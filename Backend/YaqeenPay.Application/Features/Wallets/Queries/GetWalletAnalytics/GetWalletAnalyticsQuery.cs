using MediatR;
using YaqeenPay.Application.Common.Models;

namespace YaqeenPay.Application.Features.Wallets.Queries.GetWalletAnalytics
{
    public class GetWalletAnalyticsQuery : IRequest<WalletAnalyticsDto>
    {
        public int Days { get; set; } = 30;
    }
}