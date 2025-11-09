using MediatR;
using TechTorio.Application.Common.Models;

namespace TechTorio.Application.Features.Wallets.Queries.GetWalletAnalytics
{
    public class GetWalletAnalyticsQuery : IRequest<WalletAnalyticsDto>
    {
        public int Days { get; set; } = 30;
    }
}